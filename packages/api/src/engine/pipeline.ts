import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { apps, appVersions, appGenerations } from '../db/schema/index';
import { parseIntent } from './intent-parser';
import { generateApp, iterateApp } from './code-generator';
import { validateGeneratedCode } from './validator';
import { bundleApp } from './bundler';
import { uploadBundle } from './storage';
import type { PipelineParams, PipelineResult } from './types';
import { createHash } from 'crypto';

type GenerationStatus = 'queued' | 'parsing' | 'architecting' | 'generating' | 'validating' | 'building' | 'deploying' | 'succeeded' | 'failed';

/**
 * Orchestrates the full app generation flow:
 *   parse intent -> generate code -> validate -> bundle -> upload -> save version
 *
 * Updates the generation record's status at each step.
 */
export async function runGenerationPipeline(params: PipelineParams): Promise<PipelineResult> {
  const { prompt, creatorId, type, existingSource } = params;
  let appId = params.appId;

  // We need either an existing appId (for iteration) or we'll create one (for initial)
  if (type === 'iterate' && !appId) {
    throw new Error('appId is required for iteration');
  }

  // Find the generation record (if linked to an appId, use the latest queued one)
  let generationId: string | null = null;
  if (appId) {
    const [gen] = await db
      .select({ id: appGenerations.id })
      .from(appGenerations)
      .where(eq(appGenerations.appId, appId))
      .orderBy(desc(appGenerations.queuedAt))
      .limit(1);
    generationId = gen?.id ?? null;
  }

  const updateStatus = async (status: GenerationStatus, extra?: Record<string, any>) => {
    if (!generationId) return;
    await db
      .update(appGenerations)
      .set({
        status,
        ...(status === 'parsing' || status === 'generating' ? { startedAt: new Date() } : {}),
        ...extra,
      })
      .where(eq(appGenerations.id, generationId));
  };

  try {
    // ─── Step 1: Parse Intent ────────────────────────────────
    await updateStatus('parsing');

    let intentData;
    let title: string;
    let description: string;

    if (type === 'initial') {
      intentData = await parseIntent(prompt);
      title = intentData.title;
      description = intentData.description;
    } else {
      // For iteration, we skip full intent parsing
      intentData = null;
      title = ''; // will be fetched from existing app
      description = '';
    }

    // ─── Step 2: Generate Code ───────────────────────────────
    await updateStatus('generating');

    let result;
    if (type === 'initial' && intentData) {
      result = await generateApp(intentData);
    } else if (existingSource) {
      result = await iterateApp(existingSource, prompt);
    } else {
      throw new Error('Iteration requested but no existing source provided');
    }

    if (!result.success) {
      await updateStatus('failed', {
        errorMessage: result.errors?.join('; ') || 'Code generation failed',
        errorCode: 'GENERATION_FAILED',
        completedAt: new Date(),
      });
      return {
        success: false,
        appId: appId || '',
        versionNumber: 0,
        bundleUrl: '',
        generationId: generationId || '',
        errors: result.errors,
      };
    }

    // ─── Step 3: Validate ────────────────────────────────────
    await updateStatus('validating');

    let validation = validateGeneratedCode(result.files);

    // Retry once on validation failure with error context
    if (!validation.valid) {
      console.log(`[Pipeline] Validation failed, retrying with error context: ${validation.errors.join(', ')}`);

      const retryPrompt = type === 'initial' && intentData
        ? null // will regenerate from intent
        : prompt;

      const errorContext = `\n\nIMPORTANT: The previous generation had these validation errors that you MUST fix:\n${validation.errors.map((e) => `- ${e}`).join('\n')}\n\nPlease regenerate the code without these issues.`;

      if (type === 'initial' && intentData) {
        // For initial generation, we modify the intent features to include fix instructions
        const patchedIntent = {
          ...intentData,
          features: [
            ...intentData.features,
            `CRITICAL FIX: ${validation.errors.join('. ')}`,
          ],
        };
        result = await generateApp(patchedIntent);
      } else if (existingSource) {
        result = await iterateApp(existingSource, prompt + errorContext);
      }

      if (!result.success) {
        await updateStatus('failed', {
          errorMessage: `Retry also failed: ${result.errors?.join('; ')}`,
          errorCode: 'GENERATION_RETRY_FAILED',
          completedAt: new Date(),
        });
        return {
          success: false,
          appId: appId || '',
          versionNumber: 0,
          bundleUrl: '',
          generationId: generationId || '',
          errors: result.errors,
        };
      }

      validation = validateGeneratedCode(result.files);
      if (!validation.valid) {
        await updateStatus('failed', {
          errorMessage: `Validation failed after retry: ${validation.errors.join('; ')}`,
          errorCode: 'VALIDATION_FAILED',
          completedAt: new Date(),
        });
        return {
          success: false,
          appId: appId || '',
          versionNumber: 0,
          bundleUrl: '',
          generationId: generationId || '',
          errors: validation.errors,
        };
      }
    }

    // ─── Step 4: Create app record if initial ────────────────
    if (type === 'initial' && !appId && intentData) {
      title = intentData.title;
      description = intentData.description;

      const slug = slugify(title) + '-' + randomSuffix();

      const [newApp] = await db
        .insert(apps)
        .values({
          creatorId,
          slug,
          name: title,
          description,
          originalPrompt: prompt,
          niche: intentData.niche,
          status: 'generating',
          tags: [intentData.app_type],
        })
        .returning({ id: apps.id });

      appId = newApp.id;

      // Link generation record to the app
      if (generationId) {
        await db
          .update(appGenerations)
          .set({ appId })
          .where(eq(appGenerations.id, generationId));
      }
    }

    if (!appId) {
      throw new Error('No appId available after generation');
    }

    // ─── Step 5: Bundle ──────────────────────────────────────
    await updateStatus('building');

    // Determine version number
    const [latestVersion] = await db
      .select({ versionNumber: appVersions.versionNumber })
      .from(appVersions)
      .where(eq(appVersions.appId, appId))
      .orderBy(desc(appVersions.versionNumber))
      .limit(1);

    const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;

    // Fetch title for bundle if iterating
    if (type === 'iterate') {
      const [app] = await db
        .select({ name: apps.name })
        .from(apps)
        .where(eq(apps.id, appId))
        .limit(1);
      title = app?.name || 'Sotally App';
    }

    const bundle = bundleApp(result.files, appId, versionNumber, title);

    // ─── Step 6: Upload to S3 ────────────────────────────────
    await updateStatus('deploying');

    const bundleUrl = await uploadBundle(appId, versionNumber, bundle.html, result.files);

    // ─── Step 7: Save version record ─────────────────────────
    const bundleHash = createHash('sha256').update(bundle.html).digest('hex').slice(0, 64);

    const [version] = await db
      .insert(appVersions)
      .values({
        appId,
        versionNumber,
        bundleUrl,
        bundleHash,
        bundleSizeBytes: bundle.bundleSizeBytes,
        sourceSnapshot: {
          files: result.files,
          entryPoint: 'App.tsx',
          dependencies: {},
        },
        generationId: generationId ?? undefined,
        prompt,
      })
      .returning({ id: appVersions.id });

    // Update app record — set proper name/description from intent if initial generation
    const appUpdate: Record<string, any> = {
      currentVersionId: version.id,
      status: 'draft',
      generationCount: sql`${apps.generationCount} + 1`,
      updatedAt: new Date(),
    };
    if (type === 'initial' && intentData) {
      appUpdate.name = intentData.title;
      appUpdate.description = intentData.description;
      appUpdate.tags = [intentData.app_type];
    }
    await db
      .update(apps)
      .set(appUpdate)
      .where(eq(apps.id, appId));

    // ─── Step 8: Mark generation as succeeded ────────────────
    const durationMs = generationId
      ? await computeDuration(generationId)
      : undefined;

    await updateStatus('succeeded', {
      resultVersionId: version.id,
      completedAt: new Date(),
      durationMs,
      inputTokens: result.tokenUsage?.inputTokens,
      outputTokens: result.tokenUsage?.outputTokens,
      totalTokens: result.tokenUsage?.totalTokens,
      model: process.env.GENERATION_MODEL || 'claude-sonnet-4-20250514',
    });

    return {
      success: true,
      appId,
      versionNumber,
      bundleUrl,
      generationId: generationId || '',
      tokenUsage: result.tokenUsage,
    };
  } catch (err: any) {
    console.error('[Pipeline] Fatal error:', err);

    await updateStatus('failed', {
      errorMessage: err.message,
      errorCode: 'PIPELINE_ERROR',
      completedAt: new Date(),
    });

    return {
      success: false,
      appId: appId || '',
      versionNumber: 0,
      bundleUrl: '',
      generationId: generationId || '',
      errors: [err.message],
    };
  }
}

// ─── Helpers ────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

async function computeDuration(generationId: string): Promise<number | undefined> {
  const [gen] = await db
    .select({ startedAt: appGenerations.startedAt })
    .from(appGenerations)
    .where(eq(appGenerations.id, generationId))
    .limit(1);

  if (gen?.startedAt) {
    return Date.now() - gen.startedAt.getTime();
  }
  return undefined;
}
