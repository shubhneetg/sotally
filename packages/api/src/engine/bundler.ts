import type { BundleResult } from './types';

/**
 * Wraps generated App.tsx source into a self-contained HTML page
 * that loads React, ReactDOM, Tailwind, and Babel from CDN.
 *
 * The component is rendered via Babel standalone transpilation
 * in the browser — no build step needed.
 */
export function bundleApp(
  files: Record<string, string>,
  appId: string,
  version: number,
  title?: string,
): BundleResult {
  const appSource = files['App.tsx'];
  if (!appSource) {
    throw new Error('Cannot bundle: App.tsx is missing from files');
  }

  const appTitle = title || 'Sotally App';
  const safeTitle = escapeHtml(appTitle);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <meta name="generator" content="Sotally App Engine">
  <meta name="app-id" content="${appId}">
  <meta name="app-version" content="${version}">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    /* Prevent flash of unstyled content */
    #root { min-height: 100vh; }
    .sotally-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: system-ui, sans-serif;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="sotally-loading">Loading app...</div>
  </div>
  <script type="text/babel" data-presets="react">
${appSource}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
  </script>
  <script>
    // Error boundary: show user-friendly message if app fails to load
    window.addEventListener('error', function(e) {
      var root = document.getElementById('root');
      if (root && root.innerHTML.includes('sotally-loading')) {
        root.innerHTML = '<div style="padding:2rem;text-align:center;font-family:system-ui,sans-serif;">' +
          '<h2 style="color:#ef4444;margin-bottom:0.5rem;">App failed to load</h2>' +
          '<p style="color:#6b7280;">Please try refreshing the page.</p></div>';
      }
    });
  </script>
</body>
</html>`;

  const bundleSizeBytes = Buffer.byteLength(html, 'utf8');

  return { html, bundleSizeBytes };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
