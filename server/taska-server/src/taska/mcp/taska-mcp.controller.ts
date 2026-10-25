import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { TaskaMcpService } from './taska-mcp.service';

interface JsonRpcErrorBody {
  jsonrpc: '2.0';
  error: { code: number; message: string };
  id: null;
}

@Controller('mcp')
export class TaskaMcpController {
  private readonly logger = new Logger(TaskaMcpController.name);

  constructor(private readonly mcp: TaskaMcpService) {}

  @Post()
  async handlePost(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
  ): Promise<void> {
    const server = this.mcp.createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error) {
      this.logger.error(
        `Taska MCP request failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      if (!res.headersSent) {
        res.status(500).json(this.errorBody(-32603, 'Internal server error'));
      }
    }
  }

  @Get()
  handleGet(@Res() res: Response): void {
    res
      .status(405)
      .set('Allow', 'POST')
      .json(this.errorBody(-32000, 'Method not allowed'));
  }

  @Delete()
  handleDelete(@Res() res: Response): void {
    res
      .status(405)
      .set('Allow', 'POST')
      .json(this.errorBody(-32000, 'Method not allowed'));
  }

  private errorBody(code: number, message: string): JsonRpcErrorBody {
    return { jsonrpc: '2.0', error: { code, message }, id: null };
  }
}
