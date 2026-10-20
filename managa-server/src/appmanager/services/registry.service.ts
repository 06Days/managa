import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AppRecord, RegistryFile } from '../types';
import { PathsService } from './paths.service';

@Injectable()
export class RegistryService implements OnModuleInit {
  private readonly logger = new Logger(RegistryService.name);
  private apps = new Map<string, AppRecord>();
  private removedBuiltins = new Set<string>();
  private writeQueue: Promise<void> = Promise.resolve();
  private loaded = false;

  constructor(private readonly paths: PathsService) {}

  async onModuleInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.paths.registryFile, 'utf8');
      const parsed = JSON.parse(raw) as Partial<RegistryFile>;
      this.apps.clear();
      for (const app of parsed.apps ?? []) {
        if (app?.id) this.apps.set(app.id, app);
      }
      this.removedBuiltins = new Set(parsed.removedBuiltins ?? []);
      this.logger.log(`Loaded ${this.apps.size} installed app(s)`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(
          `Could not read registry (${(error as Error).message}); starting empty`,
        );
      }
    }
    this.loaded = true;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  list(): AppRecord[] {
    return [...this.apps.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  get(id: string): AppRecord | undefined {
    return this.apps.get(id);
  }

  has(id: string): boolean {
    return this.apps.has(id);
  }

  async set(app: AppRecord): Promise<AppRecord> {
    this.apps.set(app.id, app);
    await this.save();
    return app;
  }

  async remove(id: string): Promise<boolean> {
    const removed = this.apps.delete(id);
    if (removed) await this.save();
    return removed;
  }

  isBuiltinRemoved(id: string): boolean {
    return this.removedBuiltins.has(id);
  }

  async setBuiltinRemoved(id: string, removed: boolean): Promise<void> {
    if (removed) this.removedBuiltins.add(id);
    else this.removedBuiltins.delete(id);
    await this.save();
  }

  usedPorts(): Set<number> {
    const ports = new Set<number>();
    for (const app of this.apps.values()) {
      if (app.client?.port) ports.add(app.client.port);
      if (app.server?.port) ports.add(app.server.port);
    }
    return ports;
  }

  async save(): Promise<void> {
    const payload: RegistryFile = {
      version: 1,
      apps: this.list(),
      removedBuiltins: [...this.removedBuiltins],
    };
    const serialized = JSON.stringify(payload, null, 2);

    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(path.dirname(this.paths.registryFile), { recursive: true });
      const tmp = `${this.paths.registryFile}.${process.pid}.tmp`;
      await fs.writeFile(tmp, serialized, 'utf8');
      await fs.rename(tmp, this.paths.registryFile);
    });

    return this.writeQueue;
  }
}
