import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mockComplete is available during module mock hoisting
const { mockComplete } = vi.hoisted(() => {
  return { mockComplete: vi.fn() };
});

// Mock the LLM client (now provider-agnostic)
vi.mock('../../lib/llm', () => ({
  complete: mockComplete,
  getProviderInfo: () => ({ provider: 'test', model: 'test-model' }),
}));

import { parseIntent } from '../../engine/intent-parser';

function mockResponse(json: Record<string, unknown>) {
  mockComplete.mockResolvedValueOnce({
    text: JSON.stringify(json),
    inputTokens: 100,
    outputTokens: 200,
    totalTokens: 300,
    model: 'test-model',
    provider: 'test',
  });
}

function mockRawResponse(text: string) {
  mockComplete.mockResolvedValueOnce({
    text,
    inputTokens: 100,
    outputTokens: 200,
    totalTokens: 300,
    model: 'test-model',
    provider: 'test',
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
    primaryColor: '#3B82F6',
    rounded: true,
  },
  niche: 'fitness',
  template_id: null,
  confidence: 0.9,
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
    const result = await parseIntent('Build me a workout tracker');
    expect(result.title).toBe('Fitness Tracker Pro');
  });

  it('should extract description', async () => {
    mockResponse(fitnessIntent);
    const result = await parseIntent('Build me a workout tracker');
    expect(result.description).toBe('Track your daily workouts and fitness progress');
  });

  it('should extract features as an array', async () => {
    mockResponse(fitnessIntent);
    const result = await parseIntent('Build me a workout tracker');
    expect(result.features).toBeInstanceOf(Array);
    expect(result.features.length).toBeGreaterThan(0);
  });

  it('should extract data_model fields', async () => {
    mockResponse(fitnessIntent);
    const result = await parseIntent('Build me a workout tracker');
    expect(result.data_model).toBeInstanceOf(Array);
    expect(result.data_model.length).toBe(3);
    expect(result.data_model[0]).toHaveProperty('name');
    expect(result.data_model[0]).toHaveProperty('type');
  });

  it('should handle missing data_model by defaulting to empty array', async () => {
    const intentNoModel = { ...fitnessIntent, data_model: undefined };
    mockResponse(intentNoModel as any);
    const result = await parseIntent('Build me something');
    expect(result.data_model).toEqual([]);
  });

  it('should extract ui_style with defaults', async () => {
    mockResponse(fitnessIntent);
    const result = await parseIntent('Build me a workout tracker');
    expect(result.ui_style).toHaveProperty('layout');
    expect(result.ui_style).toHaveProperty('colorScheme');
    expect(result.ui_style).toHaveProperty('primaryColor');
    expect(result.ui_style).toHaveProperty('rounded');
  });

  it('should provide ui_style defaults when LLM omits them', async () => {
    const intentNoStyle = { ...fitnessIntent, ui_style: {} };
    mockResponse(intentNoStyle as any);
    const result = await parseIntent('Build me a tracker');
    expect(result.ui_style.layout).toBe('single-page');
    expect(result.ui_style.colorScheme).toBe('light');
    expect(result.ui_style.primaryColor).toBe('#3B82F6');
    expect(result.ui_style.rounded).toBe(true);
  });

  // ─── Niche handling ───────────────────────────────────────────

  it('should pass niche to the LLM call', async () => {
    mockResponse(fitnessIntent);
    await parseIntent('Build a tracker', 'fitness');
    expect(mockComplete).toHaveBeenCalledTimes(1);
    const callArgs = mockComplete.mock.calls[0][0];
    expect(callArgs.userMessage).toContain('fitness');
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
  });

  it('should clamp negative confidence to 0', async () => {
    const intentNegConf = { ...fitnessIntent, confidence: -0.5 };
    mockResponse(intentNegConf);
    const result = await parseIntent('Build a tracker');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it('should default confidence to 0.7 if not a number', async () => {
    const intentBadConf = { ...fitnessIntent, confidence: 'high' };
    mockResponse(intentBadConf as any);
    const result = await parseIntent('Build a tracker');
    expect(result.confidence).toBe(0.7);
  });

  // ─── Error handling ───────────────────────────────────────────

  it('should fall back app_type to "form" for invalid types', async () => {
    const intentBadType = { ...fitnessIntent, app_type: 'invalid_type' };
    mockResponse(intentBadType as any);
    const result = await parseIntent('Build something weird');
    expect(result.app_type).toBe('form');
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });

  it('should throw on invalid JSON response', async () => {
    mockRawResponse('This is not JSON at all');
    await expect(parseIntent('Build a tracker')).rejects.toThrow('Intent parsing failed');
  });

  it('should handle JSON wrapped in markdown code fences', async () => {
    mockRawResponse('```json\n' + JSON.stringify(fitnessIntent) + '\n```');
    const result = await parseIntent('Build a tracker');
    expect(result.app_type).toBe('tracker');
  });

  it('should throw when features are empty', async () => {
    const intentNoFeatures = { ...fitnessIntent, features: [] };
    mockResponse(intentNoFeatures);
    await expect(parseIntent('Build something')).rejects.toThrow('no features');
  });

  it('should handle API errors gracefully', async () => {
    mockComplete.mockRejectedValueOnce(new Error('API rate limit exceeded'));
    await expect(parseIntent('Build a tracker')).rejects.toThrow('API rate limit exceeded');
  });
});
