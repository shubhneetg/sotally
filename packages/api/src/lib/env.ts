import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  NEXTAUTH_SECRET: z.string(),
  API_KEY_ENCRYPTION_KEY: z.string(),
  FRONTEND_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // V1 legacy
  OPENAI_API_KEY: z.string().optional(),

  // V2: AI generation
  ANTHROPIC_API_KEY: z.string().optional(),
  GENERATION_MODEL: z.string().default('claude-sonnet-4-20250514'),
  GENERATION_CONCURRENCY: z.coerce.number().default(2),

  // V2: Object storage (MinIO / S3 compatible)
  S3_ENDPOINT: z.string().default('http://minio:9000'),
  S3_ACCESS_KEY: z.string().default('sotally'),
  S3_SECRET_KEY: z.string().default('sotally-secret-key'),
  S3_BUCKET: z.string().default('sotally-apps'),
  S3_REGION: z.string().default('us-east-1'),
  S3_PUBLIC_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
