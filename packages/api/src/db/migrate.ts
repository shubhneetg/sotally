import 'dotenv/config';
import { execSync } from 'node:child_process';

/**
 * Migration runner for pre-production use.
 * Uses drizzle-kit push to apply schema changes directly without migration files.
 * For production, switch to drizzle-kit migrate with proper migration files.
 */
async function main(): Promise<void> {
  console.log('Pushing schema to database...\n');

  try {
    execSync('npx drizzle-kit push', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log('\nSchema push complete.');
  } catch (error) {
    console.error('Schema push failed:', error);
    process.exit(1);
  }
}

main();
