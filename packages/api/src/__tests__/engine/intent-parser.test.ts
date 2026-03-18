import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mockCreate is available during module mock hoisting
const { mockCreate } = vi.hoisted(() => {
  return { mockCreate: vi.fn() };
});

// Mock the Anthropic SDK before importing the module under test
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
    constructor(_opts: any) {}
  },
}));

// Mock env to avoid requiring real environment variables
vi.mock('../../lib/env', () => ({
  env: {
    ANTHROPIC_API_KEY: 'test-key',
    GENERATION_MODEL: 'claude-test',
  },
}));

import { parseIntent } from '../../engine/intent-parser';

function mockResponse(json: Record<string, unknown>) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text: JSON.stringify(json) }],
  });
}

function mockRawResponse(text: string) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text }],
  });
}

const fitnessIntent = {
  app_type: 'tracker',
  title: 'Fitness Tracker Pro',
  description: 'Track your daily workouts and fitness progress',
  features: [
    'Log daily workouts with exercise type and duration',
    'View workout history in a calendar view',
    'Track personal records and milestones',
    'Visualize progress with charts',
  ],
  data_model: [
    { name: 'exercise', type: 'string', required: true, description: 'Type of exercise' },
    { name: 'duration', type: 'number', required: true, description: 'Duration in minutes' },
    { name: 'date', type: 'date', required: true, description: 'Workout date' },
  ],
  ui_style: {
    layout: 'tabbed',
    colorScheme: 'light',
    primaryColor: '#10B981',
    rounded: true,
  },
  niche: 'fitness',
  template_id: null,
  confidence: 0.92,
};

const expenseIntent = {
  app_type: 'tracker',
  title: 'Expense Tracker',
  description: 'Track daily expenses and see spending breakdown',
  features: [
    'Add new expense with category and amount',
    'View monthly spending breakdown',
    'Set budget limits per category',
  ],
  data_model: [
    { name: 'amount', type: 'number', required: true, description: 'Expense amount' },
    { name: 'category', type: 'string', required: true, description: 'Expense category' },
  ],
  ui_style: {
    layout: 'single-page',
    colorScheme: 'light',
    primaryColor: '#3B82F6',
    rounded: true,
  },
  niche: 'finance',
  template_id: null,
  confidence: 0.88,
};

describe('parseIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Basic extraction ─────────────────────────────────────────

  it('should extract app type from a fitness prompt', async () => {
    mockResponse(fitnessIntent);
    const result = await parseIntent('Build me a workout tracker app');
    expect(result.app_type).toBe('tracker');
  });

  it('should extract title from the response', async () => {
    mockResponse(fitnessIntent);
    const result = await parseIntent('Build me a workout tracker app');
    expect(result.title).toBe('Fitness Tracker Pro');
  });

  it('should extract description from the response', async () => {
    mockResponse(fitnessIntent);
    const result = await parseIntent('Build me a workout tracker app');
    expect(result.description).toBe('Track your daily workouts and fitness progress');
  });

  // ─── Features ─────────────────────────────────────────────────

  it('should identify features from a tracker prompt', async () => {
    mockResponse(expenseIntent);
    const result = await parseIntent('I want an expense tracker that categorizes my spending');
    expect(result.features).toBeInstanceOf(Array);
    expect(result.features.length).toBeGreaterThanOrEqual(3);
    expect(result.features[0]).toContain('expense');
  });

  it('should preserve all features from the response', async () => {
    mockResponse(fitnessIntent);
    const result = await parseIntent('Build me a workout tracker');
    expect(result.features).toHaveLength(4);
  });

  // ─── Data model ───────────────────────────────────────────────

  it('should include data_model fields', async () => {
    mockResponse(fitnessIntent);
    const result = await parseIntent('Build me a workout tracker');
    expect(result.data_model).toBeInstanceOf(Array);
    expect(result.data_model.length).toBeGreaterThan(0);
    expect(result.data_model[0]).toHaveProperty('name');
    expect(result.data_model[0]).toHaveProperty('type');
  });

  it('should default data_model to empty array if missing', async () => {
    const intentNoModel = { ...fitnessIntent, data_model: undefined };
    mockResponse(intentNoModel as any);
    const result = await parseIntent('Build me a workout tracker');
    expect(result.data_model).toEqual([]);
  });

  // ─── UI style ─────────────────────────────────────────────────

  it('should include ui_style with required fields', async () => {
    mockResponse(fitnessIntent);
    const result = await parseIntent('Build me a workout tracker');
    expect(result.ui_style).toHaveProperty('layout');
    expect(result.ui_style).toHaveProperty('colorScheme');
    expect(result.ui_style).toHaveProperty('primaryColor');
    expect(result.ui_style).toHaveProperty('rounded');
  });

  it('should default ui_style fields when missing', async () => {
    const intentNoStyle = { ...fitnessIntent, ui_style: undefined };
    mockResponse(intentNoStyle as any);
    const result = await parseIntent('Build me a workout tracker');
    expect(result.ui_style.layout).toBe('single-page');
    expect(result.ui_style.colorScheme).toBe('light');
    expect(result.ui_style.primaryColor).toBe('#3B82F6');
    expect(result.ui_style.rounded).toBe(true);
  });

  // ─── Niche handling ───────────────────────────────────────────

  it('should pass niche to the API call', async () => {
    mockResponse(fitnessIntent);
    await parseIntent('Build a tracker', 'fitness');
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain('fitness');
  });

  it('should override niche from LLM response with provided niche', async () => {
    const intentWithDifferentNiche = { ...fitnessIntent, niche: 'health' };
    mockResponse(intentWithDifferentNiche);
    const result = await parseIntent('Build a tracker', 'fitness');
    expect(result.niche).toBe('fitness');
  });

  // ─── Confidence ───────────────────────────────────────────────

  it('should clamp confidence between 0 and 1', async () => {
    const intentHighConf = { ...fitnessIntent, confidence: 1.5 };
    mockResponse(intentHighConf);
    const result = await parseIntent('Build a tracker');
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should default confidence to 0.7 if not a number', async () => {
    const intentBadConf = { ...fitnessIntent, confidence: 'high' };
    mockResponse(intentBadConf as any);
    const result = await parseIntent('Build a tracker');
    expect(result.confidence).toBe(0.7);
  });

  // ─── Invalid app_type fallback ────────────────────────────────

  it('should fallback to form for unknown app_type', async () => {
    const intentBadType = { ...fitnessIntent, app_type: 'unknown_type' };
    mockResponse(intentBadType as any);
    const result = await parseIntent('Build something weird');
    expect(result.app_type).toBe('form');
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });

  // ─── Error handling ───────────────────────────────────────────

  it('should throw on invalid JSON response', async () => {
    mockRawResponse('This is not JSON at all');
    await expect(parseIntent('Build a tracker')).rejects.toThrow('Intent parsing failed');
  });

  it('should handle JSON wrapped in markdown code fences', async () => {
    const json = JSON.stringify(fitnessIntent);
    mockRawResponse('```json\n' + json + '\n```');
    const result = await parseIntent('Build a workout tracker');
    expect(result.app_type).toBe('tracker');
    expect(result.title).toBe('Fitness Tracker Pro');
  });

  it('should throw when features array is empty', async () => {
    const intentNoFeatures = { ...fitnessIntent, features: [] };
    mockResponse(intentNoFeatures);
    await expect(parseIntent('Build a tracker')).rejects.toThrow('no features extracted');
  });

  it('should throw when features is not an array', async () => {
    const intentBadFeatures = { ...fitnessIntent, features: 'not an array' };
    mockResponse(intentBadFeatures as any);
    await expect(parseIntent('Build a tracker')).rejects.toThrow('no features extracted');
  });

  it('should handle API errors gracefully', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'));
    await expect(parseIntent('Build a tracker')).rejects.toThrow('API rate limit exceeded');
  });
});
