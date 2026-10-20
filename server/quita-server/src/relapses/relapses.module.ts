import { Module } from '@nestjs/common';
import { AddictionsModule } from '../addictions/addictions.module';
import { RelapsesController } from './relapses.controller';
import { RelapsesService } from './relapses.service';

@Module({
  imports: [AddictionsModule],
  controllers: [RelapsesController],
  providers: [RelapsesService],
})
export class RelapsesModule {}
