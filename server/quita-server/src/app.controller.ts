import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Quita API root' })
  root() {
    return {
      name: 'Quita API',
      status: 'ok',
      docs: '/docs',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check used by managa' })
  health() {
    return { status: 'ok' };
  }
}
