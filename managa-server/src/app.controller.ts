import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('managa')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  info() {
    return this.appService.getInfo();
  }

  @Get('health')
  @ApiExcludeEndpoint()
  health() {
    return this.appService.health();
  }
}
