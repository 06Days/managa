import { Module } from '@nestjs/common';
import { AppManagerController } from './app-manager.controller';
import { AppManagerService } from './app-manager.service';

@Module({
  controllers: [AppManagerController],
  providers: [AppManagerService],
})
export class AppManagerModule {}