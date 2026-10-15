import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AppInfo {
  name: string;
  version: string;
  relativePath: string;
}

@Injectable()
export class AppManagerService {
  async getApplications(): Promise<AppInfo[]> {
    const srcDir = path.join(process.cwd(), 'src');
    const apps: AppInfo[] = [];

    try {
      const entries = await fs.readdir(srcDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const folderName = entry.name;
          if (folderName==='appmanager'){
            continue;
          }
          const folderPath = path.join(srcDir, folderName);
          const relativePath = path.relative(process.cwd(), folderPath);

          let version = '0.0.1'; 

          
          try {
            const packageJsonPath = path.join(folderPath, 'package.json');
            const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(packageContent);
            if (packageJson.version) {
              version = packageJson.version;
            }
          } catch {
           
          }

          apps.push({
            name: folderName,
            version,
            relativePath: `/${relativePath.replace(/\\/g, '/')}`,
          });
        }
      }
    } catch (error) {
      console.error('Error scanning src directory:', error);
    }

    return apps;
  }
}