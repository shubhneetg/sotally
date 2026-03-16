import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema/index';

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

function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('Create Admin User\n');

  const email = await prompt('Email: ');
  if (!email || !email.includes('@')) {
    console.error('Invalid email address.');
    process.exit(1);
  }

  const name = await prompt('Name: ');
  if (!name) {
    console.error('Name is required.');
    process.exit(1);
  }

  const password = await prompt('Password: ');
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing.length > 0) {
      console.error(`User with email "${email}" already exists.`);
      process.exit(1);
    }

    const passwordHash = hashPassword(password);
    const referralCode = generateReferralCode();

    const [admin] = await db
      .insert(schema.users)
      .values({
        email,
        name,
        passwordHash,
        role: 'admin',
        referralCode,
        creditBalance: 0,
        earningsBalance: 0,
        freeCreditsUsed: 0,
      })
      .returning({ id: schema.users.id, email: schema.users.email });

    console.log(`\nAdmin user created successfully.`);
    console.log(`  ID: ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role: admin`);
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

main();
