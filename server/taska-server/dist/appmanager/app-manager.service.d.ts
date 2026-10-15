export interface AppInfo {
    name: string;
    version: string;
    relativePath: string;
}
export declare class AppManagerService {
    getApplications(): Promise<AppInfo[]>;
}
