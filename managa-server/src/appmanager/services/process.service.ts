import { Injectable, Logger } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { ComponentKind } from '../types';

export interface StartProcessOptions {
  appId: string;
  kind: ComponentKind;
  cwd: string;
  command: string;
  env: Record<string, string>;
  port: number;
  healthPath?: string;
  timeoutMs?: number;
  logFile: string;
}

interface ExitInfo {
  code: number | null;
  signal: NodeJS.Signals | null;
  at: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class ProcessService {
  private readonly logger = new Logger(ProcessService.name);
  private readonly exits = new Map<number, ExitInfo>();
  private readonly children = new Map<string, ChildProcess>();

  async start(options: StartProcessOptions): Promise<{ pid: number }> {
    const {
      appId,
      kind,
      cwd,
      command,
      env,
      port,
      healthPath = '/',
      timeoutMs = 45_000,
      logFile,
    } = options;

    await fsp.mkdir(path.dirname(logFile), { recursive: true });
    await fsp.mkdir(cwd, { recursive: true });

    const logFd = fs.openSync(logFile, 'a');
    fs.writeSync(
      logFd,
      `\n=== managa: ${appId}/${kind} @ ${new Date().toISOString()} ===\n$ ${command}\n`,
    );

    const key = `${appId}:${kind}`;
    const child = spawn(command, {
      cwd,
      env: { ...process.env, ...env },
      shell: true,
      detached: process.platform !== 'win32',
      stdio: ['ignore', logFd, logFd],
    });

    fs.closeSync(logFd);

    if (!child.pid) {
      throw new Error(`Could not start ${kind}: no process id`);
    }

    const pid = child.pid;
    this.children.set(key, child);
    child.on('error', (error) => {
      this.exits.set(pid, {
        code: null,
        signal: null,
        at: Date.now(),
      });
      this.logger.error(`${appId}/${kind} failed to spawn: ${error.message}`);
    });
    child.on('exit', (code, signal) => {
      this.exits.set(pid, { code, signal, at: Date.now() });
      this.children.delete(key);
      this.logger.log(
        `${appId}/${kind} exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`,
      );
    });
    child.unref();

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const exit = this.exits.get(pid);
      if (exit) {
        const tail = await this.tail(logFile, 30);
        throw new Error(
          `${kind} exited before it became ready (code=${exit.code ?? 'null'}, signal=${exit.signal ?? 'null'}).\n${tail.join('\n')}`,
        );
      }

      if (await this.isHealthy(port, healthPath)) {
        this.logger.log(
          `${appId}/${kind} ready on http://127.0.0.1:${port} (pid ${pid})`,
        );
        return { pid };
      }

      await sleep(500);
    }

    await this.stop(pid).catch(() => undefined);
    throw new Error(
      `${kind} did not become ready on port ${port} within ${Math.round(timeoutMs / 1000)}s`,
    );
  }

  isAlive(pid?: number): boolean {
    if (!pid) return false;

    if (process.platform !== 'win32') {
      // Detached children lead their own process group; checking the group
      // catches npm/sh wrappers even if they re-parent their children.
      try {
        process.kill(-pid, 0);
        return true;
      } catch {
        // Fall through to the single-pid check.
      }
    }

    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  async stop(pid?: number): Promise<void> {
    if (!pid || !this.isAlive(pid)) {
      if (pid) this.exits.delete(pid);
      return;
    }

    this.logger.log(`Stopping process group ${pid}`);

    if (process.platform === 'win32') {
      await new Promise<void>((resolve) => {
        const killer = spawn(
          'taskkill',
          ['/pid', String(pid), '/T', '/F'],
          { stdio: 'ignore' },
        );
        killer.on('exit', () => resolve());
        killer.on('error', () => resolve());
      });
      return;
    }

    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        return;
      }
    }

    for (let i = 0; i < 50; i += 1) {
      if (!this.isAlive(pid)) {
        this.exits.delete(pid);
        return;
      }
      await sleep(200);
    }

    this.logger.warn(`Process group ${pid} ignored SIGTERM; sending SIGKILL`);
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // Already gone.
      }
    }

    for (let i = 0; i < 20; i += 1) {
      if (!this.isAlive(pid)) {
        this.exits.delete(pid);
        return;
      }
      await sleep(100);
    }

    throw new Error(`Could not stop process group ${pid}`);
  }

  async stopByKey(appId: string, kind: ComponentKind): Promise<void> {
    const child = this.children.get(`${appId}:${kind}`);
    if (child?.pid) {
      await this.stop(child.pid);
    }
  }

  async isHealthy(port: number, healthPath = '/'): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1_500);
    try {
      const suffix = healthPath.startsWith('/') ? healthPath : `/${healthPath}`;
      const response = await fetch(`http://127.0.0.1:${port}${suffix}`, {
        signal: controller.signal,
        redirect: 'manual',
      });
      return response.status < 500;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  async tail(logFile: string, lines = 200): Promise<string[]> {
    try {
      const stat = await fsp.stat(logFile);
      const maxBytes = 256 * 1024;
      const start = Math.max(0, stat.size - maxBytes);
      const handle = await fsp.open(logFile, 'r');
      try {
        const buffer = Buffer.alloc(stat.size - start);
        await handle.read(buffer, 0, buffer.length, start);
        return buffer
          .toString('utf8')
          .split(/\r?\n/)
          .slice(-lines);
      } finally {
        await handle.close();
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
