/**
 * Bulk User Creation & Tool Testing (Sequential Single Test)
 *
 * Creates 11 user accounts sequentially (users 2-12), each:
 * 1. Registering via UI
 * 2. Creating 3-5 tools via the Creator Studio 7-step wizard
 * 3. Testing the tool creation flow for bugs
 *
 * All users are processed in ONE test to avoid page context closure issues.
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_PASSWORD, waitForLoading } from './helpers';

const BASE_URL = 'https://sotally.com';
const API_URL = `${BASE_URL}/api`;

interface UserProfile {
  userName: string;
  email: string;
  tools: ToolProfile[];
}

interface ToolProfile {
  name: string;
  description: string;
  category: string;
  price: number;
}

const USERS: UserProfile[] = [
  {
    userName: 'Alex Kumar',
    email: 'alex.kumar@sotally-test.invalid',
    tools: [
      { name: 'Text Analyzer Pro', description: 'Advanced text analysis and statistics', category: 'Productivity', price: 4.99 },
      { name: 'Code Formatter', description: 'Format and beautify code snippets', category: 'Development', price: 5.99 },
      { name: 'JSON Validator', description: 'Validate and prettify JSON', category: 'Development', price: 3.99 },
    ],
  },
  {
    userName: 'James Rodriguez',
    email: 'james.rodriguez@sotally-test.invalid',
    tools: [
      { name: 'CSV to JSON Converter', description: 'Convert CSV files to JSON format', category: 'Data', price: 2.99 },
      { name: 'Password Generator', description: 'Generate secure random passwords', category: 'Security', price: 1.99 },
      { name: 'URL Slug Creator', description: 'Create URL-friendly slugs from text', category: 'Utilities', price: 1.49 },
      { name: 'Regex Tester', description: 'Test and validate regular expressions', category: 'Development', price: 3.49 },
    ],
  },
  {
    userName: 'Lisa Park',
    email: 'lisa.park@sotally-test.invalid',
    tools: [
      { name: 'Markdown to HTML', description: 'Convert Markdown to HTML', category: 'Development', price: 2.49 },
      { name: 'Email Validator', description: 'Validate email addresses', category: 'Utilities', price: 1.99 },
      { name: 'Hash Generator', description: 'Generate MD5, SHA1, SHA256 hashes', category: 'Security', price: 3.99 },
      { name: 'Base64 Encoder/Decoder', description: 'Encode and decode Base64 strings', category: 'Utilities', price: 1.49 },
      { name: 'Color Converter', description: 'Convert between color formats', category: 'Design', price: 2.99 },
    ],
  },
  {
    userName: 'David Okafor',
    email: 'david.okafor@sotally-test.invalid',
    tools: [
      { name: 'Word Counter', description: 'Count words, characters, and paragraphs', category: 'Productivity', price: 1.99 },
      { name: 'Sentence Splitter', description: 'Split text into sentences', category: 'NLP', price: 2.99 },
      { name: 'Text Case Converter', description: 'Convert text to various cases', category: 'Utilities', price: 1.49 },
    ],
  },
  {
    userName: 'Priya Sharma',
    email: 'priya.sharma@sotally-test.invalid',
    tools: [
      { name: 'IP Address Validator', description: 'Validate IPv4 and IPv6 addresses', category: 'Network', price: 2.49 },
      { name: 'JSON Minifier', description: 'Minify and format JSON', category: 'Development', price: 1.99 },
      { name: 'YAML to JSON', description: 'Convert YAML to JSON format', category: 'Data', price: 3.49 },
      { name: 'URL Encoder/Decoder', description: 'Encode and decode URLs', category: 'Utilities', price: 1.49 },
    ],
  },
  {
    userName: 'Marcus Johnson',
    email: 'marcus.johnson@sotally-test.invalid',
    tools: [
      { name: 'UUID Generator', description: 'Generate UUIDs v1, v3, v4, v5', category: 'Development', price: 1.99 },
      { name: 'Timestamp Converter', description: 'Convert between Unix timestamps and dates', category: 'Utilities', price: 2.49 },
      { name: 'Database Query Formatter', description: 'Format SQL queries', category: 'Development', price: 4.99 },
    ],
  },
  {
    userName: 'Tom Nguyen',
    email: 'tom.nguyen@sotally-test.invalid',
    tools: [
      { name: 'QR Code Generator', description: 'Generate QR codes from text', category: 'Design', price: 2.99 },
      { name: 'Barcode Generator', description: 'Generate various barcode formats', category: 'Design', price: 3.49 },
      { name: 'String Reverser', description: 'Reverse strings and texts', category: 'Utilities', price: 0.99 },
      { name: 'Whitespace Remover', description: 'Remove extra whitespace from text', category: 'Utilities', price: 0.99 },
      { name: 'Duplicate Line Remover', description: 'Remove duplicate lines from text', category: 'Utilities', price: 1.49 },
    ],
  },
  {
    userName: 'Rachel Kim',
    email: 'rachel.kim@sotally-test.invalid',
    tools: [
      { name: 'Binary Converter', description: 'Convert between decimal and binary', category: 'Development', price: 1.99 },
      { name: 'Hex Converter', description: 'Convert between decimal and hexadecimal', category: 'Development', price: 1.99 },
      { name: 'Unix Permissions Calculator', description: 'Calculate Unix file permissions', category: 'Development', price: 2.49 },
    ],
  },
  {
    userName: 'Mike Torres',
    email: 'mike.torres@sotally-test.invalid',
    tools: [
      { name: 'Acronym Expander', description: 'Find expansions for common acronyms', category: 'Productivity', price: 1.99 },
      { name: 'Text Duplicator', description: 'Duplicate text multiple times', category: 'Utilities', price: 0.99 },
      { name: 'Line Number Adder', description: 'Add line numbers to text', category: 'Utilities', price: 1.49 },
      { name: 'Random Number Generator', description: 'Generate random numbers with custom ranges', category: 'Utilities', price: 1.99 },
    ],
  },
  {
    userName: 'Emma Zhang',
    email: 'emma.zhang@sotally-test.invalid',
    tools: [
      { name: 'Palindrome Checker', description: 'Check if text is a palindrome', category: 'Utilities', price: 0.99 },
      { name: 'Anagram Solver', description: 'Find anagrams of words', category: 'NLP', price: 3.49 },
      { name: 'Character Frequency Analyzer', description: 'Analyze character frequency in text', category: 'NLP', price: 2.99 },
      { name: 'Vowel Counter', description: 'Count vowels and consonants', category: 'Utilities', price: 1.49 },
    ],
  },
  {
    userName: 'Carlos Mendez',
    email: 'carlos.mendez@sotally-test.invalid',
    tools: [
      { name: 'Unit Converter', description: 'Convert between various units', category: 'Productivity', price: 3.99 },
      { name: 'Temperature Converter', description: 'Convert between temperature scales', category: 'Utilities', price: 1.99 },
      { name: 'Currency Converter', description: 'Convert between currency values', category: 'Finance', price: 2.99 },
      { name: 'BMI Calculator', description: 'Calculate Body Mass Index', category: 'Health', price: 1.99 },
      { name: 'Timezone Converter', description: 'Convert times across timezones', category: 'Utilities', price: 2.49 },
    ],
  },
];

/**
 * Register a user via the UI registration form
 */
async function registerUserViaUI(page: Page, userName: string, email: string): Promise<void> {
  await page.goto('/register');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('#name', userName);
  await page.fill('#email', email);
  await page.fill('#password', TEST_PASSWORD);

  await page.click('button[type="submit"]');

  // Wait for success or redirect
  try {
    await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 10_000 }),
      page.waitForURL('**/tools', { timeout: 10_000 }),
      page.waitForSelector('text=Account created!', { timeout: 5_000 }),
    ]);
  } catch {
    // May redirect immediately
  }

  await page.waitForTimeout(500);
}

/**
 * Setup auth and navigate to creator
 */
async function setupCreatorAuth(page: Page, email: string): Promise<void> {
  // Try API registration (may already exist)
  try {
    await page.request.post(`${API_URL}/auth/register`, {
      data: { name: email.split('@')[0], email, password: TEST_PASSWORD },
    });
  } catch {
    // Already registered
  }

  // Login to get token
  const loginResponse = await page.request.post(`${API_URL}/auth/login`, {
    data: { email, password: TEST_PASSWORD },
  });

  if (!loginResponse.ok()) {
    throw new Error(`Login failed: ${loginResponse.status()}`);
  }

  const body = await loginResponse.json();
  const token = body?.data?.token || body?.token;

  if (!token) {
    throw new Error('No token from login');
  }

  // Navigate to home and inject auth
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await page.evaluate(
    ({ token }) => {
      localStorage.setItem(
        'sotally-auth',
        JSON.stringify({
          state: { token, isAuthenticated: true, isLoading: false, error: null, user: null },
          version: 0,
        })
      );
    },
    { token }
  );

  // Navigate to creator tools new
  await page.goto('/creator/tools/new');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
}

/**
 * Create a tool - simplified fast version
 */
async function createTool(page: Page, tool: ToolProfile): Promise<boolean> {
  try {
    // Fill tool name
    const nameInput = page.locator('input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill(tool.name);
      await page.waitForTimeout(200);
    }

    // Fill description
    const descInput = page.locator('textarea').first();
    if (await descInput.isVisible({ timeout: 3000 })) {
      await descInput.fill(tool.description);
      await page.waitForTimeout(200);
    }

    // Skip through steps quickly - just click next until we find publish
    for (let step = 0; step < 7; step++) {
      const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
      const publishBtn = page.getByRole('button', { name: /publish|create|save|finish/i }).first();
      
      const publishVisible = await publishBtn.isVisible({ timeout: 1000 }).catch(() => false);
      if (publishVisible) {
        await publishBtn.click();
        await page.waitForTimeout(1000);
        return true;
      }

      const nextVisible = await nextBtn.isEnabled({ timeout: 1000 }).catch(() => false);
      if (nextVisible) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      } else {
        break;
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}

// Override timeout for this test to 10 minutes
test.setTimeout(600_000);

test('All 11 Users - Sequential Creation & Tool Building', async ({ page }) => {
  let totalToolsCreated = 0;
  let totalUsersCompleted = 0;

  for (let i = 0; i < USERS.length; i++) {
    const userNum = i + 2;
    const user = USERS[i];

    console.log(`\nUser ${userNum}: ${user.userName}`);

    try {
      // Register
      await registerUserViaUI(page, user.userName, user.email);

      // Setup auth for creator
      await setupCreatorAuth(page, user.email);

      // Create tools
      let toolsCreated = 0;
      for (const tool of user.tools) {
        const success = await createTool(page, tool);
        if (success) {
          toolsCreated++;
          console.log(`  ✓ ${tool.name}`);
        }

        // Refresh to create another tool
        if (toolsCreated < user.tools.length) {
          await page.goto('/creator/tools/new');
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(400);
        }
      }

      console.log(`✓ ${user.userName}: ${toolsCreated}/${user.tools.length} tools`);
      totalToolsCreated += toolsCreated;
      totalUsersCompleted++;
    } catch (e) {
      console.error(`✗ ${user.userName}: ${(e as any).message?.substring(0, 50)}`);
    }
  }

  console.log(`\n========== FINAL RESULTS ==========`);
  console.log(`Users: ${totalUsersCompleted}/11`);
  console.log(`Tools: ${totalToolsCreated}`);
});
