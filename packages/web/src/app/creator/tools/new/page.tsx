'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface InputField {
  id: string;
  label: string;
  key: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean';
  required: boolean;
  placeholder: string;
  helpText: string;
  options: string[]; // for select type
}

interface PricingTier {
  id: string;
  name: string;
  credits: number;
  description: string;
}

interface FormData {
  // Step 1: Basics
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  tags: string;
  // Step 2: Builder type
  builderType: 'template' | 'scratch';
  templateId: string;
  // Step 3: Input fields
  inputFields: InputField[];
  // Step 4: AI Logic
  systemPrompt: string;
  userPromptTemplate: string;
  model: 'gpt-4o-mini' | 'gpt-4o';
  temperature: number;
  maxTokens: number;
  // Step 5: Pricing
  pricingModel: 'per_run' | 'tiered' | 'free';
  creditsPerRun: number;
  pricingTiers: PricingTier[];
}

const STEPS = [
  { number: 1, title: 'Basics' },
  { number: 2, title: 'Builder Type' },
  { number: 3, title: 'Input Fields' },
  { number: 4, title: 'AI Logic' },
  { number: 5, title: 'Pricing' },
  { number: 6, title: 'Preview & Test' },
  { number: 7, title: 'Publish' },
];

const CATEGORIES = [
  { id: '', label: 'Select a category...' },
  { id: 'writing', label: 'Writing' },
  { id: 'design', label: 'Design' },
  { id: 'development', label: 'Development' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'data', label: 'Data' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'education', label: 'Education' },
  { id: 'business', label: 'Business' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'boolean', label: 'Toggle' },
] as const;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function generateKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Step Components ────────────────────────────────────────────────────────

function StepBasics({
  form,
  onChange,
}: {
  form: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Tool Name <span className="text-destructive">*</span>
        </label>
        <Input
          value={form.name}
          onChange={(e) => {
            const name = e.target.value;
            onChange({ name, slug: form.slug || generateSlug(name) });
          }}
          placeholder="e.g. Blog Post Generator"
          maxLength={80}
        />
        <p className="mt-1 text-xs text-muted-foreground">{form.name.length}/80 characters</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Slug</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">sotally.com/tools/</span>
          <Input
            value={form.slug}
            onChange={(e) => onChange({ slug: e.target.value })}
            placeholder="blog-post-generator"
            maxLength={80}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">URL-friendly identifier for your tool</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Short Description <span className="text-destructive">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Briefly describe what your tool does..."
          maxLength={500}
          rows={3}
          className="flex w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        <p className="mt-1 text-xs text-muted-foreground">{form.description.length}/500 characters</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Category</label>
        <select
          value={form.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
          className="flex h-10 w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Tags</label>
        <Input
          value={form.tags}
          onChange={(e) => onChange({ tags: e.target.value })}
          placeholder="e.g. writing, blog, content, seo"
        />
        <p className="mt-1 text-xs text-muted-foreground">Comma-separated, max 10 tags</p>
      </div>
    </div>
  );
}

function StepBuilderType({
  form,
  onChange,
}: {
  form: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Choose how you'd like to build your tool.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange({ builderType: 'scratch' })}
          className={cn(
            'rounded-xl border-2 p-6 text-left transition-colors',
            form.builderType === 'scratch'
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/50',
          )}
        >
          <div className="text-2xl">
            <svg className="h-8 w-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-foreground">Start from Scratch</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Build your tool from the ground up. Full control over inputs, prompts, and configuration.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onChange({ builderType: 'template' })}
          className={cn(
            'rounded-xl border-2 p-6 text-left transition-colors',
            form.builderType === 'template'
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/50',
          )}
        >
          <div className="text-2xl">
            <svg className="h-8 w-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-foreground">Start from Template</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a pre-built template and customize it. Great for getting started quickly.
          </p>
        </button>
      </div>

      {form.builderType === 'template' && (
        <div className="rounded-xl border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Template gallery coming soon. For now, start from scratch to build your tool.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => onChange({ builderType: 'scratch' })}
          >
            Switch to Scratch
          </Button>
        </div>
      )}
    </div>
  );
}

function StepInputFields({
  form,
  onChange,
}: {
  form: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const fields = form.inputFields;

  const addField = () => {
    onChange({
      inputFields: [
        ...fields,
        {
          id: generateId(),
          label: '',
          key: '',
          type: 'text',
          required: false,
          placeholder: '',
          helpText: '',
          options: [],
        },
      ],
    });
  };

  const updateField = (index: number, updates: Partial<InputField>) => {
    const updated = fields.map((f, i) => {
      if (i !== index) return f;
      const merged = { ...f, ...updates };
      // Auto-generate key from label if key is empty or was auto-generated
      if (updates.label !== undefined && (f.key === '' || f.key === generateKey(f.label))) {
        merged.key = generateKey(updates.label);
      }
      return merged;
    });
    onChange({ inputFields: updated });
  };

  const removeField = (index: number) => {
    onChange({ inputFields: fields.filter((_, i) => i !== index) });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange({ inputFields: updated });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Define the input fields users will fill out when running your tool.
          </p>
        </div>
        <Button variant="accent" onClick={addField}>
          + Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/50 p-8 text-center">
          <p className="text-muted-foreground">No input fields yet.</p>
          <Button variant="outline" className="mt-3" onClick={addField}>
            Add Your First Field
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Label</label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="e.g. Blog Topic"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Key</label>
                        <Input
                          value={field.key}
                          onChange={(e) => updateField(index, { key: e.target.value })}
                          placeholder="e.g. blog_topic"
                          className="font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(index, { type: e.target.value as InputField['type'] })
                          }
                          className="flex h-10 w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
                        >
                          {FIELD_TYPES.map((ft) => (
                            <option key={ft.value} value={ft.value}>
                              {ft.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Placeholder
                        </label>
                        <Input
                          value={field.placeholder}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          placeholder="Placeholder text..."
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Help Text
                        </label>
                        <Input
                          value={field.helpText}
                          onChange={(e) => updateField(index, { helpText: e.target.value })}
                          placeholder="Additional guidance..."
                        />
                      </div>
                    </div>

                    {field.type === 'select' && (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Options (comma-separated)
                        </label>
                        <Input
                          value={field.options.join(', ')}
                          onChange={(e) =>
                            updateField(index, {
                              options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                      />
                      <span className="text-muted-foreground">Required field</span>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                      className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                      className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="mt-1 rounded p-1 text-destructive hover:text-destructive/80"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Preview */}
      {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Form Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {field.label || 'Untitled field'}
                    {field.required && <span className="text-destructive"> *</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      disabled
                      placeholder={field.placeholder}
                      rows={3}
                      className="flex w-full rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground/50"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      disabled
                      className="flex h-10 w-full rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
                    >
                      <option>{field.placeholder || 'Select...'}</option>
                      {field.options.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <div className="flex items-center gap-2">
                      <input type="checkbox" disabled className="h-4 w-4 rounded border-border" />
                      <span className="text-sm text-muted-foreground">
                        {field.placeholder || 'Yes / No'}
                      </span>
                    </div>
                  ) : (
                    <Input
                      disabled
                      type={field.type === 'number' ? 'number' : 'text'}
                      placeholder={field.placeholder}
                      className="bg-muted/50"
                    />
                  )}
                  {field.helpText && (
                    <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepAILogic({
  form,
  onChange,
}: {
  form: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const availableVars = form.inputFields
    .filter((f) => f.key)
    .map((f) => `{{input.${f.key}}}`);

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">System Prompt</label>
        <textarea
          value={form.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          placeholder="You are a helpful assistant that..."
          rows={6}
          className="flex w-full rounded-lg border border-border bg-card px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Defines the AI's behavior and personality. This is sent as the system message.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">User Prompt Template</label>
        <textarea
          value={form.userPromptTemplate}
          onChange={(e) => onChange({ userPromptTemplate: e.target.value })}
          placeholder="Write a blog post about {{input.topic}} with a {{input.tone}} tone..."
          rows={6}
          className="flex w-full rounded-lg border border-border bg-card px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          The prompt sent for each execution. Use variables to inject user inputs.
        </p>
      </div>

      {/* Available variables panel */}
      {availableVars.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Available Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableVars.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    // Append to user prompt
                    onChange({ userPromptTemplate: form.userPromptTemplate + ' ' + v });
                  }}
                  className="rounded-md bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent hover:bg-accent/20 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Click a variable to insert it into the user prompt template.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Model</label>
          <select
            value={form.model}
            onChange={(e) => onChange({ model: e.target.value as FormData['model'] })}
            className="flex h-10 w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
            <option value="gpt-4o">GPT-4o (Premium)</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            GPT-4o Mini is cheaper and faster. GPT-4o is more capable.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Temperature: {form.temperature.toFixed(1)}
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={form.temperature}
            onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
            className="mt-2 w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Precise (0)</span>
            <span>Creative (1)</span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Max Tokens</label>
          <Input
            type="number"
            value={form.maxTokens}
            onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) || 1000 })}
            min={100}
            max={16000}
          />
          <p className="mt-1 text-xs text-muted-foreground">Maximum output length (100-16000)</p>
        </div>
      </div>
    </div>
  );
}

function StepPricing({
  form,
  onChange,
}: {
  form: FormData;
  onChange: (updates: Partial<FormData>) => void;
}) {
  const addTier = () => {
    onChange({
      pricingTiers: [
        ...form.pricingTiers,
        { id: generateId(), name: '', credits: 1, description: '' },
      ],
    });
  };

  const updateTier = (index: number, updates: Partial<PricingTier>) => {
    const updated = form.pricingTiers.map((t, i) => (i === index ? { ...t, ...updates } : t));
    onChange({ pricingTiers: updated });
  };

  const removeTier = (index: number) => {
    onChange({ pricingTiers: form.pricingTiers.filter((_, i) => i !== index) });
  };

  // Earnings calculator
  const dailyRuns = 100;
  const creditsPerRun =
    form.pricingModel === 'per_run'
      ? form.creditsPerRun
      : form.pricingModel === 'tiered' && form.pricingTiers.length > 0
      ? form.pricingTiers[0].credits
      : 0;
  const monthlyEarningsCredits = dailyRuns * 30 * creditsPerRun * 0.7; // 70% creator share
  const monthlyEarningsUsd = monthlyEarningsCredits * 0.01; // $0.01 per credit estimate

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Set how users are charged to run your tool.</p>

      {/* Pricing model selector */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { value: 'free', label: 'Free', desc: 'No charge per run' },
          { value: 'per_run', label: 'Per Run', desc: 'Fixed credit cost per execution' },
          { value: 'tiered', label: 'Tiered', desc: 'Multiple pricing tiers' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange({ pricingModel: option.value as FormData['pricingModel'] })}
            className={cn(
              'rounded-xl border-2 p-4 text-left transition-colors',
              form.pricingModel === option.value
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-accent/50',
            )}
          >
            <h3 className="font-semibold text-foreground">{option.label}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{option.desc}</p>
          </button>
        ))}
      </div>

      {/* Per-run config */}
      {form.pricingModel === 'per_run' && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Credits Per Run</label>
          <Input
            type="number"
            value={form.creditsPerRun}
            onChange={(e) => onChange({ creditsPerRun: Math.max(1, parseInt(e.target.value) || 1) })}
            min={1}
            max={1000}
          />
          <p className="mt-1 text-xs text-muted-foreground">How many credits each execution costs (1-1000)</p>
        </div>
      )}

      {/* Tiered config */}
      {form.pricingModel === 'tiered' && (
        <div className="space-y-4">
          {form.pricingTiers.map((tier, index) => (
            <div
              key={tier.id}
              className="flex items-start gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Tier Name
                  </label>
                  <Input
                    value={tier.name}
                    onChange={(e) => updateTier(index, { name: e.target.value })}
                    placeholder="e.g. Basic"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Credits</label>
                  <Input
                    type="number"
                    value={tier.credits}
                    onChange={(e) =>
                      updateTier(index, { credits: Math.max(1, parseInt(e.target.value) || 1) })
                    }
                    min={1}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Description
                  </label>
                  <Input
                    value={tier.description}
                    onChange={(e) => updateTier(index, { description: e.target.value })}
                    placeholder="What's included..."
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeTier(index)}
                className="mt-6 rounded p-1 text-destructive hover:text-destructive/80"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <Button variant="outline" onClick={addTier}>
            + Add Tier
          </Button>
        </div>
      )}

      {/* Earnings calculator */}
      {form.pricingModel !== 'free' && creditsPerRun > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Projected Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              At <strong>100 runs/day</strong>, you'd earn approximately{' '}
              <strong className="text-accent">
                {Math.round(monthlyEarningsCredits).toLocaleString()} credits
              </strong>{' '}
              (~${monthlyEarningsUsd.toFixed(2)}) per month.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Based on 70% creator share. Actual earnings depend on usage volume.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepPreview({
  form,
  onGoToStep,
}: {
  form: FormData;
  onGoToStep: (step: number) => void;
}) {
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTestRun = async () => {
    setTesting(true);
    // Simulate a test run
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setTestOutput(
      'This is a simulated test output. In production, this will execute the actual AI prompt with sample inputs and display the real result.',
    );
    setTesting(false);
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">Preview how your tool will appear to users.</p>

      {/* Tool preview card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-2xl">
              <svg className="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.384a2.025 2.025 0 01-2.853-2.853l5.384-5.384m2.853 2.853l5.384-5.384a2.025 2.025 0 00-2.853-2.853l-5.384 5.384m2.853 2.853l-2.853-2.853" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-primary">
                {form.name || 'Untitled Tool'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {form.description || 'No description yet.'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.tags
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onGoToStep(1)}
              className="text-xs text-accent hover:text-accent/80"
            >
              Edit
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Input fields preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Input Fields ({form.inputFields.length})</CardTitle>
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="text-xs text-accent hover:text-accent/80"
          >
            Edit
          </button>
        </CardHeader>
        <CardContent>
          {form.inputFields.length > 0 ? (
            <div className="space-y-2">
              {form.inputFields.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm text-foreground">{f.label || 'Untitled'}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">{f.type}</Badge>
                    {f.required && <Badge variant="outline">Required</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No input fields defined.</p>
          )}
        </CardContent>
      </Card>

      {/* AI config preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">AI Configuration</CardTitle>
          <button
            type="button"
            onClick={() => onGoToStep(4)}
            className="text-xs text-accent hover:text-accent/80"
          >
            Edit
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="text-foreground">{form.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature</span>
              <span className="text-foreground">{form.temperature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Tokens</span>
              <span className="text-foreground">{form.maxTokens}</span>
            </div>
            {form.systemPrompt && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground">System Prompt</p>
                <p className="mt-1 rounded-lg bg-muted/50 p-2 font-mono text-xs text-foreground line-clamp-3">
                  {form.systemPrompt}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Pricing</CardTitle>
          <button
            type="button"
            onClick={() => onGoToStep(5)}
            className="text-xs text-accent hover:text-accent/80"
          >
            Edit
          </button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">
            {form.pricingModel === 'free'
              ? 'Free'
              : form.pricingModel === 'per_run'
              ? `${form.creditsPerRun} credits per run`
              : `${form.pricingTiers.length} pricing tiers`}
          </p>
        </CardContent>
      </Card>

      {/* Test run */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Test Run</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="accent" onClick={handleTestRun} disabled={testing}>
            {testing ? 'Running...' : 'Test Run'}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Uses your credits. Credits will be refunded after test.
          </p>
          {testOutput && (
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Output</p>
              <p className="mt-1 text-sm text-foreground">{testOutput}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StepPublish({
  form,
  saving,
  onSaveDraft,
  onPublish,
}: {
  form: FormData;
  saving: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary">Ready to launch?</h2>
        <p className="mt-1 text-muted-foreground">
          Review your tool settings one last time before publishing.
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name</span>
                <p className="font-medium text-foreground">{form.name || '--'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Slug</span>
                <p className="font-mono text-foreground">{form.slug || '--'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Input Fields</span>
                <p className="font-medium text-foreground">{form.inputFields.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Pricing</span>
                <p className="font-medium text-foreground">
                  {form.pricingModel === 'free'
                    ? 'Free'
                    : form.pricingModel === 'per_run'
                    ? `${form.creditsPerRun} credits/run`
                    : `${form.pricingTiers.length} tiers`}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Model</span>
                <p className="font-medium text-foreground">{form.model}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Temperature</span>
                <p className="font-medium text-foreground">{form.temperature}</p>
              </div>
            </div>

            {form.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description</span>
                <p className="text-sm text-foreground">{form.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onSaveDraft}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button
          variant="accent"
          className="flex-1"
          onClick={onPublish}
          disabled={saving}
        >
          {saving ? 'Publishing...' : 'Publish Now'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function CreateToolPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [successToolId, setSuccessToolId] = useState<string | null>(null);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    tags: '',
    builderType: 'scratch',
    templateId: '',
    inputFields: [],
    systemPrompt: '',
    userPromptTemplate: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
    pricingModel: 'per_run',
    creditsPerRun: 5,
    pricingTiers: [],
  });

  const onChange = useCallback((updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const buildToolPayload = () => {
    // Build input schema from fields
    const inputSchema: Record<string, unknown> = {
      type: 'object',
      properties: {} as Record<string, unknown>,
      required: [] as string[],
    };

    for (const field of form.inputFields) {
      if (!field.key) continue;
      const prop: Record<string, unknown> = {
        type: field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string',
        label: field.label,
        placeholder: field.placeholder,
        helpText: field.helpText,
      };
      if (field.type === 'select') {
        prop.enum = field.options;
      }
      if (field.type === 'textarea') {
        prop.format = 'textarea';
      }
      (inputSchema.properties as Record<string, unknown>)[field.key] = prop;
      if (field.required) {
        (inputSchema.required as string[]).push(field.key);
      }
    }

    // Build pricing
    let pricing: Record<string, unknown>;
    if (form.pricingModel === 'free') {
      pricing = { model: 'free' };
    } else if (form.pricingModel === 'tiered') {
      pricing = {
        model: 'tiered',
        tiers: form.pricingTiers.map((t) => ({
          id: t.id,
          name: t.name,
          credits: t.credits,
          description: t.description,
        })),
      };
    } else {
      pricing = { model: 'per_run', creditsPerRun: form.creditsPerRun };
    }

    // Build config
    const config = {
      systemPrompt: form.systemPrompt,
      userPromptTemplate: form.userPromptTemplate,
      model: form.model,
      temperature: form.temperature,
      maxTokens: form.maxTokens,
    };

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    return {
      name: form.name,
      slug: form.slug,
      description: form.description,
      categoryId: form.categoryId || undefined,
      executionType: 'prompt' as const,
      pricing,
      inputSchema,
      config,
      tags,
    };
  };

  const handleSaveDraft = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);

    try {
      const payload = buildToolPayload();
      const res = (await api.creator.createTool(token, payload)) as {
        success: boolean;
        data: { id: string; slug: string };
        error?: { message: string };
      };

      if (res.success) {
        setSuccessToolId(res.data.id);
        setSuccessSlug(res.data.slug);
      } else {
        setError(res.error?.message || 'Failed to save tool');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tool');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);

    try {
      const payload = buildToolPayload();
      const createRes = (await api.creator.createTool(token, payload)) as {
        success: boolean;
        data: { id: string; slug: string };
        error?: { message: string };
      };

      if (!createRes.success) {
        setError(createRes.error?.message || 'Failed to create tool');
        return;
      }

      // Now publish it
      await api.creator.publishTool(token, createRes.data.id);
      setSuccessToolId(createRes.data.id);
      setSuccessSlug(createRes.data.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish tool');
    } finally {
      setSaving(false);
    }
  };

  // Success screen
  if (successToolId) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
            <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primary">Tool Created!</h1>
        <p className="mt-2 text-muted-foreground">
          Your tool has been saved. You can view and manage it from your tools page.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href={`/tools/${successSlug}`}>
            <Button variant="accent">View Tool Page</Button>
          </Link>
          <Link href={`/creator/tools/${successToolId}/edit`}>
            <Button variant="outline">Edit Tool</Button>
          </Link>
          <Link href="/creator/tools">
            <Button variant="ghost">Back to My Tools</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return form.name.length >= 3 && form.slug.length >= 3 && form.description.length >= 10;
      case 2:
        return form.builderType === 'scratch' || form.templateId !== '';
      default:
        return true;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Create New Tool</h1>
        <p className="text-muted-foreground">Build your AI-powered tool step by step</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((step) => (
          <button
            key={step.number}
            type="button"
            onClick={() => {
              if (step.number < currentStep) setCurrentStep(step.number);
            }}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              currentStep === step.number
                ? 'bg-accent text-accent-foreground'
                : step.number < currentStep
                ? 'bg-accent/10 text-accent cursor-pointer'
                : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                currentStep === step.number
                  ? 'bg-accent-foreground/20 text-accent-foreground'
                  : step.number < currentStep
                  ? 'bg-accent/20 text-accent'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {step.number < currentStep ? (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                step.number
              )}
            </span>
            <span className="hidden sm:inline">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>
            Step {currentStep}: {STEPS[currentStep - 1].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && <StepBasics form={form} onChange={onChange} />}
          {currentStep === 2 && <StepBuilderType form={form} onChange={onChange} />}
          {currentStep === 3 && <StepInputFields form={form} onChange={onChange} />}
          {currentStep === 4 && <StepAILogic form={form} onChange={onChange} />}
          {currentStep === 5 && <StepPricing form={form} onChange={onChange} />}
          {currentStep === 6 && (
            <StepPreview form={form} onGoToStep={setCurrentStep} />
          )}
          {currentStep === 7 && (
            <StepPublish
              form={form}
              saving={saving}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      {currentStep < 7 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <Button
            variant="accent"
            onClick={() => setCurrentStep((s) => Math.min(7, s + 1))}
            disabled={!canGoNext()}
          >
            {currentStep === 6 ? 'Review & Publish' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}
