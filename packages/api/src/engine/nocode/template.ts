export interface TemplateContext {
  input: Record<string, any>;
  steps: Record<string, any>;
  env: Record<string, string>;
}

/**
 * Resolves a nested property path like "user.name" from an object.
 * Returns undefined if any segment is missing.
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  const segments = path.split('.');
  let current: any = obj;

  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

/**
 * Converts a value to a string suitable for template substitution.
 * Objects/arrays are JSON-stringified, primitives are converted directly.
 */
function valueToString(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Resolves all {{input.field}}, {{steps.stepId.key}}, and {{env.KEY}} variables
 * in a template string. Supports nested paths like {{input.user.name}}.
 *
 * If a variable cannot be resolved, the original {{var}} placeholder is preserved.
 */
export function resolveTemplate(template: string, context: TemplateContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, expression: string) => {
    const trimmed = expression.trim();
    const dotIndex = trimmed.indexOf('.');

    if (dotIndex === -1) {
      return `{{${expression}}}`;
    }

    const namespace = trimmed.substring(0, dotIndex);
    const path = trimmed.substring(dotIndex + 1);

    let source: Record<string, any> | undefined;

    switch (namespace) {
      case 'input':
        source = context.input;
        break;
      case 'steps':
        source = context.steps;
        break;
      case 'env':
        source = context.env;
        break;
      default:
        return `{{${expression}}}`;
    }

    if (!source) {
      return `{{${expression}}}`;
    }

    const value = getNestedValue(source, path);

    if (value === undefined) {
      return `{{${expression}}}`;
    }

    return valueToString(value);
  });
}

/**
 * Resolves variables in any value: strings get template resolution,
 * objects/arrays are recursively resolved, primitives pass through.
 */
export function resolveValue(value: any, context: TemplateContext): any {
  if (typeof value === 'string') {
    return resolveTemplate(value, context);
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, context));
  }
  if (value !== null && typeof value === 'object') {
    const resolved: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      resolved[key] = resolveValue(val, context);
    }
    return resolved;
  }
  return value;
}
