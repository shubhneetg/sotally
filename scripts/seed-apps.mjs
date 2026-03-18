import { SignJWT } from 'jose';

const API = 'http://localhost:4000';
const USER_ID = 'e585efc4-4564-4c50-8bdf-b28e5a11fc85';
const SECRET = 'sotally-dev-secret-change-in-production-32chars';
const DELAY_MS = 40_000;

const prompts = [
  { niche: 'wellness', prompt: 'Build a daily gratitude journal where users write 3 things they are grateful for each day with weekly theme summaries' },
  { niche: 'fitness', prompt: 'Build a workout timer for HIIT training with customizable intervals rest periods and round counter' },
  { niche: 'finance', prompt: 'Build a compound interest calculator that shows growth over time as a chart with inputs for principal rate and monthly contributions' },
  { niche: 'astrology', prompt: 'Build a numerology life path calculator that takes a birth date and shows the life path number with personality description' },
  { niche: 'education', prompt: 'Build a flashcard study app with spaced repetition where users create decks and flip cards marking known vs unknown' },
  { niche: 'nutrition', prompt: 'Build a water intake tracker where users log glasses of water and see a fill animation with daily target based on body weight' },
  { niche: 'parenting', prompt: 'Build a chore chart for kids where parents assign tasks and kids check them off with a weekly star summary' },
  { niche: 'business', prompt: 'Build a freelancer pricing calculator that takes desired income expenses and billable hours to show minimum hourly rate' },
  { niche: 'real-estate', prompt: 'Build a mortgage calculator with monthly PITI breakdown and 15 vs 30 year comparison' },
  { niche: 'content', prompt: 'Build a YouTube thumbnail A/B tester where users upload two images and visitors vote on which they would click' },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Generate JWT
  const secret = new TextEncoder().encode(SECRET);
  const token = await new SignJWT({ sub: USER_ID, email: 'test@sotally.com', role: 'creator' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  console.log('JWT generated successfully');

  const results = [];

  for (let i = 0; i < prompts.length; i++) {
    const { niche, prompt } = prompts[i];
    console.log(`\n[${ i + 1}/10] Generating: ${niche} — ${prompt.slice(0, 60)}...`);

    try {
      const res = await fetch(`${API}/apps/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, niche }),
      });

      const data = await res.json();

      if (!data.success) {
        console.log(`  FAILED to generate: ${JSON.stringify(data.error)}`);
        results.push({ niche, status: 'generate_failed', error: data.error });
        continue;
      }

      const { appId, generationId } = data.data;
      console.log(`  Queued: appId=${appId}, generationId=${generationId}`);
      results.push({ niche, appId, generationId, status: 'queued' });

      if (i < prompts.length - 1) {
        console.log(`  Waiting ${DELAY_MS / 1000}s for generation to complete...`);
        await sleep(DELAY_MS);
      }
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
      results.push({ niche, status: 'error', error: err.message });
    }
  }

  // Wait for the last one to finish
  console.log(`\nWaiting ${DELAY_MS / 1000}s for last generation to complete...`);
  await sleep(DELAY_MS);

  // Now publish each app
  console.log('\n=== Publishing Apps ===\n');

  for (const result of results) {
    if (!result.appId) {
      console.log(`[${result.niche}] Skipping — no appId`);
      continue;
    }

    // Check status first
    try {
      const statusRes = await fetch(`${API}/apps/${result.appId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const statusData = await statusRes.json();
      const appStatus = statusData.data?.status;
      console.log(`[${result.niche}] App status: ${appStatus}`);

      if (appStatus !== 'draft') {
        console.log(`  Skipping publish — status is ${appStatus}, not draft`);
        result.status = appStatus === 'published' ? 'published' : `skip_${appStatus}`;
        continue;
      }

      const pubRes = await fetch(`${API}/apps/${result.appId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const pubData = await pubRes.json();

      if (pubData.success) {
        console.log(`  Published successfully!`);
        result.status = 'published';
      } else {
        console.log(`  Publish failed: ${JSON.stringify(pubData.error)}`);
        result.status = 'publish_failed';
        result.publishError = pubData.error;
      }
    } catch (err) {
      console.log(`  Publish error: ${err.message}`);
      result.status = 'publish_error';
    }
  }

  // Summary
  console.log('\n=== Summary ===\n');
  for (const r of results) {
    console.log(`${r.status === 'published' ? '✅' : '❌'} [${r.niche}] ${r.status} ${r.appId ? `(${r.appId})` : ''}`);
  }

  const published = results.filter(r => r.status === 'published').length;
  const failed = results.length - published;
  console.log(`\n${published} published, ${failed} failed/pending`);
}

main().catch(console.error);
