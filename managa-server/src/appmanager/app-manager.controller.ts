import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppsService } from './services/apps.service';
import { InstallAppDto } from './dto/install-app.dto';
import { ToggleAppDto } from './dto/toggle-app.dto';
import { LogsQueryDto, UninstallQueryDto } from './dto/query.dto';
import type {
  AppView,
  CatalogEntry,
  Job,
  LogsResult,
} from './types';

@ApiTags('appmanager')
@Controller('appmanager')
export class AppManagerController {
  constructor(private readonly apps: AppsService) {}

  @Get('apps')
  @ApiOperation({ summary: 'List every installed app and its runtime state' })
  listApps(): AppView[] {
    return this.apps.getApps();
  }

  @Get('apps/:id')
  @ApiOperation({ summary: 'Get one installed app' })
  getApp(@Param('id') id: string): AppView {
    return this.apps.getApp(id);
  }

  @Get('apps/:id/logs')
  @ApiOperation({ summary: 'Read the tail of an app component log' })
  getLogs(
    @Param('id') id: string,
    @Query() query: LogsQueryDto,
  ): Promise<LogsResult> {
    return this.apps.getLogs(id, query.component, query.lines);
  }

  @Post('apps/install')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Install a compatible app from GitHub',
    description:
      'Clones the repository, validates managa.app.json, installs dependencies, builds the app and registers it. Poll the returned job for progress.',
  })
  install(@Body() dto: InstallAppDto): Job {
    return this.apps.install(dto);
  }

  @Post('apps/:id/start')
  @HttpCode(202)
  @ApiOperation({ summary: 'Start an app (server first, then client)' })
  start(@Param('id') id: string): Job {
    return this.apps.start(id);
  }

  @Post('apps/:id/stop')
  @HttpCode(202)
  @ApiOperation({ summary: 'Stop an app' })
  stop(@Param('id') id: string): Job {
    return this.apps.stop(id);
  }

  @Post('apps/:id/toggle')
  @HttpCode(202)
  @ApiOperation({ summary: 'Turn an app on or off' })
  toggle(@Param('id') id: string, @Body() dto: ToggleAppDto): Job {
    return this.apps.toggle(id, dto.enabled);
  }

  @Post('apps/:id/rebuild')
  @HttpCode(202)
  @ApiOperation({ summary: 'Reinstall dependencies and rebuild a stopped app' })
  rebuild(@Param('id') id: string): Job {
    return this.apps.rebuild(id);
  }

  @Delete('apps/:id')
  @HttpCode(202)
  @ApiOperation({ summary: 'Stop and uninstall an app' })
  uninstall(
    @Param('id') id: string,
    @Query() query: UninstallQueryDto,
  ): Job {
    return this.apps.uninstall(id, query.purgeData);
  }

  @Post('builtins/:id/install')
  @HttpCode(202)
  @ApiOperation({ summary: 'Restore an uninstalled bundled app' })
  restoreBuiltin(@Param('id') id: string): Job {
    return this.apps.restoreBuiltin(id);
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Browse bundled and remote catalog entries' })
  getCatalog(): Promise<{ apps: CatalogEntry[] }> {
    return this.apps.getCatalog();
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List recent jobs' })
  listJobs(): Job[] {
    return this.apps.listJobs();
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Poll a job for progress and logs' })
  getJob(@Param('id') id: string): Job {
    return this.apps.getJob(id);
  }
}
