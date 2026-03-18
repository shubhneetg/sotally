#!/usr/bin/env node

/**
 * Sotally V2 -- Full Demo Seed Script
 *
 * Creates 12 creator storefronts with 4 apps each (48 total),
 * 48 end-users (4 per storefront), and follow relationships.
 *
 * Prerequisites:
 *   - API running at http://localhost:4000
 *   - Generation worker running (processes BullMQ jobs)
 *   - PostgreSQL accessible at localhost:5432
 *
 * Usage: node scripts/seed-full-demo.mjs
 */

import { SignJWT } from 'jose';
import postgres from 'postgres';
import crypto from 'crypto';

// ─── Config ──────────────────────────────────────────────────────────────────

const API = 'http://localhost:4000';
const SECRET = 'sotally-dev-secret-change-in-production-32chars';
const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 60_000;
const BETWEEN_GENERATIONS_MS = 3_000;

const sql = postgres('postgresql://sotally:sotally@localhost:5432/sotally');

// ─── Creator Data ────────────────────────────────────────────────────────────

const CREATORS = [
  { slug: 'priya', name: 'Priya Menon', email: 'priya@sotally.com', niche: 'wellness', bio: 'Life coach. Small daily practices for a calmer mind.', apps: [
    'Build a daily mood check-in where users pick an emoji and write one sentence about why',
    'Build a CBT thought record tool that walks through identifying cognitive distortions',
    'Build a breathwork timer with 4-7-8 and box breathing modes with visual animation',
    'Build a gratitude journal where users log 3 things daily with weekly summaries',
  ]},
  { slug: 'luna', name: 'Luna Devereaux', email: 'luna@sotally.com', niche: 'astrology', bio: 'Tarot reader, astrologer, cosmic translator.', apps: [
    'Build a birth chart calculator where users enter birth date time and city for sun moon rising',
    'Build a daily tarot card pull showing one major arcana card with meanings',
    'Build a compatibility checker where two people enter birth dates for chemistry scores',
    'Build a moon phase tracker showing current phase and best activities',
  ]},
  { slug: 'aj', name: 'Arjun Thakur', email: 'aj@sotally.com', niche: 'fitness', bio: 'Personal trainer. Train smarter, no guesswork.', apps: [
    'Build a workout plan generator based on goals equipment and experience level',
    'Build a macro calculator showing daily calories protein carbs fat',
    'Build a one-rep max calculator using Epley formula with percentage charts',
    'Build a water intake tracker with progress bar based on body weight',
  ]},
  { slug: 'raj', name: 'Raj Malhotra', email: 'raj@sotally.com', niche: 'education', bio: 'Physics educator. Stop memorizing, start understanding.', apps: [
    'Build a physics quiz with randomized problems by topic and score tracking',
    'Build flashcards for AP Physics formulas with spaced repetition',
    'Build a projectile motion simulator with launch angle velocity and trajectory',
    'Build a study planner generating daily schedule from exam date and chapters',
  ]},
  { slug: 'keisha', name: 'Keisha Drummond', email: 'keisha@sotally.com', niche: 'finance', bio: 'Paid off $74K debt. These are the tools I wish I had.', apps: [
    'Build a monthly budget tracker with income expenses and pie chart',
    'Build a debt snowball calculator showing payoff order and timeline',
    'Build a savings goal tracker with visual progress bar',
    'Build an emergency fund calculator based on expenses and job stability',
  ]},
  { slug: 'drlina', name: 'Dr. Lina Vasquez', email: 'drlina@sotally.com', niche: 'nutrition', bio: 'Board-certified dietitian. Evidence-based tools.', apps: [
    'Build a low-FODMAP meal planner with dietary filters and grocery list',
    'Build a food and symptom diary that correlates meals with symptoms',
    'Build a FODMAP food lookup with traffic light ratings',
    'Build a protein intake calculator with food examples',
  ]},
  { slug: 'danielle', name: 'Danielle Okafor', email: 'danielle@sotally.com', niche: 'parenting', bio: 'Mom of 3. Calm parenting, one tool at a time.', apps: [
    'Build a kids chore tracker with star completion board',
    'Build a screen time planner based on child age guidelines',
    'Build a bedtime routine builder with visual sequence cards',
    'Build a developmental milestone tracker for ages 0-5',
  ]},
  { slug: 'kenji', name: 'Kenji Nakamura', email: 'kenji@sotally.com', niche: 'language', bio: 'Teaching Japanese the way people actually speak it.', apps: [
    'Build Japanese vocabulary flashcards grouped by theme with repetition',
    'Build a Japanese verb conjugation quizzer with instant feedback',
    'Build a daily Japanese phrase generator with word breakdown',
    'Build a Japanese conversation simulator with scenario selection',
  ]},
  { slug: 'janelle', name: 'Janelle Washington', email: 'janelle@sotally.com', niche: 'business', bio: '15 years at Deloitte. Now teaching freelancers.', apps: [
    'Build a freelancer pricing calculator from income goals and expenses',
    'Build a simple invoice generator with client info and amounts',
    'Build a freelancer client CRM tracking status and follow-ups',
    'Build a proposal builder from problem solution and pricing',
  ]},
  { slug: 'marcus', name: 'Marcus Delgado', email: 'marcus@sotally.com', niche: 'real-estate', bio: '14 years selling homes. Free calculators for everyone.', apps: [
    'Build a mortgage calculator with full PITI breakdown and loan toggle',
    'Build a rental property analyzer with cash-on-cash return and cap rate',
    'Build a closing cost estimator for buyers',
    'Build a property comparison tool scoring up to 3 properties side by side',
  ]},
  { slug: 'aisha', name: 'Aisha Jordan', email: 'aisha@sotally.com', niche: 'content', bio: '100K YouTube subs. Grow, monetize, stop guessing.', apps: [
    'Build a YouTube thumbnail A/B tester where visitors vote on two images',
    'Build a 30-day content calendar based on posting frequency and pillars',
    'Build a sponsorship rate calculator from channel metrics',
    'Build a channel analytics dashboard from video stats with recommendations',
  ]},
  { slug: 'lena', name: 'Lena Vasquez', email: 'lena@sotally.com', niche: 'design', bio: 'Brand tools for non-designers.', apps: [
    'Build a color palette generator based on mood and base color with hex codes',
    'Build a font pairing tool recommending Google Fonts by industry',
    'Build a brand style quiz revealing brand archetype with recommendations',
    'Build a social media post template maker with brand colors and layout',
  ]},
];

// End-user first names per storefront (4 per creator)
const END_USER_NAMES = {
  priya:    ['ravi', 'meera', 'anil', 'sneha'],
  luna:     ['maya', 'orion', 'celeste', 'felix'],
  aj:       ['rohit', 'tanya', 'vikram', 'nisha'],
  raj:      ['amit', 'pooja', 'karan', 'divya'],
  keisha:   ['jordan', 'taylor', 'morgan', 'alex'],
  drlina:   ['sofia', 'mateo', 'camila', 'diego'],
  danielle: ['emma', 'noah', 'olivia', 'liam'],
  kenji:    ['yuki', 'hiro', 'sakura', 'takeshi'],
  janelle:  ['devon', 'casey', 'quinn', 'reese'],
  marcus:   ['carlos', 'elena', 'gabriel', 'lucia'],
  aisha:    ['zara', 'malik', 'imani', 'darius'],
  lena:     ['clara', 'matias', 'valentina', 'nico'],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function genId() {
  return crypto.randomUUID();
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function generateJWT(userId, email) {
  const secret = new TextEncoder().encode(SECRET);
  return new SignJWT({ sub: userId, email, role: 'creator' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

async function pollUntilDone(appId, token) {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const res = await fetch(`${API}/apps/${appId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) {
        return { status: 'error', error: data.error?.message || 'Unknown error' };
      }

      const genStatus = data.data?.generation?.status;
      const appStatus = data.data?.appStatus;

      if (genStatus === 'succeeded' || appStatus === 'draft') {
        return { status: 'succeeded' };
      }
      if (genStatus === 'failed') {
        return {
          status: 'failed',
          error: data.data?.generation?.errorMessage || 'Generation failed',
        };
      }
      // Still processing -- keep polling
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  }
  return { status: 'timeout', error: `Timed out after ${POLL_TIMEOUT_MS / 1000}s` };
}

// ─── Step 1: Create 12 Creator Users via SQL ─────────────────────────────────

async function createCreators() {
  console.log('\n=== Step 1: Creating 12 Creator Users ===\n');

  const creatorMap = {}; // slug -> { id, email, ... }

  for (const c of CREATORS) {
    const id = genId();
    try {
      await sql`
        INSERT INTO users (id, email, name, password_hash, referral_code, storefront_slug, bio, niche, onboarding_complete, credit_balance, role)
        VALUES (
          ${id},
          ${c.email},
          ${c.name},
          '$2b$10$placeholder',
          ${c.slug + '-ref'},
          ${c.slug},
          ${c.bio},
          ${c.niche},
          true,
          100,
          'creator'
        )
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          storefront_slug = EXCLUDED.storefront_slug,
          bio = EXCLUDED.bio,
          niche = EXCLUDED.niche,
          onboarding_complete = EXCLUDED.onboarding_complete,
          credit_balance = EXCLUDED.credit_balance
        RETURNING id
      `;

      // Re-fetch the actual ID (handles ON CONFLICT returning existing row)
      const [row] = await sql`SELECT id FROM users WHERE email = ${c.email}`;
      creatorMap[c.slug] = { id: row.id, ...c };
      console.log(`  [ok] ${c.name} (${c.slug}) -- ${row.id}`);
    } catch (err) {
      console.log(`  [FAIL] ${c.name}: ${err.message}`);
    }
  }

  const count = Object.keys(creatorMap).length;
  console.log(`\n  Created/updated: ${count}/12 creators`);
  return creatorMap;
}

// ─── Step 2: Generate & Publish Apps (4 per creator) ─────────────────────────

async function generateAndPublishApps(creatorMap) {
  console.log('\n=== Step 2: Generating 48 Apps (4 per creator) ===\n');

  const results = [];
  let totalGenerated = 0;
  let totalPublished = 0;
  let totalFailed = 0;

  for (const creator of CREATORS) {
    const info = creatorMap[creator.slug];
    if (!info) {
      console.log(`  [SKIP] ${creator.slug} -- creator not found`);
      continue;
    }

    const token = await generateJWT(info.id, info.email);

    for (let i = 0; i < creator.apps.length; i++) {
      const prompt = creator.apps[i];
      const label = `[${creator.slug}] App ${i + 1}/4`;
      const appStart = Date.now();

      process.stdout.write(`  ${label}: Generating...`);

      try {
        // POST /apps/generate
        const res = await fetch(`${API}/apps/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt, niche: creator.niche }),
        });

        const data = await res.json();

        if (!data.success) {
          const errMsg = data.error?.message || JSON.stringify(data.error);
          console.log(` FAILED: ${errMsg}`);
          results.push({ creator: creator.slug, promptIndex: i, status: 'generate_failed', error: errMsg });
          totalFailed++;
          continue;
        }

        const { appId } = data.data;

        // Poll /apps/{id}/status every 5s until succeeded/failed (max 60s)
        const pollResult = await pollUntilDone(appId, token);
        const durationS = ((Date.now() - appStart) / 1000).toFixed(1);

        if (pollResult.status === 'succeeded') {
          totalGenerated++;

          // Publish via POST /apps/{id}/publish
          try {
            const pubRes = await fetch(`${API}/apps/${appId}/publish`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            const pubData = await pubRes.json();

            if (pubData.success) {
              console.log(` Done (${durationS}s) -- Published`);
              results.push({ creator: creator.slug, promptIndex: i, appId, status: 'published', durationS });
              totalPublished++;
            } else {
              console.log(` Done (${durationS}s) -- Publish failed: ${pubData.error?.message}`);
              results.push({ creator: creator.slug, promptIndex: i, appId, status: 'publish_failed', durationS, error: pubData.error?.message });
            }
          } catch (pubErr) {
            console.log(` Done (${durationS}s) -- Publish error: ${pubErr.message}`);
            results.push({ creator: creator.slug, promptIndex: i, appId, status: 'publish_error', durationS, error: pubErr.message });
          }
        } else {
          console.log(` ${pollResult.status} (${durationS}s): ${pollResult.error}`);
          results.push({ creator: creator.slug, promptIndex: i, appId, status: pollResult.status, durationS, error: pollResult.error });
          totalFailed++;
        }
      } catch (err) {
        console.log(` ERROR: ${err.message}`);
        results.push({ creator: creator.slug, promptIndex: i, status: 'error', error: err.message });
        totalFailed++;
      }

      // Wait 3s between generations to avoid rate limits
      const isLast = creator === CREATORS[CREATORS.length - 1] && i === creator.apps.length - 1;
      if (!isLast) {
        await sleep(BETWEEN_GENERATIONS_MS);
      }
    }
  }

  console.log(`\n  Generated: ${totalGenerated}/48, Published: ${totalPublished}/48, Failed: ${totalFailed}/48`);
  return results;
}

// ─── Step 3: Create 4 End Users per Storefront ──────────────────────────────

async function createEndUsers(creatorMap) {
  console.log('\n=== Step 3: Creating 48 End Users (4 per storefront) ===\n');

  const userMap = {}; // key -> { id, email, creatorSlug }
  let created = 0;

  for (const creator of CREATORS) {
    const info = creatorMap[creator.slug];
    if (!info) continue;

    const names = END_USER_NAMES[creator.slug];
    for (const firstName of names) {
      const key = `${firstName}_${creator.slug}`;
      const email = `${firstName}@test.sotally.com`;
      const id = genId();

      try {
        await sql`
          INSERT INTO users (id, email, name, password_hash, referral_code, onboarding_complete, role)
          VALUES (
            ${id},
            ${email},
            ${capitalize(firstName)},
            '$2b$10$placeholder',
            ${key + '-ref'},
            true,
            'buyer'
          )
          ON CONFLICT (email) DO NOTHING
        `;

        const [row] = await sql`SELECT id FROM users WHERE email = ${email}`;
        userMap[key] = { id: row.id, email, creatorSlug: creator.slug };
        created++;
      } catch (err) {
        console.log(`  [FAIL] ${key}: ${err.message}`);
      }
    }
  }

  console.log(`  Created/found: ${created}/48 end users`);
  return userMap;
}

// ─── Step 4: Create Follow Relationships ─────────────────────────────────────

async function createFollows(creatorMap, userMap) {
  console.log('\n=== Step 4: Creating Follow Relationships ===\n');

  let followCount = 0;

  for (const creator of CREATORS) {
    const info = creatorMap[creator.slug];
    if (!info) continue;

    const names = END_USER_NAMES[creator.slug];
    for (const firstName of names) {
      const key = `${firstName}_${creator.slug}`;
      const userInfo = userMap[key];
      if (!userInfo) continue;

      try {
        await sql`
          INSERT INTO follows (follower_id, creator_id, created_at)
          VALUES (${userInfo.id}, ${info.id}, NOW() - (random() * interval '14 days'))
          ON CONFLICT DO NOTHING
        `;
        followCount++;
      } catch (err) {
        // Silently continue -- table may not exist or different schema
      }
    }
  }

  // Update denormalized follower counts
  try {
    await sql`
      UPDATE users SET follower_count = sub.cnt
      FROM (
        SELECT creator_id, COUNT(*) AS cnt FROM follows GROUP BY creator_id
      ) sub
      WHERE users.id = sub.creator_id
    `;
  } catch {
    // Column may not exist -- non-critical
  }

  console.log(`  Created: ${followCount} follows`);
  return followCount;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  console.log('================================================');
  console.log('  Sotally V2 -- Full Demo Seed');
  console.log('================================================');
  console.log(`  API: ${API}`);
  console.log(`  DB:  postgresql://sotally:***@localhost:5432/sotally`);
  console.log(`  Time: ${new Date().toISOString()}`);

  // Verify API is reachable
  try {
    const healthRes = await fetch(`${API}/health`);
    if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
    console.log('  API: reachable');
  } catch (err) {
    console.error(`\n  ERROR: Cannot reach API at ${API} -- ${err.message}`);
    console.error('  Make sure the API server is running.\n');
    await sql.end();
    process.exit(1);
  }

  // Verify DB is reachable
  try {
    const [row] = await sql`SELECT 1 AS ok`;
    if (row.ok !== 1) throw new Error('Unexpected DB response');
    console.log('  DB:  reachable');
  } catch (err) {
    console.error(`\n  ERROR: Cannot connect to database -- ${err.message}`);
    console.error('  Make sure PostgreSQL is running.\n');
    await sql.end();
    process.exit(1);
  }

  console.log('');

  // Step 1: Create 12 creators via SQL
  const creatorMap = await createCreators();
  const creatorsCreated = Object.keys(creatorMap).length;

  // Step 2: Generate 4 apps per creator, poll, publish
  const appResults = await generateAndPublishApps(creatorMap);
  const appsPublished = appResults.filter((r) => r.status === 'published').length;
  const appsFailed = appResults.filter((r) => !['published'].includes(r.status)).length;

  // Step 3: Create 4 end-users per storefront
  const userMap = await createEndUsers(creatorMap);
  const usersCreated = Object.keys(userMap).length;

  // Step 4: End-users follow their creator
  const followCount = await createFollows(creatorMap, userMap);

  // Update app_count on creator users
  try {
    await sql`
      UPDATE users SET app_count = sub.cnt
      FROM (
        SELECT creator_id, COUNT(*) AS cnt FROM apps WHERE status = 'published' GROUP BY creator_id
      ) sub
      WHERE users.id = sub.creator_id
    `;
  } catch {
    // Column may not exist -- non-critical
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n================================================');
  console.log('  SEED COMPLETE');
  console.log('================================================');
  console.log(`  Creators:       ${creatorsCreated}/12`);
  console.log(`  Apps published: ${appsPublished}/48`);
  console.log(`  Apps failed:    ${appsFailed}/48`);
  console.log(`  End users:      ${usersCreated}/48`);
  console.log(`  Follows:        ${followCount}`);
  console.log(`  Duration:       ${elapsed}s`);
  console.log('================================================\n');

  // List failures if any
  const failures = appResults.filter((r) => r.status !== 'published');
  if (failures.length > 0) {
    console.log('  Failed apps:');
    for (const f of failures) {
      console.log(`    [${f.creator}] prompt ${f.promptIndex + 1}: ${f.status} -- ${f.error || 'unknown'}`);
    }
    console.log('');
  }

  await sql.end();
}

main().catch(async (err) => {
  console.error('\nFatal error:', err);
  try { await sql.end(); } catch {}
  process.exit(1);
});
