import { HttpException, Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { TaskListService } from '../task-list/task-list.service';
import { TasksService } from '../tasks/tasks.service';

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
export class TaskaMcpService {
  constructor(
    private readonly taskLists: TaskListService,
    private readonly tasks: TasksService,
  ) {}

  createServer(): McpServer {
    const server = new McpServer(
      { name: 'taska', version: '0.1.0' },
      {
        instructions:
          'Taska stores task lists and their tasks. Read tools are safe to call freely. ' +
          'Ask the user before deleting a list or task, and before reordering a list. ' +
          'Task and list ids are stable integers returned by the read tools.',
      },
    );

    server.registerTool(
      'list_task_lists',
      {
        title: 'List task lists',
        description: 'List every task list with its tasks in display order.',
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async () => this.run(() => this.taskLists.findAllLists()),
    );

    server.registerTool(
      'get_task_list',
      {
        title: 'Get task list',
        description: 'Get one task list and its tasks by id.',
        inputSchema: {
          id: z.number().int().positive().describe('The task list id'),
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async ({ id }) => this.run(() => this.taskLists.findOneList(id)),
    );

    server.registerTool(
      'create_task_list',
      {
        title: 'Create task list',
        description: 'Create a new task list.',
        inputSchema: {
          title: z.string().min(1).describe('The list title'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async ({ title }) => this.run(() => this.taskLists.createList({ title })),
    );

    server.registerTool(
      'update_task_list',
      {
        title: 'Update task list',
        description: 'Rename an existing task list.',
        inputSchema: {
          id: z.number().int().positive().describe('The task list id'),
          title: z.string().min(1).describe('The new list title'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async ({ id, title }) =>
        this.run(() => this.taskLists.updateList(id, { title })),
    );

    server.registerTool(
      'delete_task_list',
      {
        title: 'Delete task list',
        description:
          'Delete a task list and every task inside it. Confirm with the user first.',
        inputSchema: {
          id: z.number().int().positive().describe('The task list id'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          openWorldHint: false,
        },
      },
      async ({ id }) =>
        this.run(async () => {
          await this.taskLists.removeList(id);
          return { deleted: true, id };
        }),
    );

    server.registerTool(
      'create_task',
      {
        title: 'Create task',
        description: 'Add a task to an existing task list.',
        inputSchema: {
          listId: z.number().int().positive().describe('The task list id'),
          title: z.string().min(1).describe('The task title'),
          isCompleted: z
            .boolean()
            .optional()
            .describe('Create the task as completed'),
          listPosition: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe('Display position within the list'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async ({ listId, title, isCompleted, listPosition }) =>
        this.run(() =>
          this.taskLists.addTaskToList(listId, {
            title,
            isCompleted: isCompleted ?? false,
            listPosition: listPosition ?? 0,
          }),
        ),
    );

    server.registerTool(
      'update_task',
      {
        title: 'Update task',
        description: 'Update a task title, completion state or position.',
        inputSchema: {
          id: z.number().int().positive().describe('The task id'),
          title: z.string().min(1).optional().describe('The new task title'),
          isCompleted: z
            .boolean()
            .optional()
            .describe('Whether the task is completed'),
          listPosition: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe('Display position within the list'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async ({ id, title, isCompleted, listPosition }) =>
        this.run(() =>
          this.tasks.update(id, { title, isCompleted, listPosition }),
        ),
    );

    server.registerTool(
      'toggle_task',
      {
        title: 'Toggle task',
        description: 'Toggle a task between complete and incomplete.',
        inputSchema: {
          id: z.number().int().positive().describe('The task id'),
          listId: z.number().int().positive().describe('The task list id'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async ({ id, listId }) => this.run(() => this.tasks.toggle(id, listId)),
    );

    server.registerTool(
      'delete_task',
      {
        title: 'Delete task',
        description: 'Delete one task. Confirm with the user first.',
        inputSchema: {
          id: z.number().int().positive().describe('The task id'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          openWorldHint: false,
        },
      },
      async ({ id }) =>
        this.run(async () => {
          await this.tasks.remove(id);
          return { deleted: true, id };
        }),
    );

    server.registerTool(
      'reorder_tasks',
      {
        title: 'Reorder tasks',
        description:
          'Set the order of tasks in a list. Pass every task id in the desired order.',
        inputSchema: {
          listId: z.number().int().positive().describe('The task list id'),
          taskIds: z
            .array(z.number().int().positive())
            .min(1)
            .describe('Task ids in the desired display order'),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      async ({ listId, taskIds }) =>
        this.run(async () => {
          await this.tasks.reorderTasks(
            listId,
            taskIds.map((id) => ({ id })),
          );
          return { reordered: true, listId, taskIds };
        }),
    );

    return server;
  }

  /**
   * MCP structuredContent must be a plain JSON object. TypeORM entities are
   * class instances, so round-trip them through JSON first.
   */
  private structuredContent(
    value: unknown,
    text: string,
  ): Record<string, unknown> {
    if (Array.isArray(value)) {
      return { result: JSON.parse(text) as unknown[] };
    }
    if (value && typeof value === 'object') {
      return JSON.parse(text) as Record<string, unknown>;
    }
    return { value };
  }

  private async run(
    action: () => unknown | Promise<unknown>,
  ): Promise<CallToolResult> {
    try {
      const value = await action();
      const text = JSON.stringify(value, null, 2);
      return {
        content: [{ type: 'text', text }],
        structuredContent: this.structuredContent(value, text),
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${errorMessage(error)}` }],
        isError: true,
      };
    }
  }
}
