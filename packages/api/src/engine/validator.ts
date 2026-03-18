import type { ValidationResult } from './types';

const MAX_CODE_SIZE_BYTES = 500 * 1024; // 500KB

const BANNED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\beval\s*\(/, reason: 'eval() is not allowed — potential code injection' },
  { pattern: /\bnew\s+Function\s*\(/, reason: 'Function() constructor is not allowed — potential code injection' },
  { pattern: /\bfetch\s*\(/, reason: 'fetch() is not allowed — apps must be fully client-side' },
  { pattern: /\bXMLHttpRequest\b/, reason: 'XMLHttpRequest is not allowed — apps must be fully client-side' },
  { pattern: /\bdocument\.cookie\b/, reason: 'document.cookie access is not allowed' },
  { pattern: /\bdangerouslySetInnerHTML\b/, reason: 'dangerouslySetInnerHTML is not allowed — XSS risk' },
  { pattern: /<iframe[\s>]/i, reason: 'iframe elements are not allowed' },
  { pattern: /\bwindow\.open\s*\(/, reason: 'window.open() is not allowed' },
  { pattern: /\bimport\s*\(/, reason: 'Dynamic import() is not allowed — all code must be in one file' },
  { pattern: /\brequire\s*\(/, reason: 'require() is not allowed — all code must be in one file' },
  { pattern: /\bdocument\.write\s*\(/, reason: 'document.write() is not allowed' },
];

export function validateGeneratedCode(files: Record<string, string>): ValidationResult {
  const errors: string[] = [];

  const appSource = files['App.tsx'];
  if (!appSource) {
    return { valid: false, errors: ['Missing App.tsx in generated files'] };
  }

  // Check total size
  const totalBytes = Object.values(files).reduce((sum, code) => sum + Buffer.byteLength(code, 'utf8'), 0);
  if (totalBytes > MAX_CODE_SIZE_BYTES) {
    errors.push(`Total code size (${(totalBytes / 1024).toFixed(1)}KB) exceeds ${MAX_CODE_SIZE_BYTES / 1024}KB limit`);
  }

  // Check banned patterns
  for (const { pattern, reason } of BANNED_PATTERNS) {
    if (pattern.test(appSource)) {
      errors.push(reason);
    }
  }

  // Check for default export
  const hasDefaultExport =
    /export\s+default\s+\w+/.test(appSource) ||
    /export\s+\{\s*\w+\s+as\s+default\s*\}/.test(appSource) ||
    /export\s+default\s+function\b/.test(appSource);

  if (!hasDefaultExport) {
    errors.push('App.tsx must have a default export (e.g., "export default App;")');
  }

  // Check that it looks like a React component (has at least one useState or return with JSX)
  const hasReactPatterns =
    /\buseState\b/.test(appSource) ||
    /\buseEffect\b/.test(appSource) ||
    /\buseCallback\b/.test(appSource) ||
    /\buseMemo\b/.test(appSource) ||
    /\buseRef\b/.test(appSource);

  const hasJSX = /<\w+[\s/>]/.test(appSource);

  if (!hasReactPatterns && !hasJSX) {
    errors.push('App.tsx does not appear to be a React component (no hooks or JSX detected)');
  }

  // Check for TypeScript syntax that would break Babel standalone
  const tsPatterns: Array<{ pattern: RegExp; reason: string }> = [
    { pattern: /:\s*React\.(FC|FunctionComponent)/, reason: 'TypeScript React.FC annotation found — use plain JSX' },
    { pattern: /\binterface\s+\w+\s*\{/, reason: 'TypeScript interface declaration found — use plain JSX' },
    { pattern: /\btype\s+\w+\s*=\s*\{/, reason: 'TypeScript type alias found — use plain JSX' },
    { pattern: /as\s+(string|number|boolean|any|unknown)\b/, reason: 'TypeScript "as" cast found — use plain JSX' },
  ];

  for (const { pattern, reason } of tsPatterns) {
    if (pattern.test(appSource)) {
      errors.push(reason);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
