import { Queue } from 'bullmq';
import { redis } from './redis';

// V1: Tool execution queue
export const executionQueue = new Queue('tool-executions', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
});

// V2: App generation queue
export const generationQueue = new Queue('app-generation', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 2000,
    },
    removeOnComplete: {
      age: 48 * 3600,
      count: 500,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
    timeout: 120_000, // 2 minute timeout per generation
  },
});
