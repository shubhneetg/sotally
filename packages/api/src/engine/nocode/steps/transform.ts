export type TransformOperation =
  | 'regex_extract'
  | 'split'
  | 'join'
  | 'template'
  | 'json_extract'
  | 'markdown_to_html';

export interface TransformStepConfig {
  operation: TransformOperation;
  input: string;
  /** Regex pattern for regex_extract */
  pattern?: string;
  /** Capture group index for regex_extract (default 0 = full match) */
  group?: number;
  /** Delimiter for split/join */
  delimiter?: string;
  /** Template string for template operation */
  templateStr?: string;
  /** Variables for template operation */
  vars?: Record<string, any>;
  /** JSON path for json_extract (dot notation) */
  path?: string;
}

/**
 * Executes a transform operation on text data.
 */
export function executeTransformStep(config: TransformStepConfig): string | string[] | any {
  switch (config.operation) {
    case 'regex_extract':
      return regexExtract(config.input, config.pattern!, config.group ?? 0);
    case 'split':
      return split(config.input, config.delimiter ?? '\n');
    case 'join':
      return join(config.input, config.delimiter ?? ', ');
    case 'template':
      return template(config.templateStr ?? '', config.vars ?? {});
    case 'json_extract':
      return jsonExtract(config.input, config.path!);
    case 'markdown_to_html':
      return markdownToHtml(config.input);
    default:
      throw new TransformError(`Unknown transform operation: ${config.operation}`);
  }
}

/**
 * Extracts text using a regex pattern. Returns the specified capture group.
 */
function regexExtract(input: string, pattern: string, group: number): string {
  try {
    const regex = new RegExp(pattern);
    const match = input.match(regex);

    if (!match) {
      return '';
    }

    if (group >= match.length) {
      throw new TransformError(
        `Capture group ${group} not found. Match has ${match.length} groups.`
      );
    }

    return match[group] ?? '';
  } catch (error) {
    if (error instanceof TransformError) throw error;
    throw new TransformError(`Invalid regex pattern: ${pattern}`);
  }
}

/**
 * Splits a string by delimiter.
 */
function split(input: string, delimiter: string): string[] {
  return input.split(delimiter);
}

/**
 * Joins an input (expects JSON array string or newline-separated string) by delimiter.
 */
function join(input: string, delimiter: string): string {
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parsed.join(delimiter);
    }
  } catch {
    // Not JSON, treat as newline-separated
  }
  return input.split('\n').join(delimiter);
}

/**
 * Simple template substitution: replaces {{key}} with corresponding value from vars.
 */
function template(templateStr: string, vars: Record<string, any>): string {
  return templateStr.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, key: string) => {
    const value = getNestedValue(vars, key);
    if (value === undefined) return `{{${key}}}`;
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

/**
 * Extracts a value from a JSON string using dot-notation path.
 */
function jsonExtract(input: string, path: string): any {
  let parsed: any;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new TransformError('json_extract: input is not valid JSON');
  }

  const value = getNestedValue(parsed, path);
  if (value === undefined) {
    throw new TransformError(`json_extract: path "${path}" not found`);
  }

  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/**
 * Basic Markdown to HTML conversion. Handles common patterns:
 * headers, bold, italic, code blocks, inline code, lists, links, paragraphs.
 */
function markdownToHtml(input: string): string {
  let html = input;

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Unordered lists
  html = html.replace(/^[*-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Line breaks (double newline = paragraph break)
  html = html.replace(/\n\n/g, '</p><p>');
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<h[1-4]>)/g, '$1');
  html = html.replace(/(<\/h[1-4]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');

  return html;
}

function getNestedValue(obj: any, path: string): any {
  const segments = path.split('.');
  let current = obj;
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

export class TransformError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransformError';
  }
}
