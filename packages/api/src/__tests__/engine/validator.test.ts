import { describe, it, expect } from 'vitest';
import { validateGeneratedCode } from '../../engine/validator';

// Helper: minimal valid React component with default export and JSX
const validApp = `
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="p-4">
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}

export default App;
`;

describe('validateGeneratedCode', () => {
  // ─── Valid code ──────────────────────────────────────────────

  it('should pass valid React code with default export', () => {
    const result = validateGeneratedCode({ 'App.tsx': validApp });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass code with "export default function" syntax', () => {
    const code = `
function App() {
  const [val, setVal] = useState('hello');
  return <div>{val}</div>;
}
export default function App() {
  return <p>hi</p>;
}
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(true);
  });

  it('should pass code with "export { X as default }" syntax', () => {
    const code = `
function MyApp() {
  const [x, setX] = useState(0);
  return <div>{x}</div>;
}
export { MyApp as default }
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(true);
  });

  // ─── Banned patterns ─────────────────────────────────────────

  it('should reject code containing eval()', () => {
    const code = validApp + '\neval("alert(1)");';
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('eval() is not allowed — potential code injection');
  });

  it('should reject code containing new Function()', () => {
    const code = validApp + '\nconst fn = new Function("return 1");';
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Function() constructor'))).toBe(true);
  });

  it('should reject code containing fetch()', () => {
    const code = validApp + '\nfetch("https://evil.com");';
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('fetch() is not allowed — apps must be fully client-side');
  });

  it('should reject code containing XMLHttpRequest', () => {
    const code = validApp + '\nconst xhr = new XMLHttpRequest();';
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('XMLHttpRequest'))).toBe(true);
  });

  it('should reject code containing document.cookie', () => {
    const code = validApp + '\nconst c = document.cookie;';
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('document.cookie access is not allowed');
  });

  it('should reject code containing dangerouslySetInnerHTML', () => {
    const code = `
import { useState } from 'react';
function App() {
  const [html] = useState('<b>bold</b>');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
export default App;
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('dangerouslySetInnerHTML is not allowed — XSS risk');
  });

  it('should reject code containing iframe elements', () => {
    const code = validApp.replace(
      '<div className="p-4">',
      '<div className="p-4"><iframe src="https://evil.com"></iframe>',
    );
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('iframe'))).toBe(true);
  });

  it('should reject code containing window.open()', () => {
    const code = validApp + '\nwindow.open("https://evil.com");';
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('window.open'))).toBe(true);
  });

  it('should reject code containing dynamic import()', () => {
    const code = validApp + '\nconst mod = import("./evil");';
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Dynamic import'))).toBe(true);
  });

  it('should reject code containing require()', () => {
    const code = validApp + '\nconst fs = require("fs");';
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('require'))).toBe(true);
  });

  it('should reject code containing document.write()', () => {
    const code = validApp + '\ndocument.write("<script>alert(1)</script>");';
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('document.write'))).toBe(true);
  });

  it('should collect multiple banned pattern violations at once', () => {
    const code = validApp + '\neval("x");\nfetch("/api");\nconst c = document.cookie;';
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  // ─── Size limit ───────────────────────────────────────────────

  it('should reject code larger than 500KB', () => {
    const bigCode = validApp + '\n// ' + 'x'.repeat(500 * 1024);
    const result = validateGeneratedCode({ 'App.tsx': bigCode });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('exceeds'))).toBe(true);
  });

  it('should reject when total size across multiple files exceeds 500KB', () => {
    const halfSize = 'x'.repeat(260 * 1024);
    const result = validateGeneratedCode({
      'App.tsx': validApp + '\n// ' + halfSize,
      'utils.tsx': halfSize,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('exceeds'))).toBe(true);
  });

  it('should pass code just under 500KB', () => {
    // validApp is ~250 bytes; pad to just under 500KB
    const padding = 'a'.repeat(499 * 1024);
    const code = validApp + '\n// ' + padding;
    // This might be right at the boundary; total bytes includes all files
    const totalBytes = Buffer.byteLength(code, 'utf8');
    if (totalBytes < 500 * 1024) {
      const result = validateGeneratedCode({ 'App.tsx': code });
      // Should not have size error (may have other errors depending on content)
      expect(result.errors.some(e => e.includes('exceeds'))).toBe(false);
    }
  });

  // ─── Missing default export ───────────────────────────────────

  it('should reject code without default export', () => {
    const code = `
import { useState } from 'react';
function App() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
// No export default
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('App.tsx must have a default export (e.g., "export default App;")');
  });

  it('should reject named export without default', () => {
    const code = `
import { useState } from 'react';
export function App() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('default export'))).toBe(true);
  });

  // ─── Missing App.tsx ──────────────────────────────────────────

  it('should reject if App.tsx is missing from files', () => {
    const result = validateGeneratedCode({ 'index.tsx': 'export default function App() { return <div/>; }' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing App.tsx in generated files');
  });

  it('should reject empty files object', () => {
    const result = validateGeneratedCode({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing App.tsx in generated files');
  });

  // ─── React component detection ────────────────────────────────

  it('should reject code with no React patterns and no JSX', () => {
    const code = `
const x = 42;
console.log(x);
export default x;
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('does not appear to be a React component'))).toBe(true);
  });

  it('should pass code with JSX but no hooks', () => {
    const code = `
function App() {
  return <div>Hello World</div>;
}
export default App;
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(true);
  });

  it('should pass code with hooks but minimal JSX-like syntax', () => {
    const code = `
function App() {
  const [data, setData] = useState([]);
  return React.createElement('div', null, 'hello');
}
export default App;
`;
    // Has useState hook, so React pattern detected
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(true);
  });

  // ─── TypeScript patterns ──────────────────────────────────────

  it('should reject TypeScript React.FC annotation', () => {
    const code = `
const App: React.FC = () => {
  const [x, setX] = useState(0);
  return <div>{x}</div>;
};
export default App;
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('React.FC'))).toBe(true);
  });

  it('should reject TypeScript interface declarations', () => {
    const code = `
interface Props {
  name: string;
}
function App() {
  const [x, setX] = useState(0);
  return <div>{x}</div>;
}
export default App;
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('interface'))).toBe(true);
  });

  it('should reject TypeScript type aliases', () => {
    const code = `
type Config = {
  theme: string;
};
function App() {
  const [x, setX] = useState(0);
  return <div>{x}</div>;
}
export default App;
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('type alias'))).toBe(true);
  });

  it('should reject TypeScript "as" casts', () => {
    const code = `
function App() {
  const [x, setX] = useState(0);
  const val = x as number;
  return <div>{val}</div>;
}
export default App;
`;
    const result = validateGeneratedCode({ 'App.tsx': code });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('"as" cast'))).toBe(true);
  });
});
