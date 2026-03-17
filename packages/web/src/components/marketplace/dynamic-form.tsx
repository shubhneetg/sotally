'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface JsonSchemaProperty {
  type: string;
  title?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  helpText?: string;
  format?: string;
  enum?: string[];
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  default?: unknown;
}

interface JsonSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface DynamicFormProps {
  schema: JsonSchema;
  onSubmit: (data: Record<string, unknown>) => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function DynamicForm({
  schema,
  onSubmit,
  submitLabel = 'Submit',
  isSubmitting = false,
  disabled = false,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (prop.default !== undefined) {
        initial[key] = prop.default;
      } else if (prop.type === 'boolean') {
        initial[key] = false;
      } else {
        initial[key] = '';
      }
    }
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const required = schema.required || [];

    for (const field of required) {
      const value = formData[field];
      if (value === '' || value === undefined || value === null) {
        const prop = schema.properties[field];
        const label = prop?.title || (prop as any)?.label || field.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        newErrors[field] = `${label} is required`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, schema]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const required = schema.required || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {Object.entries(schema.properties).map(([key, prop]) => {
        const label = prop.title || (prop as any).label || key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        const isRequired = required.includes(key);

        return (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-foreground">
              {label}
              {isRequired && <span className="ml-1 text-destructive">*</span>}
            </label>
            {(prop.description || prop.helpText) && (
              <p className="mt-0.5 text-xs text-muted-foreground">{prop.helpText || prop.description}</p>
            )}

            <div className="mt-1.5">
              {/* Enum -> Select */}
              {prop.enum ? (
                <select
                  id={key}
                  value={String(formData[key] || '')}
                  onChange={(e) => updateField(key, e.target.value)}
                  disabled={disabled}
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select {label.toLowerCase()}</option>
                  {prop.enum.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : prop.type === 'boolean' ? (
                /* Boolean -> Checkbox */
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id={key}
                    type="checkbox"
                    checked={Boolean(formData[key])}
                    onChange={(e) => updateField(key, e.target.checked)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent/20"
                  />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </label>
              ) : prop.type === 'number' || prop.type === 'integer' ? (
                /* Number */
                <Input
                  id={key}
                  type="number"
                  value={String(formData[key] || '')}
                  onChange={(e) => updateField(key, e.target.value ? Number(e.target.value) : '')}
                  min={prop.minimum}
                  max={prop.maximum}
                  disabled={disabled}
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              ) : prop.type === 'string' && (prop.format === 'textarea' || (prop.maxLength && prop.maxLength > 200)) ? (
                /* Long text / textarea format -> Textarea */
                <textarea
                  id={key}
                  value={String(formData[key] || '')}
                  onChange={(e) => updateField(key, e.target.value)}
                  disabled={disabled}
                  rows={5}
                  maxLength={prop.maxLength}
                  placeholder={prop.placeholder || `Enter ${label.toLowerCase()}`}
                  className="flex w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
              ) : (
                /* Default string -> Input */
                <Input
                  id={key}
                  type="text"
                  value={String(formData[key] || '')}
                  onChange={(e) => updateField(key, e.target.value)}
                  maxLength={prop.maxLength}
                  disabled={disabled}
                  placeholder={prop.placeholder || `Enter ${label.toLowerCase()}`}
                />
              )}

              {errors[key] && (
                <p className="mt-1 text-xs text-destructive">{errors[key]}</p>
              )}
            </div>
          </div>
        );
      })}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={disabled || isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Running...
          </span>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
