import { Worker, type Job } from 'bullmq';
import { redis } from '../lib/redis';
import { env } from '../lib/env';
import { runGenerationPipeline } from '../engine/pipeline';
import type { GenerationJobData } from '../engine/types';

/**
 * BullMQ worker that processes app generation jobs.
 *
 * Each job runs the full pipeline: intent parsing -> code generation ->
 * validation -> bundling -> S3 upload -> version creation.
 *
 * The pipeline handles its own status updates on the app_generations table.
 */
const generationWorker = new Worker<GenerationJobData>(
  'app-generation',
  async (job: Job<GenerationJobData>) => {
    const { generationId, appId, creatorId, prompt, type, existingSource, niche } = job.data;

    console.log(
      `[GenWorker] Processing ${type} generation ${generationId} for app ${appId || '(new)'}`,
    );

    const result = await runGenerationPipeline({
      prompt,
      creatorId,
      appId: appId || undefined,
      type,
      existingSource,
    });

    if (result.success) {
      console.log(
        `[GenWorker] Generation ${generationId} succeeded — app ${result.appId} v${result.versionNumber}`,
      );
    } else {
      console.error(
        `[GenWorker] Generation ${generationId} failed: ${result.errors?.join(', ')}`,
      );
    }

    return result;
  },
  {
    connection: redis as any,
    concurrency: env.GENERATION_CONCURRENCY,
    limiter: {
      max: env.GENERATION_CONCURRENCY * 2,
      duration: 1000,
    },
  },
);

generationWorker.on('completed', (job) => {
  console.log(`[GenWorker] Job ${job.id} completed`);
});

generationWorker.on('failed', (job, err) => {
  console.error(`[GenWorker] Job ${job?.id} failed:`, err.message);
});

generationWorker.on('error', (err) => {
  console.error('[GenWorker] Worker error:', err.message);
});

export { generationWorker };
