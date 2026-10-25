import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AppView } from '../appmanager/types';
import { AppsService } from '../appmanager/services/apps.service';
import { AppMcpGateway } from './app-mcp.gateway';
import { RemoteMcpClient } from './remote-mcp.client';

function appView(overrides: Partial<AppView> = {}): AppView {
  return {
    id: 'taska',
    name: 'Taska',
    description: 'Tasks',
    version: '0.1.0',
    icon: '✅',
    tags: [],
    source: { type: 'builtin', manifestPath: 'taska.app.json' },
    installedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    enabled: true,
    overallStatus: 'running',
    manifest: {
      name: 'Taska',
      server: { dir: 'server', start: 'npm start' },
      mcp: { component: 'server', path: '/mcp', namespace: 'taska' },
    },
    server: {
      kind: 'server',
      dir: 'server',
      startCommand: 'npm start',
      status: 'running',
      port: 4100,
      url: 'http://localhost:4100',
    },
    ...overrides,
  } as AppView;
}

function appsService(apps: AppView[]): AppsService {
  return {
    getApps: jest.fn(() => apps),
  } as unknown as AppsService;
}

async function connectGateway(
  apps: AppView[],
  remote: RemoteMcpClient,
  reservedNames: ReadonlySet<string> = new Set(),
) {
  const gateway = new AppMcpGateway(appsService(apps), remote);
  const server = new McpServer({ name: 'gateway-test', version: '1.0.0' });
  // Keep the low-level tools capability enabled even when no module is live.
  server.registerTool(
    'gateway_probe',
    { description: 'Test probe' },
    async () => ({ content: [] }),
  );
  const modules = await gateway.registerTools(server, reservedNames);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client({ name: 'gateway-test-client', version: '1.0.0' });
  await client.connect(clientTransport);
  return { client, server, modules };
}

const listTaskListsTool = {
  name: 'list_task_lists',
  title: 'List task lists',
  description: 'List every task list',
  inputSchema: {
    type: 'object',
    properties: {
      includeCompleted: { type: 'boolean' },
    },
    additionalProperties: false,
  },
};

describe('AppMcpGateway', () => {
  it('namespaces and proxies app-owned tools', async () => {
    const remote = {
      listTools: jest.fn(async () => [listTaskListsTool]),
      callTool: jest.fn(async () => ({
        content: [{ type: 'text', text: 'task lists' }],
      })),
    } as unknown as RemoteMcpClient;
    const { client, server, modules } = await connectGateway(
      [appView()],
      remote,
    );

    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name)).toContain('taska_list_task_lists');
      expect(modules).toEqual([
        expect.objectContaining({
          appId: 'taska',
          namespace: 'taska',
          available: true,
          toolCount: 1,
          tools: ['taska_list_task_lists'],
        }),
      ]);

      const result = await client.callTool({
        name: 'taska_list_task_lists',
        arguments: { includeCompleted: true },
      });
      expect(result.isError).toBeFalsy();
      expect(remote.callTool).toHaveBeenCalledWith(
        'http://127.0.0.1:4100/mcp',
        'list_task_lists',
        { includeCompleted: true },
      );
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('does not expose tools from a stopped component', async () => {
    const remote = {
      listTools: jest.fn(async () => [listTaskListsTool]),
      callTool: jest.fn(),
    } as unknown as RemoteMcpClient;
    const { client, server, modules } = await connectGateway(
      [appView({ server: { ...appView().server!, status: 'stopped' } })],
      remote,
    );

    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name)).not.toContain(
        'taska_list_task_lists',
      );
      expect(remote.listTools).not.toHaveBeenCalled();
      expect(modules[0]).toMatchObject({ available: false, status: 'stopped' });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('records module errors without failing the gateway', async () => {
    const remote = {
      listTools: jest.fn(async () => {
        throw new Error('connection refused');
      }),
      callTool: jest.fn(),
    } as unknown as RemoteMcpClient;
    const { client, server, modules } = await connectGateway(
      [appView()],
      remote,
    );

    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name)).not.toContain(
        'taska_list_task_lists',
      );
      expect(modules[0]).toMatchObject({
        available: false,
        error: 'connection refused',
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
