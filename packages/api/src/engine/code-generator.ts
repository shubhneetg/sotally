import Anthropic from '@anthropic-ai/sdk';
import { env } from '../lib/env';
import type { AppIntent, GenerationResult } from './types';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const GENERATION_SYSTEM_PROMPT = `You are an expert React developer building self-contained single-file web apps for Sotally.

You will receive a structured app intent (type, features, data model, UI style) and you must generate a COMPLETE, working React component.

## Technical Constraints

1. **Single file**: Output ONLY the contents of App.tsx. No imports from external packages — everything is one file.
2. **React 18**: Use functional components, useState, useEffect, useCallback, useMemo. React is available globally (no import needed — it's loaded via UMD).
3. **Tailwind CSS**: Use Tailwind utility classes for ALL styling. Tailwind is loaded via CDN. Do NOT use inline styles or CSS-in-JS.
4. **localStorage**: Persist user data using localStorage. Use a unique key based on the app concept (e.g., "sotally_expense_tracker_data").
5. **No external dependencies**: No fetch(), no API calls, no external URLs, no images from the internet. Everything runs client-side.
6. **No TypeScript**: Write plain JSX (the file runs through Babel standalone). Do NOT use TypeScript syntax (no type annotations, no interfaces, no 'as' casts).
7. **Default export**: The file MUST end with a default export: \`export default App;\` where App is the main component.

## Code Quality Requirements

- Clean, readable code with meaningful variable names
- Proper error boundaries (wrap risky operations in try/catch)
- Responsive design (mobile-first, works on all screen sizes)
- Accessible: use semantic HTML, aria-labels on interactive elements, proper heading hierarchy
- Smooth UX: loading states, empty states, confirmation for destructive actions
- Use the primary color from the UI style spec for accents

## Data Persistence Pattern

Use this pattern for localStorage persistence:
\`\`\`
const STORAGE_KEY = 'sotally_[app_name]_data';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}
\`\`\`

## Component Structure

For each app type, follow these structural patterns:

**tracker**: List of entries + add form + summary stats + optional chart (use CSS/divs for simple bar charts)
**calculator**: Input form + calculate button + results display + optional history
**quiz**: Question display + answer selection + progress bar + results screen
**generator**: Configuration inputs + generate button + output display + copy/save
**planner**: Item list + add/edit + drag-to-reorder (simple up/down buttons) + filters
**diary**: Entry list + rich text area + date picker + search/filter
**dashboard**: Grid of stat cards + simple charts (CSS bar/progress) + filters
**form**: Multi-field form + validation + submission summary

## Output Format

Respond with ONLY the JavaScript/JSX code. No markdown fences, no explanations, no comments outside the code. The response should start with a comment like \`// App: [Title]\` and end with \`export default App;\`.

The code must be immediately executable when placed inside a <script type="text/babel"> tag with React and ReactDOM globals available.`;

const ITERATION_SYSTEM_PROMPT = `You are an expert React developer iterating on an existing Sotally app.

You will receive:
1. The current source code of the app (App.tsx)
2. A user's request describing what to change

Your job: modify the existing code to fulfill the request while preserving everything else.

## Rules

1. Keep all existing functionality unless explicitly asked to remove it
2. Maintain the same code style and patterns as the existing code
3. Keep localStorage keys unchanged to preserve user data
4. Return the COMPLETE updated file — not a diff or partial code
5. Follow all the same constraints as initial generation:
   - Single file, no external dependencies
   - React 18 functional components with hooks
   - Tailwind CSS for styling
   - No TypeScript syntax
   - Must end with \`export default App;\`
6. If the request is unclear, make the most reasonable interpretation
7. No markdown fences, no explanations — just the code

Respond with ONLY the complete updated source code.`;

export async function generateApp(intent: AppIntent): Promise<GenerationResult> {
  const userPrompt = buildGenerationPrompt(intent);

  try {
    const response = await client.messages.create({
      model: env.GENERATION_MODEL,
      max_tokens: 8192,
      temperature: 0.4,
      system: GENERATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const code = cleanCodeOutput(text);

    if (!code || code.length < 100) {
      return {
        success: false,
        files: {},
        errors: ['Generated code is too short or empty'],
        tokenUsage: extractTokenUsage(response),
      };
    }

    return {
      success: true,
      files: { 'App.tsx': code },
      tokenUsage: extractTokenUsage(response),
    };
  } catch (err: any) {
    return {
      success: false,
      files: {},
      errors: [`Code generation failed: ${err.message}`],
    };
  }
}

export async function iterateApp(
  source: Record<string, string>,
  prompt: string,
): Promise<GenerationResult> {
  const currentCode = source['App.tsx'];
  if (!currentCode) {
    return {
      success: false,
      files: {},
      errors: ['No existing App.tsx source found to iterate on'],
    };
  }

  const userPrompt = `## Current App.tsx Source Code

\`\`\`
${currentCode}
\`\`\`

## Requested Changes

${prompt}

## Instructions

Apply the requested changes and return the complete updated App.tsx file.`;

  try {
    const response = await client.messages.create({
      model: env.GENERATION_MODEL,
      max_tokens: 8192,
      temperature: 0.3,
      system: ITERATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const code = cleanCodeOutput(text);

    if (!code || code.length < 100) {
      return {
        success: false,
        files: {},
        errors: ['Iterated code is too short or empty'],
        tokenUsage: extractTokenUsage(response),
      };
    }

    return {
      success: true,
      files: { 'App.tsx': code },
      tokenUsage: extractTokenUsage(response),
    };
  } catch (err: any) {
    return {
      success: false,
      files: {},
      errors: [`Code iteration failed: ${err.message}`],
    };
  }
}

// ─── Helpers ────────────────────────────────────────────────

function buildGenerationPrompt(intent: AppIntent): string {
  const dataModelStr = intent.data_model.length > 0
    ? intent.data_model
        .map((f) => `  - ${f.name} (${f.type}${f.required ? ', required' : ''}): ${f.description}`)
        .join('\n')
    : '  (no specific data model — use reasonable defaults)';

  return `## App Intent

**Type**: ${intent.app_type}
**Title**: ${intent.title}
**Description**: ${intent.description}
${intent.niche ? `**Niche**: ${intent.niche}` : ''}

## Features to Implement

${intent.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Data Model (fields per entry)

${dataModelStr}

## UI Style

- Layout: ${intent.ui_style.layout}
- Color scheme: ${intent.ui_style.colorScheme}
- Primary color: ${intent.ui_style.primaryColor}
- Rounded corners: ${intent.ui_style.rounded ? 'yes' : 'no'}

## Generate the App

Build a complete, polished, production-ready React app that implements ALL the features above. Make it feel like a real product — not a demo.`;
}

function cleanCodeOutput(raw: string): string {
  let code = raw.trim();

  // Remove markdown code fences if present
  code = code.replace(/^```(?:jsx?|tsx?|javascript)?\s*\n?/m, '');
  code = code.replace(/\n?```\s*$/m, '');

  return code.trim();
}

function extractTokenUsage(response: Anthropic.Message) {
  return {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
  };
}
