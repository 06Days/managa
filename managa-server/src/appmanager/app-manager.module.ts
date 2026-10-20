import { Module } from '@nestjs/common';
import { AppManagerController } from './app-manager.controller';
import { AppsService } from './services/apps.service';
import { PathsService } from './services/paths.service';
import { RegistryService } from './services/registry.service';
import { ManifestService } from './services/manifest.service';
import { ProcessService } from './services/process.service';
import { CommandService } from './services/command.service';
import { GithubService } from './services/github.service';
import { JobsService } from './services/jobs.service';

@Module({
  controllers: [AppManagerController],
  providers: [
    PathsService,
    RegistryService,
    ManifestService,
    JobsService,
    ProcessService,
    CommandService,
    GithubService,
    AppsService,
  ],
  exports: [AppsService, PathsService, JobsService],
})
export class AppManagerModule {}
