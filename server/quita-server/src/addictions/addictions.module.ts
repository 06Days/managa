import { Module } from '@nestjs/common';
import { AddictionsService } from './addictions.service';
import { AddictionsController } from './addictions.controller';

@Module({
  controllers: [AddictionsController],
  providers: [AddictionsService],
  exports: [AddictionsService],
})
export class AddictionsModule {}
