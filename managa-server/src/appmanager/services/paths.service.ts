import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Resolves every filesystem location used by managa once, at boot time.
 *
 * A typical local checkout is:
 *   managa/
 *     managa-server/   <- process.cwd() when `npm run start:dev`
 *     managa-client/
 *     taska.app.json
 *     data/
 */
@Injectable()
export class PathsService {
  private readonly logger = new Logger(PathsService.name);

  readonly rootDir: string;
  readonly dataDir: string;
  readonly appsDir: string;
  readonly appDataDir: string;
  readonly logsDir: string;
  readonly tmpDir: string;
  readonly registryFile: string;
  readonly catalogFile: string;
  readonly publicHost: string;

  constructor() {
    const cwd = process.cwd();
    const inferredRoot =
      path.basename(cwd) === 'managa-server' ? path.dirname(cwd) : cwd;

    this.rootDir = path.resolve(process.env.MANAGA_ROOT_DIR ?? inferredRoot);
    this.dataDir = path.resolve(
      process.env.MANAGA_DATA_DIR ?? path.join(this.rootDir, 'data'),
    );
    this.appsDir = path.join(this.dataDir, 'apps');
    this.appDataDir = path.join(this.dataDir, 'app-data');
    this.logsDir = path.join(this.dataDir, 'logs');
    this.tmpDir = path.join(this.dataDir, 'tmp');
    this.registryFile = path.join(this.dataDir, 'registry.json');
    this.catalogFile = path.join(this.rootDir, 'managa-server', 'catalog.json');

    this.publicHost = (process.env.MANAGA_PUBLIC_HOST ?? 'http://localhost').replace(
      /\/+$/,
      '',
    );

    for (const dir of [
      this.dataDir,
      this.appsDir,
      this.appDataDir,
      this.logsDir,
      this.tmpDir,
    ]) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.logger.log(`Project root: ${this.rootDir}`);
    this.logger.log(`Data directory: ${this.dataDir}`);
  }

  appDir(id: string): string {
    return path.join(this.appsDir, id);
  }

  appData(id: string): string {
    const dir = path.join(this.appDataDir, id);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  logFile(id: string, component: string): string {
    return path.join(this.logsDir, `${id}-${component}.log`);
  }

  /** Joins a manifest-relative path, refusing anything that escapes its base. */
  safeJoin(base: string, relative: string): string {
    const resolved = path.resolve(base, relative);
    const rel = path.relative(base, resolved);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new BadRequestException(
        `Path "${relative}" escapes the app directory`,
      );
    }
    return resolved;
  }

  isInsideAppsDir(target: string): boolean {
    const rel = path.relative(this.appsDir, path.resolve(target));
    return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
  }

  urlForPort(port: number): string {
    try {
      const url = new URL(this.publicHost);
      url.port = String(port);
      return url.toString().replace(/\/$/, '');
    } catch {
      return `http://localhost:${port}`;
    }
  }
}
