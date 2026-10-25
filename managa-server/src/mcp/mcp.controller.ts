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
import { ApiExcludeController } from '@nestjs/swagger';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { timingSafeEqual } from 'crypto';
import type { Request, Response } from 'express';
import { McpService } from './mcp.service';

interface JsonRpcErrorBody {
  jsonrpc: '2.0';
  error: { code: number; message: string };
  id: null;
}

@ApiExcludeController()
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly mcp: McpService) {}

  @Post()
  async handlePost(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
  ): Promise<void> {
    if (!this.authorize(req, res)) return;

    const server = await this.mcp.createServer();
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
        `MCP request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (!res.headersSent) {
        res.status(500).json(this.errorBody(-32603, 'Internal server error'));
      }
    }
  }

  @Get()
  handleGet(@Req() req: Request, @Res() res: Response): void {
    if (!this.authorize(req, res)) return;
    res
      .status(405)
      .set('Allow', 'POST')
      .json(this.errorBody(-32000, 'Method not allowed'));
  }

  @Delete()
  handleDelete(@Req() req: Request, @Res() res: Response): void {
    if (!this.authorize(req, res)) return;
    res
      .status(405)
      .set('Allow', 'POST')
      .json(this.errorBody(-32000, 'Method not allowed'));
  }

  /**
   * The REST API has no authentication, but MCP can optionally require a
   * bearer token because it is intended for remote AI clients. Set
   * MANAGA_MCP_TOKEN to enable the check; leave it unset for an open endpoint.
   */
  private authorize(req: Request, res: Response): boolean {
    const expected = process.env.MANAGA_MCP_TOKEN;
    if (!expected) return true;

    const header = req.headers.authorization;
    const prefix = 'Bearer ';
    if (header?.startsWith(prefix)) {
      const actual = Buffer.from(header.slice(prefix.length));
      const wanted = Buffer.from(expected);
      if (actual.length === wanted.length && timingSafeEqual(actual, wanted)) {
        return true;
      }
    }

    res
      .status(401)
      .set('WWW-Authenticate', 'Bearer realm="managa"')
      .json(this.errorBody(-32001, 'Unauthorized'));
    return false;
  }

  private errorBody(code: number, message: string): JsonRpcErrorBody {
    return { jsonrpc: '2.0', error: { code, message }, id: null };
  }
}
