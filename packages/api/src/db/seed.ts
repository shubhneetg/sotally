import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from './schema/index.js';

// ─── Database Connection ────────────────────────────────────────────────────

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const queryClient = postgres(connectionString, { max: 1 });
const db = drizzle(queryClient, { schema });

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(salt + password)
    .digest('hex');
  return `${salt}:${hash}`;
}

function generateReferralCode(): string {
  return randomBytes(6).toString('hex').toUpperCase().slice(0, 8);
}

// ─── Default Categories ─────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { name: 'AI Writing', slug: 'ai-writing', icon: '\u270d\ufe0f', sortOrder: 1 },
  { name: 'Marketing', slug: 'marketing', icon: '\ud83d\udce3', sortOrder: 2 },
  { name: 'Data Tools', slug: 'data-tools', icon: '\ud83d\udcca', sortOrder: 3 },
  { name: 'Productivity', slug: 'productivity', icon: '\u26a1', sortOrder: 4 },
  { name: 'Development', slug: 'development', icon: '\ud83d\udcbb', sortOrder: 5 },
  { name: 'Business', slug: 'business', icon: '\ud83d\udcbc', sortOrder: 6 },
] as const;

// Extra categories found in tool JSONs but not in defaults — map them to closest default
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'productivity': 'productivity',
  'wellness': 'productivity',       // wellness tools → productivity
  'marketing': 'marketing',
  'communication': 'ai-writing',    // communication tools → AI writing
  'sales': 'business',              // sales tools → business
  'ai-writing': 'ai-writing',
  'data-tools': 'data-tools',
  'development': 'development',
  'business': 'business',
};

// ─── Tool Templates ─────────────────────────────────────────────────────────

const TOOL_TEMPLATES = [
  {
    name: 'AI Text Generator',
    description: 'Base template for text generation tools. Includes standard prompt execution with configurable model and temperature.',
    executionType: 'prompt' as const,
    defaultConfig: {
      steps: [
        { type: 'llm', id: 'generate', model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 1000 },
        { type: 'output', id: 'result', template: '{{steps.generate}}', format: 'markdown' },
      ],
    },
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', title: 'Input text', minLength: 1, maxLength: 5000 },
      },
      required: ['text'],
    },
  },
  {
    name: 'Data Processor',
    description: 'Base template for data processing tools. Handles structured data input with transformation steps.',
    executionType: 'prompt' as const,
    defaultConfig: {
      steps: [
        { type: 'llm', id: 'process', model: 'gpt-4o-mini', temperature: 0.2, maxTokens: 1500 },
        { type: 'output', id: 'result', template: '{{steps.process}}', format: 'json' },
      ],
    },
    inputSchema: {
      type: 'object',
      properties: {
        data: { type: 'string', title: 'Input data', minLength: 1, maxLength: 10000 },
      },
      required: ['data'],
    },
  },
  {
    name: 'Analyzer',
    description: 'Base template for analysis tools. Optimized for detailed, structured analysis output.',
    executionType: 'prompt' as const,
    defaultConfig: {
      steps: [
        { type: 'llm', id: 'analyze', model: 'gpt-4o', temperature: 0.4, maxTokens: 1500 },
        { type: 'output', id: 'result', template: '{{steps.analyze}}', format: 'markdown' },
      ],
    },
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', title: 'Content to analyze', minLength: 10, maxLength: 10000 },
      },
      required: ['input'],
    },
  },
  {
    name: 'Email Writer',
    description: 'Base template for email composition tools. Includes tone and context configuration.',
    executionType: 'prompt' as const,
    defaultConfig: {
      steps: [
        { type: 'llm', id: 'compose', model: 'gpt-4o-mini', temperature: 0.6, maxTokens: 1000 },
        { type: 'output', id: 'result', template: '{{steps.compose}}', format: 'markdown' },
      ],
    },
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', title: 'Email topic', minLength: 3, maxLength: 500 },
        tone: { type: 'string', title: 'Tone', enum: ['professional', 'friendly', 'formal', 'casual'] },
      },
      required: ['topic'],
    },
  },
  {
    name: 'Content Repurposer',
    description: 'Base template for content repurposing tools. Transforms content from one format to another.',
    executionType: 'prompt' as const,
    defaultConfig: {
      steps: [
        { type: 'llm', id: 'repurpose', model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 1200 },
        { type: 'output', id: 'result', template: '{{steps.repurpose}}', format: 'markdown' },
      ],
    },
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', title: 'Source content', minLength: 10, maxLength: 10000 },
        targetFormat: { type: 'string', title: 'Target format', enum: ['blog-post', 'tweet-thread', 'linkedin-post', 'newsletter', 'summary'] },
      },
      required: ['content', 'targetFormat'],
    },
  },
];

// ─── Seed Functions ─────────────────────────────────────────────────────────

async function seedCategories(): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();
  let created = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, cat.slug))
      .limit(1);

    if (existing.length > 0) {
      categoryMap.set(cat.slug, existing[0].id);
    } else {
      const [inserted] = await db
        .insert(schema.categories)
        .values({
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
        })
        .returning({ id: schema.categories.id });

      categoryMap.set(cat.slug, inserted.id);
      created++;
    }
  }

  console.log(`Categories: ${created} created, ${DEFAULT_CATEGORIES.length - created} already existed`);
  return categoryMap;
}

async function seedAdminUser(): Promise<string> {
  const adminEmail = 'admin@sotally.com';

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail))
    .limit(1);

  if (existing.length > 0) {
    console.log('Admin user: already exists');
    return existing[0].id;
  }

  const defaultPassword = 'SotallyAdmin2024!';
  const passwordHash = hashPassword(defaultPassword);
  const referralCode = generateReferralCode();

  const [admin] = await db
    .insert(schema.users)
    .values({
      email: adminEmail,
      name: 'Sotally',
      passwordHash,
      role: 'admin',
      referralCode,
      creditBalance: 0,
      earningsBalance: 0,
      freeCreditsUsed: 0,
    })
    .returning({ id: schema.users.id });

  console.log('Admin user: created (email: admin@sotally.com, password: SotallyAdmin2024!)');
  return admin.id;
}

async function seedTools(
  adminUserId: string,
  categoryMap: Map<string, string>,
): Promise<number> {
  const toolsDir = join(process.cwd(), '..', '..', 'tools');
  const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.json'));
  let created = 0;

  for (const file of toolFiles) {
    const filePath = join(toolsDir, file);
    const raw = readFileSync(filePath, 'utf-8');
    const toolData = JSON.parse(raw) as {
      slug: string;
      name: string;
      description: string;
      longDescription?: string;
      category: string;
      tags?: string[];
      executionType: string;
      pricing?: Record<string, unknown>;
      inputSchema?: Record<string, unknown>;
      config?: Record<string, unknown>;
      demoOutput?: Record<string, unknown>;
    };

    // Check if tool already exists
    const existing = await db
      .select()
      .from(schema.tools)
      .where(eq(schema.tools.slug, toolData.slug))
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    // Map category slug to ID, falling back through the category map
    const mappedSlug = CATEGORY_SLUG_MAP[toolData.category] ?? 'productivity';
    const categoryId = categoryMap.get(mappedSlug) ?? null;

    await db.insert(schema.tools).values({
      creatorId: adminUserId,
      slug: toolData.slug,
      name: toolData.name,
      description: toolData.description,
      longDescription: toolData.longDescription ?? null,
      categoryId,
      tags: toolData.tags ?? [],
      executionType: toolData.executionType as 'prompt' | 'pipeline' | 'docker' | 'external_api',
      pricing: toolData.pricing ?? { model: 'per_run', creditsPerRun: 5 },
      inputSchema: toolData.inputSchema ?? null,
      config: toolData.config ?? null,
      demoOutput: toolData.demoOutput ?? null,
      status: 'published',
      isFeatured: false,
      totalRuns: 0,
    });

    created++;
  }

  console.log(`Tools: ${created} created, ${toolFiles.length - created} already existed`);
  return created;
}

async function seedTemplates(): Promise<number> {
  let created = 0;

  for (const tpl of TOOL_TEMPLATES) {
    const existing = await db
      .select()
      .from(schema.toolTemplates)
      .where(eq(schema.toolTemplates.name, tpl.name))
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    await db.insert(schema.toolTemplates).values({
      name: tpl.name,
      description: tpl.description,
      executionType: tpl.executionType,
      defaultConfig: tpl.defaultConfig,
      inputSchema: tpl.inputSchema,
    });

    created++;
  }

  console.log(`Templates: ${created} created, ${TOOL_TEMPLATES.length - created} already existed`);
  return created;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('Starting database seed...\n');

  try {
    const categoryMap = await seedCategories();
    const adminUserId = await seedAdminUser();
    await seedTools(adminUserId, categoryMap);
    await seedTemplates();

    console.log('\nSeed complete.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

main();
