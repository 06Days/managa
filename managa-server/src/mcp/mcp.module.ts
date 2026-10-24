import { Module } from '@nestjs/common';
import { AppManagerModule } from '../appmanager/app-manager.module';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [AppManagerModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
