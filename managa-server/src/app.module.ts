import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppManagerModule } from './appmanager/app-manager.module';

@Module({
  imports: [AppManagerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
