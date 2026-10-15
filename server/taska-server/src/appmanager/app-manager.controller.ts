import { Controller, Get } from '@nestjs/common';
import { AppManagerService as AppManagerService, AppInfo } from './app-manager.service';

@Controller('appmanager')
export class AppManagerController {
  constructor(private readonly appDiscoveryService: AppManagerService) {}

  @Get()
  async getDiscoveredApps(): Promise<AppInfo[]> {
    return this.appDiscoveryService.getApplications();
  }
}