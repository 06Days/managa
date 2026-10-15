import { AppManagerService as AppManagerService, AppInfo } from './app-manager.service';
export declare class AppManagerController {
    private readonly appDiscoveryService;
    constructor(appDiscoveryService: AppManagerService);
    getDiscoveredApps(): Promise<AppInfo[]>;
}
