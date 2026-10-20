import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { ComponentKind } from '../types';

export interface RunCommandOptions {
  cwd: string;
  env: Record<string, string>;
  timeoutMs?: number;
  onLine?: (line: string) => void;
}

/**
 * Runs shell commands for app installs and builds while streaming output to a
 * job log. Commands come from the app manifest, so the manifest is code: only
 * install apps you trust.
 */
@Injectable()
export class CommandService {
  private readonly logger = new Logger(CommandService.name);

  run(
    command: string,
    options: RunCommandOptions,
    kind: ComponentKind | 'app' = 'app',
  ): Promise<void> {
    const { cwd, env, timeoutMs = 15 * 60 * 1000, onLine } = options;

    return new Promise<void>((resolve, reject) => {
      this.logger.log(`[${kind}] $ ${command} (${cwd})`);
      onLine?.(`$ ${command}`);

      const child = spawn(command, {
        cwd,
        env: {
          ...process.env,
          ...env,
          NO_COLOR: '1',
          MANAGA: '1',
        },
        shell: true,
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let settled = false;
      let timedOut = false;
      const buffers: Record<'stdout' | 'stderr', string> = {
        stdout: '',
        stderr: '',
      };

      const emit = (stream: 'stdout' | 'stderr', chunk: Buffer) => {
        const text = buffers[stream] + chunk.toString('utf8');
        const parts = text.split(/\r?\n/);
        buffers[stream] = parts.pop() ?? '';
        for (const line of parts) {
          if (line.trim()) onLine?.(line);
        }
      };

      child.stdout?.on('data', (chunk: Buffer) => emit('stdout', chunk));
      child.stderr?.on('data', (chunk: Buffer) => emit('stderr', chunk));

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        for (const stream of ['stdout', 'stderr'] as const) {
          if (buffers[stream].trim()) onLine?.(buffers[stream]);
        }
        if (error) reject(error);
        else resolve();
      };

      const killTree = () => {
        if (!child.pid) return;
        try {
          if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
              stdio: 'ignore',
            });
          } else {
            process.kill(-child.pid, 'SIGKILL');
          }
        } catch {
          try {
            child.kill('SIGKILL');
          } catch {
            // Already gone.
          }
        }
      };

      const timer = setTimeout(() => {
        timedOut = true;
        onLine?.(
          `Command timed out after ${Math.round(timeoutMs / 1000)}s; terminating`,
        );
        killTree();
      }, timeoutMs);

      child.on('error', (error) => {
        finish(new Error(`Could not run "${command}": ${error.message}`));
      });

      child.on('exit', (code, signal) => {
        if (timedOut) {
          finish(
            new Error(`Command timed out after ${Math.round(timeoutMs / 1000)}s`),
          );
          return;
        }
        if (code === 0) {
          finish();
          return;
        }
        finish(
          new Error(
            `Command failed with ${code !== null ? `exit code ${code}` : `signal ${signal}`}: ${command}`,
          ),
        );
      });
    });
  }
}
