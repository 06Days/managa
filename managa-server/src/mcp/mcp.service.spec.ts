import { NotFoundException } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { AppsService } from '../appmanager/services/apps.service';
import type { AppView, Job } from '../appmanager/types';
import { McpService } from './mcp.service';

type AppsStub = Pick<
  AppsService,
  | 'getApps'
  | 'getApp'
  | 'getLogs'
  | 'listJobs'
  | 'getJob'
  | 'getCatalog'
  | 'install'
  | 'start'
  | 'stop'
  | 'rebuild'
  | 'uninstall'
  | 'restoreBuiltin'
>;

function appsStub(overrides: Partial<AppsStub> = {}): AppsService {
  return {
    getApps: jest.fn(() => []),
    getApp: jest.fn(),
    getLogs: jest.fn(),
    listJobs: jest.fn(() => []),
    getJob: jest.fn(),
    getCatalog: jest.fn(async () => ({ apps: [] })),
    install: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    rebuild: jest.fn(),
    uninstall: jest.fn(),
    restoreBuiltin: jest.fn(),
    ...overrides,
  } as unknown as AppsService;
}

const job: Job = {
  id: 'job-1',
  type: 'start',
  title: 'Starting Taska',
  status: 'running',
  message: 'Starting',
  progress: 10,
  logs: [],
  createdAt: new Date().toISOString(),
};

async function connect(service: McpService) {
  const server = service.createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client({ name: 'managa-mcp-test', version: '1.0.0' });
  await client.connect(clientTransport);
  return { client, server };
}

describe('McpService', () => {
  it('exposes the app management tools and list_apps', async () => {
    const app = {
      id: 'taska',
      name: 'Taska',
      overallStatus: 'running',
    } as AppView;
    const apps = appsStub({ getApps: jest.fn(() => [app]) });
    const { client, server } = await connect(new McpService(apps));

    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name)).toEqual(
        expect.arrayContaining([
          'list_apps',
          'get_app',
          'get_app_logs',
          'list_jobs',
          'get_job',
          'get_catalog',
          'install_app',
          'start_app',
          'stop_app',
          'rebuild_app',
          'uninstall_app',
          'restore_builtin_app',
        ]),
      );

      const result = await client.callTool({
        name: 'list_apps',
        arguments: {},
      });
      expect(result.isError).toBeFalsy();
      expect(result.structuredContent).toEqual({ apps: [app] });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('returns job ids from lifecycle tools', async () => {
    const start = jest.fn(() => job);
    const { client, server } = await connect(
      new McpService(appsStub({ start })),
    );

    try {
      const result = await client.callTool({
        name: 'start_app',
        arguments: { id: 'taska' },
      });
      expect(start).toHaveBeenCalledWith('taska');
      expect(result.isError).toBeFalsy();
      expect(result.structuredContent).toMatchObject({ id: 'job-1' });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('turns service errors into tool errors', async () => {
    const getApp = jest.fn(() => {
      throw new NotFoundException('App nope not found');
    });
    const { client, server } = await connect(
      new McpService(appsStub({ getApp })),
    );

    try {
      const result = await client.callTool({
        name: 'get_app',
        arguments: { id: 'nope' },
      });
      expect(result.isError).toBe(true);
      expect(result.content[0]).toMatchObject({
        type: 'text',
        text: 'Error: App nope not found',
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
