import { NotFoundException } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { TaskListService } from '../task-list/task-list.service';
import { TasksService } from '../tasks/tasks.service';
import { TaskaMcpService } from './taska-mcp.service';

type ListStub = Pick<
  TaskListService,
  | 'findAllLists'
  | 'findOneList'
  | 'createList'
  | 'updateList'
  | 'addTaskToList'
  | 'removeList'
>;

type TasksStub = Pick<
  TasksService,
  'update' | 'toggle' | 'remove' | 'reorderTasks'
>;

function listStub(overrides: Partial<ListStub> = {}): TaskListService {
  return {
    findAllLists: jest.fn(async () => []),
    findOneList: jest.fn(),
    createList: jest.fn(),
    updateList: jest.fn(),
    addTaskToList: jest.fn(),
    removeList: jest.fn(),
    ...overrides,
  } as unknown as TaskListService;
}

function tasksStub(overrides: Partial<TasksStub> = {}): TasksService {
  return {
    update: jest.fn(),
    toggle: jest.fn(),
    remove: jest.fn(),
    reorderTasks: jest.fn(),
    ...overrides,
  } as unknown as TasksService;
}

async function connect(service: TaskaMcpService) {
  const server = service.createServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  const client = new Client({ name: 'taska-mcp-test', version: '1.0.0' });
  await client.connect(clientTransport);
  return { client, server };
}

describe('TaskaMcpService', () => {
  it('exposes task list and task tools', async () => {
    const lists = [{ id: 1, title: 'Home', tasks: [] }];
    const { client, server } = await connect(
      new TaskaMcpService(
        listStub({ findAllLists: jest.fn(async () => lists) }),
        tasksStub(),
      ),
    );

    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name)).toEqual(
        expect.arrayContaining([
          'list_task_lists',
          'get_task_list',
          'create_task_list',
          'update_task_list',
          'delete_task_list',
          'create_task',
          'update_task',
          'toggle_task',
          'delete_task',
          'reorder_tasks',
        ]),
      );

      const result = await client.callTool({
        name: 'list_task_lists',
        arguments: {},
      });
      expect(result.isError).toBeFalsy();
      expect(result.structuredContent).toEqual({ result: lists });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('creates a task in a list', async () => {
    const addTaskToList = jest.fn(async () => ({
      id: 9,
      title: 'Buy milk',
    }));
    const { client, server } = await connect(
      new TaskaMcpService(listStub({ addTaskToList }), tasksStub()),
    );

    try {
      const result = await client.callTool({
        name: 'create_task',
        arguments: { listId: 1, title: 'Buy milk' },
      });
      expect(result.isError).toBeFalsy();
      expect(addTaskToList).toHaveBeenCalledWith(1, {
        title: 'Buy milk',
        isCompleted: false,
        listPosition: 0,
      });
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('returns task service errors as tool errors', async () => {
    const { client, server } = await connect(
      new TaskaMcpService(
        listStub({
          findOneList: jest.fn(() => {
            throw new NotFoundException('Task list with ID 99 not found');
          }),
        }),
        tasksStub(),
      ),
    );

    try {
      const result = await client.callTool({
        name: 'get_task_list',
        arguments: { id: 99 },
      });
      expect(result.isError).toBe(true);
      expect(result.content[0]).toMatchObject({
        type: 'text',
        text: 'Error: Task list with ID 99 not found',
      });
    } finally {
      await client.close();
      await server.close();
    }
  });
});
