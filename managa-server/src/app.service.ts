import { Injectable } from '@nestjs/common';
import { AppsService } from './appmanager/services/apps.service';
import { PathsService } from './appmanager/services/paths.service';

@Injectable()
export class AppService {
  constructor(
    private readonly apps: AppsService,
    private readonly paths: PathsService,
  ) {}

  getInfo() {
    return {
      name: 'managa',
      description:
        'Install, toggle and manage self-productivity apps',
      version: '0.1.0',
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      dataDir: this.paths.dataDir,
      docs: '/docs',
      endpoints: {
        apps: '/appmanager/apps',
        install: '/appmanager/apps/install',
        catalog: '/appmanager/catalog',
        jobs: '/appmanager/jobs',
        mcp: '/mcp',
      },
      summary: this.apps.getSummary(),
    };
  }

  health() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
