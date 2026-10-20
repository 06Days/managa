import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface ParsedGithubSource {
  owner: string;
  repo: string;
  url: string;
  ref?: string;
}

export interface CloneResult {
  commit?: string;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  /** Accepts https, SSH and owner/repo GitHub references. */
  parse(input: string, explicitRef?: string): ParsedGithubSource {
    let value = (input ?? '').trim();
    if (!value) {
      throw new BadRequestException('A GitHub repository URL is required');
    }

    let ref = explicitRef?.trim() || undefined;

    // Support https://github.com/owner/repo#branch
    const hashIndex = value.lastIndexOf('#');
    if (hashIndex > 0) {
      if (!ref) ref = decodeURIComponent(value.slice(hashIndex + 1));
      value = value.slice(0, hashIndex);
    }

    // Development/testing escape hatch for app authors. Disabled by default.
    if (
      process.env.MANAGA_ALLOW_LOCAL_SOURCES === 'true' &&
      (value.startsWith('file://') ||
        value.startsWith('/') ||
        value.startsWith('./') ||
        value.startsWith('../'))
    ) {
      const localPath = value.startsWith('file://')
        ? fileURLToPath(value)
        : path.resolve(value);
      return {
        owner: 'local',
        repo: path.basename(localPath),
        url: localPath,
        ref,
      };
    }

    // Support owner/repo shorthand.
    if (/^[\w.-]+\/[\w.-]+$/.test(value)) {
      value = `https://github.com/${value}`;
    }

    // Support git@github.com:owner/repo.git
    const sshMatch = value.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
    if (sshMatch) {
      value = `https://github.com/${sshMatch[1]}/${sshMatch[2]}`;
    }

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException(
        `"${input}" is not a valid GitHub repository URL`,
      );
    }

    if (
      url.protocol !== 'https:' &&
      url.protocol !== 'http:'
    ) {
      throw new BadRequestException('Only GitHub HTTPS URLs are supported');
    }
    if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') {
      throw new BadRequestException(
        'managa can currently install apps from github.com only',
      );
    }

    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');
    if (parts.length !== 2) {
      throw new BadRequestException(
        'Expected a repository URL such as https://github.com/owner/repo',
      );
    }

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, '');
    if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
      throw new BadRequestException('GitHub owner or repository name is invalid');
    }
    if (ref && !/^[\w./-]+$/.test(ref)) {
      throw new BadRequestException('Git ref contains unsupported characters');
    }

    return {
      owner,
      repo,
      url: `https://github.com/${owner}/${repo}.git`,
      ref,
    };
  }

  async clone(
    source: ParsedGithubSource,
    destination: string,
    onLine?: (line: string) => void,
  ): Promise<CloneResult> {
    await fsp.mkdir(path.dirname(destination), { recursive: true });

    const args = ['clone', '--depth', '1'];
    if (source.ref) {
      args.push('--branch', source.ref);
    }
    args.push(source.url, destination);

    onLine?.(`$ git ${args.join(' ')}`);
    this.logger.log(`Cloning ${source.url}${source.ref ? ` (${source.ref})` : ''}`);

    try {
      const { stdout, stderr } = await execFileAsync('git', args, {
        timeout: 5 * 60 * 1000,
        maxBuffer: 20 * 1024 * 1024,
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
        },
      });
      for (const line of `${stdout}\n${stderr}`.split(/\r?\n/)) {
        if (line.trim()) onLine?.(line);
      }
    } catch (error: any) {
      const detail = (error?.stderr || error?.message || String(error)).toString();
      for (const line of detail.split(/\r?\n/)) {
        if (line.trim()) onLine?.(line);
      }
      throw new BadRequestException(`git clone failed: ${detail.trim()}`);
    }

    let commit: string | undefined;
    try {
      const result = await execFileAsync(
        'git',
        ['-C', destination, 'rev-parse', 'HEAD'],
        { timeout: 15_000 },
      );
      commit = result.stdout.trim();
      onLine?.(`Cloned commit ${commit.slice(0, 12)}`);
    } catch {
      // The commit is informational only.
    }

    return { commit };
  }
}
