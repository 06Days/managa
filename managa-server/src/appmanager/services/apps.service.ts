import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as net from 'net';
import * as path from 'path';
import {
  AppComponentView,
  AppManifest,
  AppRecord,
  AppView,
  CatalogEntry,
  CatalogFile,
  ComponentKind,
  ComponentManifest,
  ComponentState,
  Job,
  LogsResult,
} from '../types';
import { PathsService } from './paths.service';
import { RegistryService } from './registry.service';
import { ManifestService } from './manifest.service';
import { ProcessService } from './process.service';
import { CommandService } from './command.service';
import { GithubService } from './github.service';
import { JobsService } from './jobs.service';

export interface InstallAppInput {
  url: string;
  ref?: string;
  start?: boolean;
}

interface AllocatedPorts {
  client?: number;
  server?: number;
}

@Injectable()
export class AppsService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(AppsService.name);
  private readonly busy = new Map<string, string>();
  private installLock = false;
  private autoStartTimer?: NodeJS.Timeout;

  constructor(
    private readonly paths: PathsService,
    private readonly registry: RegistryService,
    private readonly manifestService: ManifestService,
    private readonly processes: ProcessService,
    private readonly commands: CommandService,
    private readonly github: GithubService,
    private readonly jobs: JobsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.recoverStaleProcesses();
    await this.registerBuiltins();

    if (process.env.AUTO_START !== 'false') {
      this.autoStartTimer = setTimeout(() => {
        void this.autoStartEnabled();
      }, 1_500);
      this.autoStartTimer.unref?.();
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.autoStartTimer) clearTimeout(this.autoStartTimer);
    for (const app of this.registry.list()) {
      try {
        await this.stopComponents(app);
      } catch (error) {
        this.logger.warn(
          `Could not stop ${app.id} during shutdown: ${(error as Error).message}`,
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  getApps(): AppView[] {
    return this.registry.list().map((app) => {
      this.reconcile(app);
      return this.toView(app);
    });
  }

  getApp(id: string): AppView {
    const app = this.requireApp(id);
    this.reconcile(app);
    return this.toView(app);
  }

  getSummary() {
    const apps = this.getApps();
    return {
      installed: apps.length,
      enabled: apps.filter((app) => app.enabled).length,
      running: apps.filter((app) => app.overallStatus === 'running').length,
      errors: apps.filter((app) => app.overallStatus === 'error').length,
    };
  }

  async getLogs(
    id: string,
    component?: ComponentKind,
    lines = 200,
  ): Promise<LogsResult> {
    const app = this.requireApp(id);
    const kind: ComponentKind =
      component ??
      (app.manifest.server ? 'server' : app.manifest.client ? 'client' : 'server');

    if (!app.manifest[kind]) {
      throw new NotFoundException(`${app.name} has no ${kind} component`);
    }

    const logFile = this.paths.logFile(app.id, kind);
    const safeLines = Math.max(1, Math.min(2000, Number(lines) || 200));
    return {
      appId: app.id,
      component: kind,
      path: logFile,
      lines: await this.processes.tail(logFile, safeLines),
    };
  }

  getJob(id: string): Job {
    const job = this.jobs.get(id);
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  listJobs(): Job[] {
    return this.jobs.list();
  }

  async getCatalog(): Promise<{ apps: CatalogEntry[] }> {
    const entries = new Map<string, CatalogEntry>();

    try {
      const raw = await fs.readFile(this.paths.catalogFile, 'utf8');
      const parsed = JSON.parse(raw) as CatalogFile | CatalogEntry[];
      const apps = Array.isArray(parsed) ? parsed : parsed.apps ?? [];
      for (const entry of apps) {
        if (entry?.id) entries.set(entry.id, entry);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Could not read local catalog: ${(error as Error).message}`);
      }
    }

    if (process.env.MANAGA_CATALOG_URL) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5_000);
        const response = await fetch(process.env.MANAGA_CATALOG_URL, {
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (response.ok) {
          const json: any = await response.json();
          const apps: CatalogEntry[] = Array.isArray(json) ? json : json.apps ?? [];
          for (const entry of apps) {
            if (entry?.id) {
              entries.set(entry.id, { ...entries.get(entry.id), ...entry });
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Could not fetch remote catalog: ${(error as Error).message}`);
      }
    }

    return {
      apps: [...entries.values()]
        .map((entry) => ({
          ...entry,
          installed: this.registry.has(entry.id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  // ---------------------------------------------------------------------------
  // Install / uninstall
  // ---------------------------------------------------------------------------

  install(input: InstallAppInput): Job {
    if (process.env.MANAGA_ALLOW_GIT === 'false') {
      throw new BadRequestException('Git installs are disabled');
    }
    if (this.installLock) {
      throw new ConflictException('Another app install is already running');
    }

    const job = this.jobs.create(
      'install',
      `Installing ${input.url}`,
      undefined,
    );
    this.installLock = true;
    this.jobs.start(job);

    void this.performInstall(input, job)
      .catch((error) => this.jobs.fail(job, error))
      .finally(() => {
        this.installLock = false;
      });

    return job;
  }

  private async performInstall(
    input: InstallAppInput,
    job: Job,
  ): Promise<void> {
    const source = this.github.parse(input.url, input.ref);
    let tempDir: string | undefined;
    let destination: string | undefined;
    let installedId: string | undefined;
    let moved = false;
    let recordCreated = false;

    try {
      tempDir = path.join(this.paths.tmpDir, `install-${randomUUID()}`);
      this.jobs.progress(
        job,
        5,
        `Cloning ${source.owner}/${source.repo}${source.ref ? `#${source.ref}` : ''}`,
      );
      const clone = await this.github.clone(source, tempDir, (line) =>
        this.jobs.log(job, line),
      );

      this.jobs.progress(job, 20, 'Reading app manifest');
      const loaded = await this.manifestService.loadFromDirectory(tempDir);
      const manifest = loaded.manifest;
      const id = manifest.id!;
      installedId = id;

      if (this.registry.has(id)) {
        throw new ConflictException(
          `An app with id "${id}" is already installed`,
        );
      }

      const ports = await this.allocatePorts(manifest);
      destination = this.paths.appDir(id);
      if (fsSync.existsSync(destination)) {
        throw new ConflictException(
          `The app directory "${id}" already exists in the data directory`,
        );
      }

      this.jobs.progress(job, 28, 'Installing app files');
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.rename(tempDir, destination);
      tempDir = undefined;
      moved = true;

      const now = new Date().toISOString();
      const app = this.buildRecord({
        manifest,
        manifestPath: loaded.manifestPath,
        rootDir: destination,
        source: {
          type: 'github',
          url: source.url,
          ref: source.ref,
          commit: clone.commit,
        },
        ports,
        installedAt: now,
      });

      await this.registry.set(app);
      recordCreated = true;
      this.busy.set(id, job.id);

      this.jobs.progress(job, 40, 'Installing dependencies and building');
      await this.ensurePrepared(app, job);

      if (input.start) {
        this.jobs.progress(job, 85, 'Starting app');
        await this.performStart(id, job);
      }

      this.jobs.succeed(job, `${manifest.name} installed`);
    } catch (error) {
      if (recordCreated && installedId) {
        this.jobs.log(job, 'Rolling back the installation');
        await this.registry.remove(installedId).catch(() => undefined);
      }
      if (moved && destination) {
        await fs.rm(destination, { recursive: true, force: true }).catch(() => undefined);
      }
      throw error;
    } finally {
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
      }
      if (installedId) this.busy.delete(installedId);
    }
  }

  uninstall(id: string, purgeData = false): Job {
    this.assertIdle(id);
    const app = this.requireApp(id);
    const job = this.jobs.create('uninstall', `Uninstalling ${app.name}`, id);

    this.begin(id, job, async () => {
      const current = this.requireApp(id);
      current.enabled = false;
      current.updatedAt = new Date().toISOString();
      await this.registry.set(current);

      await this.stopComponents(current, job);

      if (current.source.type === 'github') {
        if (!this.paths.isInsideAppsDir(current.rootDir)) {
          throw new Error(
            `Refusing to delete "${current.rootDir}" because it is outside the managa apps directory`,
          );
        }
        this.jobs.log(job, `Deleting ${current.rootDir}`);
        await fs.rm(current.rootDir, { recursive: true, force: true });
      } else {
        this.jobs.log(job, 'Bundled app files are kept; the app is hidden from the dashboard');
        await this.registry.setBuiltinRemoved(current.id, true);
      }

      if (purgeData) {
        await fs
          .rm(this.paths.appData(current.id), { recursive: true, force: true })
          .catch(() => undefined);
        await fs
          .rm(this.paths.logFile(current.id, 'client'), { force: true })
          .catch(() => undefined);
        await fs
          .rm(this.paths.logFile(current.id, 'server'), { force: true })
          .catch(() => undefined);
      }

      await this.registry.remove(current.id);
      this.jobs.succeed(job, `${current.name} uninstalled`);
    });

    return job;
  }

  restoreBuiltin(id: string): Job {
    const job = this.jobs.create('install', `Restoring bundled app ${id}`);
    this.jobs.start(job);

    void (async () => {
      await this.registry.setBuiltinRemoved(id, false);
      await this.registerBuiltins(id);
      if (!this.registry.has(id)) {
        throw new NotFoundException(
          `No bundled app with id "${id}" is available in this checkout`,
        );
      }
      this.jobs.succeed(job, `${id} restored`);
    })().catch((error) => this.jobs.fail(job, error));

    return job;
  }

  // ---------------------------------------------------------------------------
  // Start / stop / toggle / rebuild
  // ---------------------------------------------------------------------------

  start(id: string): Job {
    this.assertIdle(id);
    const app = this.requireApp(id);
    const job = this.jobs.create('start', `Starting ${app.name}`, id);
    this.begin(id, job, () => this.performStart(id, job));
    return job;
  }

  stop(id: string): Job {
    this.assertIdle(id);
    const app = this.requireApp(id);
    const job = this.jobs.create('stop', `Stopping ${app.name}`, id);
    this.begin(id, job, () => this.performStop(id, job));
    return job;
  }

  toggle(id: string, enabled: boolean): Job {
    return enabled ? this.start(id) : this.stop(id);
  }

  rebuild(id: string): Job {
    this.assertIdle(id);
    const app = this.requireApp(id);
    if (
      app.client?.status === 'running' ||
      app.server?.status === 'running' ||
      app.enabled
    ) {
      throw new ConflictException('Stop the app before rebuilding it');
    }

    const job = this.jobs.create('rebuild', `Rebuilding ${app.name}`, id);
    this.begin(id, job, async () => {
      const current = this.requireApp(id);
      this.jobs.progress(job, 10, 'Building app components');
      await this.ensurePrepared(current, job, true);
      this.jobs.succeed(job, `${current.name} rebuilt`);
    });
    return job;
  }

  private async performStart(id: string, job: Job): Promise<void> {
    const app = this.requireApp(id);
    app.enabled = true;
    app.updatedAt = new Date().toISOString();
    await this.registry.set(app);

    try {
      this.jobs.progress(job, 5, 'Preparing app');
      await this.ensurePrepared(app, job);

      const kinds: ComponentKind[] = ['server', 'client'];
      for (const kind of kinds) {
        const component = app.manifest[kind];
        const state = app[kind];
        if (!component || !state) continue;

        if (this.processes.isAlive(state.pid)) {
          state.status = 'running';
          this.jobs.log(job, `${kind} already running (pid ${state.pid})`);
          continue;
        }

        this.jobs.progress(
          job,
          kind === 'server' ? 60 : 80,
          `Starting ${kind} on port ${state.port}`,
        );
        state.status = 'starting';
        state.lastError = undefined;
        await this.registry.set(app);

        try {
          const { pid } = await this.processes.start({
            appId: app.id,
            kind,
            cwd: this.paths.safeJoin(app.rootDir, component.dir),
            command: component.start,
            env: this.resolveComponentEnv(app, kind),
            port: state.port,
            healthPath: component.healthPath,
            timeoutMs: component.readyTimeoutMs,
            logFile: this.paths.logFile(app.id, kind),
          });

          state.pid = pid;
          state.status = 'running';
          state.startedAt = new Date().toISOString();
          state.lastError = undefined;
          state.url = this.paths.urlForPort(state.port);
          app.updatedAt = new Date().toISOString();
          await this.registry.set(app);
          this.jobs.log(job, `${kind} is ready at ${state.url}`);
        } catch (error) {
          state.status = 'error';
          state.lastError = (error as Error).message;
          state.pid = undefined;
          await this.registry.set(app);
          throw error;
        }
      }

      this.jobs.succeed(job, `${app.name} is running`);
    } catch (error) {
      const message = (error as Error).message;
      this.jobs.log(job, `Start failed: ${message}`);

      try {
        await this.stopComponents(app, job);
      } catch (stopError) {
        this.jobs.log(job, `Cleanup failed: ${(stopError as Error).message}`);
      }

      app.enabled = false;
      app.updatedAt = new Date().toISOString();
      for (const kind of ['client', 'server'] as const) {
        const state = app[kind];
        if (state) {
          state.status = 'error';
          state.lastError = message;
          state.pid = undefined;
        }
      }
      await this.registry.set(app);
      throw error;
    }
  }

  private async performStop(id: string, job: Job): Promise<void> {
    const app = this.requireApp(id);
    app.enabled = false;
    app.updatedAt = new Date().toISOString();
    await this.registry.set(app);

    await this.stopComponents(app, job);
    this.jobs.succeed(job, `${app.name} stopped`);
  }

  private async stopComponents(app: AppRecord, job?: Job): Promise<void> {
    for (const kind of ['client', 'server'] as const) {
      const state = app[kind];
      if (!state) continue;
      if (state.status === 'stopped' && !state.pid) continue;

      state.status = 'stopping';
      await this.registry.set(app);

      if (state.pid) {
        await this.processes.stop(state.pid);
      }

      state.pid = undefined;
      state.status = 'stopped';
      state.startedAt = undefined;
      state.lastError = undefined;
      app.updatedAt = new Date().toISOString();
      await this.registry.set(app);
      if (job) this.jobs.log(job, `${kind} stopped`);
    }
  }

  // ---------------------------------------------------------------------------
  // Preparation (install dependencies + build)
  // ---------------------------------------------------------------------------

  private async ensurePrepared(
    app: AppRecord,
    job: Job,
    forceBuild = false,
  ): Promise<void> {
    for (const kind of ['server', 'client'] as const) {
      const component = app.manifest[kind];
      const state = app[kind];
      if (!component || !state) continue;

      const cwd = this.paths.safeJoin(app.rootDir, component.dir);
      if (!fsSync.existsSync(cwd)) {
        throw new Error(
          `${app.name} ${kind} directory is missing: ${component.dir}`,
        );
      }

      const env = this.resolveComponentEnv(app, kind);
      const envHash = createHash('sha1')
        .update(JSON.stringify(env))
        .digest('hex');

      if (
        component.install &&
        !fsSync.existsSync(path.join(cwd, 'node_modules'))
      ) {
        this.jobs.progress(job, 45, `Installing ${kind} dependencies`);
        await this.commands.run(
          component.install,
          {
            cwd,
            // The managa server runs with NODE_ENV=production in Docker.
            // Install commands still need the dev dependencies that builds use.
            env: {
              ...env,
              NODE_ENV: 'development',
              NPM_CONFIG_INCLUDE: 'dev',
            },
            timeoutMs: 20 * 60 * 1000,
            onLine: (line) => this.jobs.log(job, line),
          },
          kind,
        );
      }

      if (component.build) {
        const outputPath = component.buildOutput
          ? path.join(cwd, component.buildOutput)
          : undefined;
        const outputMissing = outputPath
          ? !fsSync.existsSync(outputPath)
          : false;
        const needsBuild =
          forceBuild ||
          outputMissing ||
          !state.preparedAt ||
          state.buildEnvHash !== envHash;

        if (needsBuild) {
          this.jobs.progress(job, 55, `Building ${kind}`);
          await this.commands.run(
            component.build,
            {
              cwd,
              env,
              timeoutMs: 20 * 60 * 1000,
              onLine: (line) => this.jobs.log(job, line),
            },
            kind,
          );

          if (outputPath && !fsSync.existsSync(outputPath)) {
            throw new Error(
              `Build finished but "${component.buildOutput}" was not created`,
            );
          }

          state.buildEnvHash = envHash;
          state.preparedAt = new Date().toISOString();
          await this.registry.set(app);
        }
      } else {
        state.preparedAt = new Date().toISOString();
        await this.registry.set(app);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Built-ins
  // ---------------------------------------------------------------------------

  private async registerBuiltins(forceId?: string): Promise<void> {
    const configured =
      process.env.MANAGA_BUILTIN_MANIFESTS?.split(',')
        .map((entry) => entry.trim())
        .filter(Boolean) ?? ['taska.app.json', 'quita.app.json'];

    for (const relativePath of configured) {
      const manifestFile = path.resolve(this.paths.rootDir, relativePath);
      if (!fsSync.existsSync(manifestFile)) {
        this.logger.warn(`Bundled manifest not found: ${manifestFile}`);
        continue;
      }

      let loaded;
      try {
        loaded = await this.manifestService.loadFile(
          manifestFile,
          this.paths.rootDir,
        );
      } catch (error) {
        this.logger.error(
          `Could not load bundled app ${relativePath}: ${(error as Error).message}`,
        );
        continue;
      }

      const manifest = loaded.manifest;
      const id = manifest.id!;
      if (forceId && id !== forceId) continue;
      if (!forceId && this.registry.isBuiltinRemoved(id)) continue;

      const existing = this.registry.get(id);
      if (existing) {
        existing.manifest = manifest;
        existing.name = manifest.name;
        existing.description = manifest.description ?? '';
        existing.version = manifest.version ?? existing.version;
        existing.author = manifest.author;
        existing.icon = manifest.icon ?? existing.icon;
        existing.tags = manifest.tags ?? [];
        existing.manifestPath = loaded.manifestPath;
        existing.source = {
          type: 'builtin',
          manifestPath: loaded.manifestPath,
        };
        existing.rootDir = this.paths.rootDir;
        await this.syncComponentState(existing, 'client');
        await this.syncComponentState(existing, 'server');
        existing.updatedAt = new Date().toISOString();
        await this.registry.set(existing);
        this.logger.log(`Bundled app "${id}" is available`);
        continue;
      }

      const ports = await this.allocatePorts(manifest);
      const app = this.buildRecord({
        manifest,
        manifestPath: loaded.manifestPath,
        rootDir: this.paths.rootDir,
        source: { type: 'builtin', manifestPath: loaded.manifestPath },
        ports,
        installedAt: new Date().toISOString(),
      });
      await this.registry.set(app);
      this.logger.log(
        `Registered bundled app "${id}" (${manifest.client ? `client:${ports.client} ` : ''}${manifest.server ? `server:${ports.server}` : ''})`,
      );
    }
  }

  private async syncComponentState(
    app: AppRecord,
    kind: ComponentKind,
  ): Promise<void> {
    const component = app.manifest[kind];
    if (!component) {
      if (app[kind]?.pid) {
        await this.processes.stop(app[kind]!.pid);
      }
      delete app[kind];
      return;
    }

    if (!app[kind]) {
      const port = await this.findFreePort(
        component.port ?? (kind === 'server' ? 4100 : 3100),
        this.registry.usedPorts(),
        kind === 'server' ? 4100 : 3100,
      );
      app[kind] = {
        port,
        status: 'stopped',
        url: this.paths.urlForPort(port),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Auto-start and recovery
  // ---------------------------------------------------------------------------

  private async autoStartEnabled(): Promise<void> {
    const enabled = this.registry.list().filter((app) => app.enabled);
    for (const app of enabled) {
      if (this.busy.has(app.id)) continue;
      const job = this.jobs.create(
        'auto-start',
        `Auto-starting ${app.name}`,
        app.id,
      );
      this.begin(app.id, job, () => this.performStart(app.id, job));
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }

  private async recoverStaleProcesses(): Promise<void> {
    for (const app of this.registry.list()) {
      let changed = false;
      for (const kind of ['client', 'server'] as const) {
        const state = app[kind];
        if (state?.pid && this.processes.isAlive(state.pid)) {
          this.logger.warn(
            `Stopping stale ${app.id}/${kind} process ${state.pid} from a previous run`,
          );
          await this.processes.stop(state.pid).catch(() => undefined);
        }
        if (state) {
          state.pid = undefined;
          state.status = 'stopped';
          state.startedAt = undefined;
          state.url = this.paths.urlForPort(state.port);
          changed = true;
        }
      }
      if (changed) await this.registry.set(app);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private buildRecord(input: {
    manifest: AppManifest;
    manifestPath: string;
    rootDir: string;
    source: AppRecord['source'];
    ports: AllocatedPorts;
    installedAt: string;
  }): AppRecord {
    const { manifest, manifestPath, rootDir, source, ports, installedAt } =
      input;

    const app: AppRecord = {
      id: manifest.id!,
      name: manifest.name,
      description: manifest.description ?? '',
      version: manifest.version ?? '0.1.0',
      author: manifest.author,
      icon: manifest.icon ?? '📦',
      tags: manifest.tags ?? [],
      manifest,
      manifestPath,
      rootDir,
      source,
      installedAt,
      updatedAt: installedAt,
      enabled: false,
    };

    if (manifest.client && ports.client) {
      app.client = {
        port: ports.client,
        status: 'stopped',
        url: this.paths.urlForPort(ports.client),
      };
    }
    if (manifest.server && ports.server) {
      app.server = {
        port: ports.server,
        status: 'stopped',
        url: this.paths.urlForPort(ports.server),
      };
    }

    return app;
  }

  private resolveComponentEnv(
    app: AppRecord,
    kind: ComponentKind,
  ): Record<string, string> {
    const component = app.manifest[kind];
    const state = app[kind];
    if (!component || !state) return {};

    const componentDir = this.paths.safeJoin(app.rootDir, component.dir);
    const clientPort = app.client?.port;
    const serverPort = app.server?.port;

    const tokens: Record<string, string> = {
      appId: app.id,
      appName: app.name,
      appDir: app.rootDir,
      componentDir,
      dataDir: this.paths.dataDir,
      appDataDir: this.paths.appData(app.id),
      clientPort: clientPort ? String(clientPort) : '',
      serverPort: serverPort ? String(serverPort) : '',
      clientUrl: clientPort ? this.paths.urlForPort(clientPort) : '',
      serverUrl: serverPort ? this.paths.urlForPort(serverPort) : '',
    };

    const resolved: Record<string, string> = {};
    for (const [key, value] of Object.entries(component.env ?? {})) {
      resolved[key] = String(value).replace(
        /\{\{\s*([\w.]+)\s*\}\}/g,
        (_match, token: string) => tokens[token] ?? '',
      );
    }

    // The allocated port is authoritative.
    resolved.PORT = String(state.port);
    resolved.MANAGA = '1';
    resolved.MANAGA_APP_ID = app.id;
    resolved.MANAGA_APP_URL = this.paths.urlForPort(state.port);
    return resolved;
  }

  private async allocatePorts(
    manifest: AppManifest,
  ): Promise<AllocatedPorts> {
    const used = this.registry.usedPorts();
    const ports: AllocatedPorts = {};

    if (manifest.server) {
      ports.server = await this.findFreePort(
        manifest.server.port ?? 4100,
        used,
        4100,
      );
      used.add(ports.server);
    }
    if (manifest.client) {
      ports.client = await this.findFreePort(
        manifest.client.port ?? 3100,
        used,
        3100,
      );
    }

    return ports;
  }

  private async findFreePort(
    preferred: number,
    used: Set<number>,
    fallbackStart: number,
  ): Promise<number> {
    const candidates: number[] = [preferred];
    for (let port = fallbackStart; port < fallbackStart + 250; port += 1) {
      candidates.push(port);
    }

    for (const port of candidates) {
      if (used.has(port)) continue;
      if (await this.isPortFree(port)) return port;
    }

    throw new Error(
      `No free port found in ${fallbackStart}-${fallbackStart + 249}`,
    );
  }

  private isPortFree(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.once('error', () => resolve(false));
      server.listen(
        { port, host: '127.0.0.1', exclusive: true },
        () => {
          server.close(() => resolve(true));
        },
      );
    });
  }

  private reconcile(app: AppRecord): void {
    for (const kind of ['client', 'server'] as const) {
      const state = app[kind];
      if (!state) continue;

      if (state.pid && !this.processes.isAlive(state.pid)) {
        state.pid = undefined;
        if (state.status === 'stopping') {
          state.status = 'stopped';
        } else if (
          state.status === 'running' ||
          state.status === 'starting'
        ) {
          state.status = 'error';
          state.lastError = 'Process exited unexpectedly';
        }
      }
    }
  }

  private toView(app: AppRecord): AppView {
    const client = app.client
      ? this.componentView(app, 'client', app.client)
      : undefined;
    const server = app.server
      ? this.componentView(app, 'server', app.server)
      : undefined;
    const components = [client, server].filter(
      (component): component is AppComponentView => Boolean(component),
    );

    let overallStatus: AppView['overallStatus'] = 'stopped';
    if (components.some((component) => component.status === 'error')) {
      overallStatus = 'error';
    } else if (
      components.some(
        (component) =>
          component.status === 'starting' || component.status === 'stopping',
      )
    ) {
      overallStatus = 'transitioning';
    } else {
      const running = components.filter(
        (component) => component.status === 'running',
      ).length;
      if (running === components.length && running > 0) {
        overallStatus = 'running';
      } else if (running > 0) {
        overallStatus = 'partial';
      } else if (app.enabled) {
        overallStatus = 'error';
      }
    }

    return {
      id: app.id,
      name: app.name,
      description: app.description,
      version: app.version,
      author: app.author,
      icon: app.icon,
      tags: app.tags,
      source: app.source,
      installedAt: app.installedAt,
      updatedAt: app.updatedAt,
      enabled: app.enabled,
      overallStatus,
      openUrl: client?.url ?? server?.url,
      client,
      server,
      manifest: app.manifest,
    };
  }

  private componentView(
    app: AppRecord,
    kind: ComponentKind,
    state: ComponentState,
  ): AppComponentView {
    const component = app.manifest[kind]!;
    return {
      kind,
      dir: component.dir,
      startCommand: component.start,
      status: state.status,
      port: state.port,
      url: state.url ?? this.paths.urlForPort(state.port),
      pid: state.pid,
      startedAt: state.startedAt,
      lastError: state.lastError,
    };
  }

  private requireApp(id: string): AppRecord {
    const app = this.registry.get(id);
    if (!app) throw new NotFoundException(`App "${id}" is not installed`);
    return app;
  }

  private assertIdle(id: string): void {
    const active = this.jobs.findActiveForApp(id);
    if (this.busy.has(id) || active) {
      throw new ConflictException(
        `Another operation is already running for "${id}"`,
      );
    }
  }

  private begin(appId: string, job: Job, task: () => Promise<void>): void {
    if (this.busy.has(appId)) {
      this.jobs.fail(
        job,
        new ConflictException(`Another operation is already running for "${appId}"`),
      );
      return;
    }

    this.busy.set(appId, job.id);
    this.jobs.start(job);
    void task()
      .catch((error) => this.jobs.fail(job, error))
      .finally(() => {
        this.busy.delete(appId);
      });
  }
}
