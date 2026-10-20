import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AddictionsModule } from './addictions/addictions.module';
import { RelapsesModule } from './relapses/relapses.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, AddictionsModule, RelapsesModule],
  controllers: [AppController],
})
export class AppModule {}
