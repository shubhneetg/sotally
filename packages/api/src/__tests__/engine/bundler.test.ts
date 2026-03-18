import { describe, it, expect } from 'vitest';
import { bundleApp } from '../../engine/bundler';

const sampleApp = `
function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div className="p-4">
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
`;

describe('bundleApp', () => {
  // ─── HTML structure ──────────────────────────────────────────

  it('should produce valid HTML with doctype', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toMatch(/^<!DOCTYPE html>/);
    expect(result.html).toContain('</html>');
  });

  it('should include React CDN scripts', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toContain('unpkg.com/react@18/umd/react.production.min.js');
    expect(result.html).toContain('unpkg.com/react-dom@18/umd/react-dom.production.min.js');
  });

  it('should include Babel standalone CDN', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toContain('unpkg.com/@babel/standalone/babel.min.js');
  });

  it('should include Tailwind CSS CDN', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toContain('cdn.tailwindcss.com');
  });

  it('should include the app source code in a babel script tag', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toContain('type="text/babel"');
    expect(result.html).toContain(sampleApp);
  });

  it('should include ReactDOM.createRoot render call', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toContain('ReactDOM.createRoot');
    expect(result.html).toContain("document.getElementById('root')");
    expect(result.html).toContain('React.createElement(App)');
  });

  it('should include a root div element', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toContain('<div id="root">');
  });

  it('should include an error boundary script', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toContain("window.addEventListener('error'");
    expect(result.html).toContain('App failed to load');
  });

  // ─── Title ───────────────────────────────────────────────────

  it('should set the correct title when provided', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1, 'My Fitness Tracker');
    expect(result.html).toContain('<title>My Fitness Tracker</title>');
  });

  it('should default title to "Sotally App" when not provided', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toContain('<title>Sotally App</title>');
  });

  it('should escape HTML entities in the title', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1, 'App <script>alert(1)</script>');
    expect(result.html).not.toContain('<script>alert(1)</script>');
    expect(result.html).toContain('&lt;script&gt;');
  });

  it('should escape ampersands in the title', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1, 'Tom & Jerry');
    expect(result.html).toContain('Tom &amp; Jerry');
  });

  it('should escape quotes in the title', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1, 'App "Test"');
    expect(result.html).toContain('App &quot;Test&quot;');
  });

  // ─── Metadata ────────────────────────────────────────────────

  it('should include app-id meta tag', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-xyz-789', 1);
    expect(result.html).toContain('content="app-xyz-789"');
  });

  it('should include app-version meta tag', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 5);
    expect(result.html).toContain('content="5"');
  });

  it('should include Sotally generator meta tag', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toContain('content="Sotally App Engine"');
  });

  // ─── Bundle size ─────────────────────────────────────────────

  it('should return correct bundle size in bytes', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    const expectedSize = Buffer.byteLength(result.html, 'utf8');
    expect(result.bundleSizeBytes).toBe(expectedSize);
  });

  it('should return a positive bundle size', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.bundleSizeBytes).toBeGreaterThan(0);
  });

  it('should return larger size for larger source code', () => {
    const smallResult = bundleApp({ 'App.tsx': 'function App() { return <div/>; }' }, 'a', 1);
    const largeSource = sampleApp + '\n// ' + 'x'.repeat(10000);
    const largeResult = bundleApp({ 'App.tsx': largeSource }, 'a', 1);
    expect(largeResult.bundleSizeBytes).toBeGreaterThan(smallResult.bundleSizeBytes);
  });

  // ─── Error cases ─────────────────────────────────────────────

  it('should throw if App.tsx is missing from files', () => {
    expect(() => bundleApp({}, 'app-123', 1)).toThrow('App.tsx is missing');
  });

  it('should throw if files has other keys but no App.tsx', () => {
    expect(() => bundleApp({ 'index.tsx': 'code' }, 'app-123', 1)).toThrow('App.tsx is missing');
  });

  // ─── Loading state ───────────────────────────────────────────

  it('should include a loading indicator', () => {
    const result = bundleApp({ 'App.tsx': sampleApp }, 'app-123', 1);
    expect(result.html).toContain('Loading app...');
    expect(result.html).toContain('sotally-loading');
  });
});
