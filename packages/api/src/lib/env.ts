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

  // V2: Multi-model LLM support
  // Set GENERATION_PROVIDER to explicitly choose, or leave empty for auto-detect
  GENERATION_PROVIDER: z.enum(['anthropic', 'openai', 'moonshot', 'openai-compatible']).optional(),
  GENERATION_MODEL: z.string().optional(), // auto-selected per provider if not set
  GENERATION_CONCURRENCY: z.coerce.number().default(2),

  // LLM API keys — at least one required for app generation
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  MOONSHOT_API_KEY: z.string().optional(),

  // Generic OpenAI-compatible provider (DeepSeek, Groq, Together, etc.)
  OPENAI_COMPATIBLE_API_KEY: z.string().optional(),
  OPENAI_COMPATIBLE_BASE_URL: z.string().optional(),

  // V2: Object storage (MinIO / S3 compatible)
  S3_ENDPOINT: z.string().default('http://minio:9000'),
  S3_ACCESS_KEY: z.string().default('sotally'),
  S3_SECRET_KEY: z.string().default('sotally-secret-key'),
  S3_BUCKET: z.string().default('sotally-apps'),
  S3_REGION: z.string().default('us-east-1'),
  S3_PUBLIC_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
