import { Injectable, Logger } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createHash } from 'crypto';
import { z } from 'zod';
import { AppsService } from '../appmanager/services/apps.service';
import type {
  AppView,
  ComponentKind,
  RuntimeStatus,
} from '../appmanager/types';
import { RemoteMcpClient } from './remote-mcp.client';

const MAX_TOOL_NAME_LENGTH = 128;

export interface McpModuleSummary {
  appId: string;
  appName: string;
  namespace: string;
  component: ComponentKind;
  path: string;
  status: RuntimeStatus;
  available: boolean;
  toolCount: number;
  tools: string[];
  error?: string;
}

/**
 * Bridges app-owned MCP endpoints into managa's single MCP endpoint.
 *
 * Each app declares an `mcp` object in managa.app.json. The gateway lists the
 * app's tools and re-exposes them as `<namespace>_<tool>`, so a tool's origin is
 * obvious and two apps cannot collide. App tools are only exposed while the
 * component hosting the endpoint is running.
 */
@Injectable()
export class AppMcpGateway {
  private readonly logger = new Logger(AppMcpGateway.name);

  constructor(
    private readonly apps: AppsService,
    private readonly remote: RemoteMcpClient,
  ) {}

  async registerTools(
    server: McpServer,
    reservedNames: ReadonlySet<string> = new Set(),
  ): Promise<McpModuleSummary[]> {
    const usedNames = new Set(reservedNames);
    const apps = this.apps.getApps();
    const modules: McpModuleSummary[] = [];

    await Promise.all(
      apps.map(async (app) => {
        const mcp = app.manifest.mcp;
        if (!mcp) return;

        const componentKind =
          mcp.component ?? (app.manifest.server ? 'server' : 'client');
        const component = app[componentKind];
        const summary: McpModuleSummary = {
          appId: app.id,
          appName: app.name,
          namespace: mcp.namespace ?? app.id,
          component: componentKind,
          path: mcp.path ?? '/mcp',
          status: component?.status ?? 'stopped',
          available: false,
          toolCount: 0,
          tools: [],
        };
        modules.push(summary);

        if (!component || component.status !== 'running' || !component.port) {
          return;
        }

        const url = `http://127.0.0.1:${component.port}${summary.path}`;
        let tools: Tool[];
        try {
          tools = await this.remote.listTools(url);
        } catch (error) {
          summary.error =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Could not load MCP tools from ${app.id}: ${summary.error}`,
          );
          return;
        }

        summary.available = true;
        for (const tool of tools) {
          const exposedName = this.exposedName(summary.namespace, tool.name);
          if (usedNames.has(exposedName)) {
            this.logger.warn(
              `Skipping ${app.id} MCP tool "${tool.name}": "${exposedName}" is already registered`,
            );
            continue;
          }
          usedNames.add(exposedName);
          summary.tools.push(exposedName);

          server.registerTool(
            exposedName,
            {
              title: `${app.name}: ${tool.title ?? tool.name}`,
              description: this.description(app, tool),
              inputSchema: this.inputSchema(tool),
              annotations: tool.annotations,
            },
            async (args: unknown) => {
              try {
                return await this.remote.callTool(
                  url,
                  tool.name,
                  this.asArguments(args),
                );
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : String(error);
                return {
                  content: [
                    {
                      type: 'text' as const,
                      text: `Error from ${app.name} tool "${tool.name}": ${message}`,
                    },
                  ],
                  isError: true,
                };
              }
            },
          );
        }
        summary.toolCount = summary.tools.length;
      }),
    );

    return modules.sort((a, b) => a.appId.localeCompare(b.appId));
  }

  private exposedName(namespace: string, toolName: string): string {
    const safeNamespace = namespace.replace(/[^A-Za-z0-9._-]/g, '_');
    const safeToolName = toolName.replace(/[^A-Za-z0-9._-]/g, '_');
    const name = `${safeNamespace}_${safeToolName}`;
    if (name.length <= MAX_TOOL_NAME_LENGTH) return name;

    const suffix = createHash('sha1').update(name).digest('hex').slice(0, 8);
    return `${name.slice(0, MAX_TOOL_NAME_LENGTH - suffix.length - 1)}_${suffix}`;
  }

  private description(app: AppView, tool: Tool): string {
    const description = tool.description?.trim();
    return description
      ? `[${app.name}] ${description}`
      : `[${app.name}] ${tool.name}`;
  }

  private inputSchema(tool: Tool): z.ZodType {
    if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
      return z.any();
    }
    try {
      return z.fromJSONSchema(
        tool.inputSchema as Parameters<typeof z.fromJSONSchema>[0],
      );
    } catch (error) {
      this.logger.warn(
        `Could not convert input schema for MCP tool "${tool.name}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return z.any();
    }
  }

  private asArguments(args: unknown): Record<string, unknown> {
    if (args && typeof args === 'object' && !Array.isArray(args)) {
      return args as Record<string, unknown>;
    }
    return {};
  }
}
