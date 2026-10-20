import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Job, JobStatus, JobType } from '../types';

const MAX_JOBS = 100;
const MAX_LOG_LINES = 500;

@Injectable()
export class JobsService {
  private readonly jobs = new Map<string, Job>();

  create(type: JobType, title: string, appId?: string): Job {
    const job: Job = {
      id: randomUUID(),
      type,
      title,
      appId,
      status: 'queued',
      message: 'Queued',
      progress: 0,
      logs: [],
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(job.id, job);
    this.prune();
    return job;
  }

  start(job: Job): Job {
    job.status = 'running';
    job.message = 'Running';
    job.startedAt = new Date().toISOString();
    this.log(job, `▶ ${job.title}`);
    return job;
  }

  log(job: Job | string, message: string): void {
    const target = typeof job === 'string' ? this.jobs.get(job) : job;
    if (!target) return;
    const line = `[${new Date().toISOString()}] ${message}`;
    target.logs.push(line);
    if (target.logs.length > MAX_LOG_LINES) {
      target.logs.splice(0, target.logs.length - MAX_LOG_LINES);
    }
    // Keep the server log useful for headless installations too.
    console.log(`[${target.type}:${target.id.slice(0, 8)}] ${message}`);
  }

  progress(job: Job, progress: number, message?: string): void {
    job.progress = Math.max(0, Math.min(100, Math.round(progress)));
    if (message) {
      job.message = message;
      this.log(job, message);
    }
  }

  succeed(job: Job, message = 'Done'): void {
    job.status = 'succeeded';
    job.progress = 100;
    job.message = message;
    job.finishedAt = new Date().toISOString();
    this.log(job, `✓ ${message}`);
  }

  fail(job: Job, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    job.status = 'failed';
    job.message = message;
    job.error = message;
    job.finishedAt = new Date().toISOString();
    this.log(job, `✗ ${message}`);
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  list(): Job[] {
    return [...this.jobs.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  findActiveForApp(appId: string): Job | undefined {
    return this.list().find(
      (job) =>
        job.appId === appId &&
        (job.status === 'queued' || job.status === 'running'),
    );
  }

  isTerminal(status: JobStatus): boolean {
    return status === 'succeeded' || status === 'failed';
  }

  private prune(): void {
    if (this.jobs.size <= MAX_JOBS) return;
    const finished = this.list()
      .filter((job) => this.isTerminal(job.status))
      .reverse();
    while (this.jobs.size > MAX_JOBS && finished.length > 0) {
      this.jobs.delete(finished.shift()!.id);
    }
  }
}
