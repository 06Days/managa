import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AppManifest, ComponentManifest } from '../types';

const MANIFEST_CANDIDATES = [
  'managa.app.json',
  'managa.json',
  '.managa/app.json',
];

const ID_PATTERN = /^[a-z0-9][a-z0-9-_]*$/;
const RESERVED_IDS = new Set(['managa', 'appmanager', 'api', 'static', 'public']);

export interface LoadedManifest {
  manifest: AppManifest;
  manifestPath: string;
}

@Injectable()
export class ManifestService {
  /** Loads and validates one specific manifest file. */
  async loadFile(
    manifestFile: string,
    baseDir: string,
  ): Promise<LoadedManifest> {
    const raw = await fs.readFile(manifestFile, 'utf8');
    let parsed: AppManifest;
    try {
      parsed = JSON.parse(raw) as AppManifest;
    } catch (error) {
      throw new BadRequestException(
        `${path.basename(manifestFile)} is not valid JSON: ${(error as Error).message}`,
      );
    }
    return {
      manifest: this.normalize(parsed, path.basename(baseDir)),
      manifestPath: path.relative(baseDir, manifestFile).replace(/\\/g, '/'),
    };
  }

  /** Loads and validates the first compatible manifest found in `rootDir`. */
  async loadFromDirectory(rootDir: string): Promise<LoadedManifest> {
    for (const candidate of MANIFEST_CANDIDATES) {
      const manifestPath = path.join(rootDir, candidate);
      try {
        const raw = await fs.readFile(manifestPath, 'utf8');
        const parsed = JSON.parse(raw) as AppManifest;
        return {
          manifest: this.normalize(parsed, path.basename(rootDir)),
          manifestPath: candidate,
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          continue;
        }
        if (error instanceof SyntaxError) {
          throw new BadRequestException(
            `${candidate} is not valid JSON: ${error.message}`,
          );
        }
        throw error;
      }
    }

    throw new BadRequestException(
      `No compatible app manifest found. Add managa.app.json to the repository root.`,
    );
  }

  normalize(input: AppManifest, fallbackId: string): AppManifest {
    if (!input || typeof input !== 'object') {
      throw new BadRequestException('Manifest must be a JSON object');
    }
    if (!input.name || typeof input.name !== 'string') {
      throw new BadRequestException('Manifest requires a "name" string');
    }

    const manifest: AppManifest = {
      ...input,
      id: input.id ?? this.slugify(input.name || fallbackId),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      version: input.version?.trim() || '0.1.0',
      author: input.author?.trim(),
      icon: input.icon?.trim() || '📦',
      homepage: input.homepage?.trim(),
      repository: input.repository?.trim(),
      tags: Array.isArray(input.tags)
        ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
        : [],
    };

    manifest.id = this.validateId(manifest.id ?? this.slugify(manifest.name));
    manifest.client = this.normalizeComponent('client', input.client);
    manifest.server = this.normalizeComponent('server', input.server);

    if (!manifest.client && !manifest.server) {
      throw new BadRequestException(
        'Manifest must declare at least one of "client" or "server"',
      );
    }

    return manifest;
  }

  validateId(value: string): string {
    const id = this.slugify(value);
    if (!ID_PATTERN.test(id)) {
      throw new BadRequestException(
        `Invalid app id "${value}". Use lowercase letters, numbers, "-" and "_".`,
      );
    }
    if (RESERVED_IDS.has(id)) {
      throw new BadRequestException(`"${id}" is a reserved app id`);
    }
    return id;
  }

  slugify(value: string): string {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  private normalizeComponent(
    kind: 'client' | 'server',
    input?: ComponentManifest,
  ): ComponentManifest | undefined {
    if (!input) return undefined;

    if (typeof input !== 'object') {
      throw new BadRequestException(`"${kind}" must be an object`);
    }
    if (!input.dir || typeof input.dir !== 'string') {
      throw new BadRequestException(`"${kind}.dir" is required`);
    }
    if (!input.start || typeof input.start !== 'string') {
      throw new BadRequestException(`"${kind}.start" is required`);
    }
    if (path.isAbsolute(input.dir) || input.dir.split(/[\\/]+/).includes('..')) {
      throw new BadRequestException(
        `"${kind}.dir" must be a relative path inside the app`,
      );
    }

    const port =
      input.port === undefined ? undefined : Number(input.port);
    if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) {
      throw new BadRequestException(`"${kind}.port" must be a valid TCP port`);
    }

    return {
      dir: input.dir.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, ''),
      start: input.start,
      install: input.install,
      build: input.build,
      port,
      healthPath: input.healthPath ?? '/',
      readyTimeoutMs: input.readyTimeoutMs ?? 45_000,
      buildOutput: input.buildOutput,
      env: input.env && typeof input.env === 'object' ? { ...input.env } : {},
    };
  }
}
