import { Injectable } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

const CONNECT_TIMEOUT_MS = 5_000;
const LIST_TIMEOUT_MS = 5_000;
const CALL_TIMEOUT_MS = 60_000;

function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
    timer.unref?.();
  });
  return Promise.race([promise, deadline]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Small stateless MCP client used by the managa gateway to reach app-owned MCP
 * endpoints. A fresh connection is made per operation so module restarts do
 * not leave stale sessions behind.
 */
@Injectable()
export class RemoteMcpClient {
  async listTools(url: string): Promise<Tool[]> {
    return this.withClient(url, async (client) => {
      const result = await client.listTools(undefined, {
        timeout: LIST_TIMEOUT_MS,
      });
      return result.tools;
    });
  }

  async callTool(
    url: string,
    name: string,
    args: Record<string, unknown>,
  ): Promise<CallToolResult> {
    return this.withClient(url, async (client) => {
      const result = await client.callTool(
        { name, arguments: args },
        undefined,
        { timeout: CALL_TIMEOUT_MS },
      );
      return result as CallToolResult;
    });
  }

  private async withClient<T>(
    url: string,
    action: (client: Client) => Promise<T>,
  ): Promise<T> {
    const client = new Client({
      name: 'managa-mcp-gateway',
      version: '0.1.0',
    });
    const transport = new StreamableHTTPClientTransport(new URL(url));

    try {
      await timeout(
        client.connect(transport),
        CONNECT_TIMEOUT_MS,
        `Timed out connecting to MCP endpoint ${url}`,
      );
      return await action(client);
    } finally {
      await client.close().catch(() => undefined);
    }
  }
}
