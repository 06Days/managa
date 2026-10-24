import { HttpException, Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AppsService } from '../appmanager/services/apps.service';
import type { LogsResult } from '../appmanager/types';

interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

function errorMessage(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === 'string') return response;
    if (response && typeof response === 'object' && 'message' in response) {
      const message = (response as { message?: string | string[] }).message;
      if (Array.isArray(message)) return message.join('; ');
      if (message) return message;
    }
  }
  return error instanceof Error ? error.message : String(error);
}

@Injectable()
export class McpService {
  constructor(private readonly apps: AppsService) {}

  /**
   * Build a fresh server for each HTTP request. The MCP endpoint is stateless,
   * so there is no per-client state to keep between requests.
   */
  createServer(): McpServer {
    const server = new McpServer(
      { name: 'managa', version: '0.1.0' },
      {
        instructions:
          'managa installs, starts, stops and rebuilds self-hosted productivity apps. ' +
          'Read tools are safe to call freely. Installing an app runs code from its ' +
          'repository, so confirm with the user before calling install_app. Ask before ' +
          'stopping, rebuilding or uninstalling an app, and before uninstalling with ' +
          'purgeData. Long-running actions return a job immediately; poll get_job until ' +
          'its status is succeeded or failed.',
      },
    );

    server.registerTool(
      'list_apps',
      {
        title: 'List apps',
        description:
          'List every installed app with its runtime status, ports, URLs, enabled state and manifest.',
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async () => this.run(() => ({ apps: this.apps.getApps() })),
    );

    server.registerTool(
      'get_app',
      {
        title: 'Get app',
        description: 'Get one installed app by id.',
        inputSchema: {
          id: z.string().min(1).describe('The app id (for example "taska")'),
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async ({ id }) => this.run(() => this.apps.getApp(id)),
    );

    server.registerTool(
      'get_app_logs',
      {
        title: 'Get app logs',
        description:
          'Read the tail of an app component log. Defaults to the server log when the app has a server component.',
        inputSchema: {
          id: z.string().min(1).describe('The app id'),
          component: z
            .enum(['client', 'server'])
            .optional()
            .describe('Which component log to read'),
          lines: z
            .number()
            .int()
            .min(1)
            .max(2000)
            .default(200)
            .describe('Number of log lines to return'),
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async ({ id, component, lines }) =>
        this.run(
          () => this.apps.getLogs(id, component, lines),
          (result: LogsResult) => {
            const body =
              result.lines.length > 0
                ? result.lines.join('\n')
                : '(the log is empty)';
            return `${result.appId} ${result.component} log: ${result.path}\n\n${body}`;
          },
        ),
    );

    server.registerTool(
      'list_jobs',
      {
        title: 'List jobs',
        description: 'List recent install, start, stop, rebuild and uninstall jobs.',
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async () => this.run(() => ({ jobs: this.apps.listJobs() })),
    );

    server.registerTool(
      'get_job',
      {
        title: 'Get job',
        description:
          'Get a job by id, including progress, status, errors and streamed output.',
        inputSchema: {
          id: z.string().min(1).describe('The job id returned by an action'),
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async ({ id }) => this.run(() => this.apps.getJob(id)),
    );

    server.registerTool(
      'get_catalog',
      {
        title: 'Get catalog',
        description:
          'List bundled and remote catalog apps, including whether each one is installed.',
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async () => this.run(() => this.apps.getCatalog()),
    );

    server.registerTool(
      'install_app',
      {
        title: 'Install app',
        description:
          'Install a compatible app from GitHub. The repository must contain managa.app.json at its root. ' +
          'Returns a job; poll get_job for progress.',
        inputSchema: {
          url: z
            .string()
            .min(1)
            .describe('GitHub URL or owner/repo shorthand'),
          ref: z
            .string()
            .optional()
            .describe('Optional branch, tag or commit to clone'),
          start: z
            .boolean()
            .optional()
            .describe('Start the app after a successful install'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true,
        },
      },
      async ({ url, ref, start }) =>
        this.run(() => this.apps.install({ url, ref, start })),
    );

    server.registerTool(
      'start_app',
      {
        title: 'Start app',
        description:
          'Start an app (server first, then client). Returns a job; poll get_job for progress.',
        inputSchema: {
          id: z.string().min(1).describe('The app id'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async ({ id }) => this.run(() => this.apps.start(id)),
    );

    server.registerTool(
      'stop_app',
      {
        title: 'Stop app',
        description:
          'Stop an app and disable its auto-start desired state. Returns a job; poll get_job for progress.',
        inputSchema: {
          id: z.string().min(1).describe('The app id'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async ({ id }) => this.run(() => this.apps.stop(id)),
    );

    server.registerTool(
      'rebuild_app',
      {
        title: 'Rebuild app',
        description:
          'Reinstall dependencies and rebuild a stopped app. Returns a job; poll get_job for progress.',
        inputSchema: {
          id: z.string().min(1).describe('The app id'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async ({ id }) => this.run(() => this.apps.rebuild(id)),
    );

    server.registerTool(
      'uninstall_app',
      {
        title: 'Uninstall app',
        description:
          'Stop and uninstall an app. Set purgeData to also delete its data directory and logs. ' +
          'Returns a job; poll get_job for progress.',
        inputSchema: {
          id: z.string().min(1).describe('The app id'),
          purgeData: z
            .boolean()
            .default(false)
            .describe('Also delete the app data directory and logs'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          openWorldHint: false,
        },
      },
      async ({ id, purgeData }) =>
        this.run(() => this.apps.uninstall(id, purgeData)),
    );

    server.registerTool(
      'restore_builtin_app',
      {
        title: 'Restore bundled app',
        description:
          'Restore a bundled app that was previously uninstalled. Returns a job; poll get_job for progress.',
        inputSchema: {
          id: z.string().min(1).describe('The bundled app id'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async ({ id }) => this.run(() => this.apps.restoreBuiltin(id)),
    );

    return server;
  }

  private async run<T>(
    action: () => T | Promise<T>,
    format?: (value: T) => string,
  ): Promise<ToolResult> {
    try {
      const value = await action();
      return {
        content: [
          {
            type: 'text',
            text: format
              ? format(value)
              : JSON.stringify(value, null, 2),
          },
        ],
        structuredContent: value as Record<string, unknown>,
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage(error)}` }],
        isError: true,
      };
    }
  }
}
