import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppManagerModule } from './appmanager/app-manager.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [AppManagerModule, McpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
