import { Module } from '@nestjs/common';
import { AppManagerModule } from '../appmanager/app-manager.module';
import { AppMcpGateway } from './app-mcp.gateway';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { RemoteMcpClient } from './remote-mcp.client';

@Module({
  imports: [AppManagerModule],
  controllers: [McpController],
  providers: [McpService, AppMcpGateway, RemoteMcpClient],
})
export class McpModule {}
