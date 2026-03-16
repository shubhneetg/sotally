import { Worker, type Job } from 'bullmq';
import { redis } from '../lib/redis';
import { execute } from '../engine/executor';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 60_000;

export interface ExecutionJobData {
  executionId: string;
  toolId: string;
  userId: string;
  timeout?: number;
}

/**
 * BullMQ worker that processes tool execution jobs.
 *
 * For each job:
 * 1. Extracts executionId from job data
 * 2. Calls the executor to run the tool
 * 3. Returns the result (BullMQ stores it)
 *
 * Credit handling, status updates, and event publishing are all
 * handled inside executor.execute().
 */
const executionWorker = new Worker<ExecutionJobData>(
  'tool-executions',
  async (job: Job<ExecutionJobData>) => {
    const { executionId, timeout } = job.data;

    console.log(`[Worker] Processing execution ${executionId} (job ${job.id})`);

    const effectiveTimeout = Math.min(timeout ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);

    // Race the execution against a timeout
    const result = await Promise.race([
      execute(executionId),
      createTimeoutPromise(effectiveTimeout, executionId),
    ]);

    console.log(
      `[Worker] Execution ${executionId} ${result.status} in ${result.durationMs}ms`
    );

    return result;
  },
  {
    connection: redis as any,
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 1000,
    },
  }
);

function createTimeoutPromise(
  timeoutMs: number,
  executionId: string
): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Execution ${executionId} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

executionWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

executionWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

executionWorker.on('error', (err) => {
  console.error('[Worker] Worker error:', err.message);
});

export { executionWorker };
