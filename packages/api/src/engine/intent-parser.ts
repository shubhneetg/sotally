import { complete } from '../lib/llm';
import type { AppIntent, AppType } from './types';
import { APP_TYPES } from './types';

const INTENT_SYSTEM_PROMPT = `You are an expert app architect for Sotally, a platform where creators build mini web apps.

Your job: analyze a user's plain-English description of an app they want to build and extract a structured intent object.

You MUST respond with a single JSON object (no markdown, no explanation, no code fences). The JSON must conform exactly to this schema:

{
  "app_type": one of: "tracker", "calculator", "quiz", "generator", "planner", "diary", "dashboard", "form",
  "title": short catchy name for the app (2-5 words, title case),
  "description": one-sentence description of what the app does (under 120 chars),
  "features": array of 3-6 specific features the app should have (each a short imperative phrase),
  "data_model": array of fields the app needs to store, each with:
    { "name": string, "type": "string"|"number"|"boolean"|"date"|"array"|"object", "required": boolean, "description": string },
  "ui_style": {
    "layout": "single-page" | "tabbed" | "wizard" | "dashboard",
    "colorScheme": "light" | "dark" | "auto",
    "primaryColor": a hex color that fits the app's theme (e.g. "#3B82F6"),
    "rounded": true or false
  },
  "niche": the target niche/audience (e.g. "fitness", "finance", "education") or null if generic,
  "template_id": null (reserved for future template matching),
  "confidence": a number from 0.0 to 1.0 indicating how well you understood the request
}

Guidelines for each app_type:
- "tracker": anything that tracks data over time (habits, expenses, moods, workouts)
- "calculator": computes results from inputs (BMI, ROI, loan, calorie)
- "quiz": question-and-answer flows with scoring or results
- "generator": creates output from rules/randomness (name generators, password generators, color palettes)
- "planner": scheduling, to-do lists, goal planning, meal planning
- "diary": journaling, logging, personal records
- "dashboard": displays metrics, stats, summaries — primarily read-focused
- "form": collects user input, surveys, sign-up forms

Pick the BEST fitting app_type. If the prompt is ambiguous, pick the most likely type and set confidence lower.

For the data_model, think about what data the user's app needs to persist in localStorage. Include 3-8 fields that would represent one "entry" or "record" in the app.

For features, think about what specific interactive capabilities the app needs. Be concrete: "Add new expense with category and amount" not "manage expenses".

Keep the title creative but clear. The description should immediately tell a user what the app does.`;

export async function parseIntent(prompt: string, niche?: string): Promise<AppIntent> {
  const userMessage = niche
    ? `Niche/audience: ${niche}\n\nApp idea: ${prompt}`
    : prompt;

  const response = await complete({
    system: INTENT_SYSTEM_PROMPT,
    userMessage,
    maxTokens: 1024,
    temperature: 0.3,
  });

  let parsed: any;
  try {
    // Strip potential markdown fences if LLM adds them despite instructions
    const cleaned = response.text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Intent parsing failed: LLM returned invalid JSON. Raw: ${response.text.slice(0, 200)}`);
  }

  // Validate app_type
  if (!APP_TYPES.includes(parsed.app_type)) {
    parsed.app_type = 'form'; // safe fallback
    parsed.confidence = Math.min(parsed.confidence ?? 0.5, 0.5);
  }

  // Validate features is an array
  if (!Array.isArray(parsed.features) || parsed.features.length === 0) {
    throw new Error('Intent parsing failed: no features extracted from prompt');
  }

  // Validate data_model
  if (!Array.isArray(parsed.data_model)) {
    parsed.data_model = [];
  }

  // Ensure ui_style has required fields
  parsed.ui_style = {
    layout: parsed.ui_style?.layout || 'single-page',
    colorScheme: parsed.ui_style?.colorScheme || 'light',
    primaryColor: parsed.ui_style?.primaryColor || '#3B82F6',
    rounded: parsed.ui_style?.rounded ?? true,
  };

  // Override niche if provided
  if (niche) {
    parsed.niche = niche;
  }

  // Ensure confidence is a number
  parsed.confidence = typeof parsed.confidence === 'number'
    ? Math.max(0, Math.min(1, parsed.confidence))
    : 0.7;

  return parsed as AppIntent;
}
