import Link from 'next/link';

const recentExecutions = [
  { id: 1, toolName: 'Image Background Remover', creditCost: 2, date: '2 hours ago', status: 'completed' },
  { id: 2, toolName: 'SEO Meta Analyzer', creditCost: 3, date: '5 hours ago', status: 'completed' },
  { id: 3, toolName: 'PDF Invoice Generator', creditCost: 1, date: 'Yesterday', status: 'completed' },
  { id: 4, toolName: 'Color Palette Generator', creditCost: 1, date: 'Yesterday', status: 'completed' },
];

const favoriteTools = [
  { slug: 'image-bg-remover', name: 'Image Background Remover', icon: '🖼️', creditCost: 2 },
  { slug: 'seo-meta-analyzer', name: 'SEO Meta Analyzer', icon: '🔍', creditCost: 3 },
  { slug: 'json-formatter', name: 'JSON Formatter', icon: '{ }', creditCost: 1 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-primary">Dashboard</h1>

      {/* Credit Balance Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your Credit Balance</p>
            <p className="mt-1 text-4xl font-bold text-primary">🪙 247</p>
            <p className="mt-1 text-xs text-muted-foreground">~82 tool runs remaining</p>
          </div>
          <Link
            href="/dashboard/credits"
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Buy Credits
          </Link>
        </div>
      </div>

      {/* Recent Executions */}
      <div>
        <h2 className="text-lg font-semibold text-primary">Recent Executions</h2>
        <div className="mt-4 rounded-xl border border-border bg-card shadow-sm">
          <div className="divide-y divide-border">
            {recentExecutions.map((execution) => (
              <div key={execution.id} className="flex items-center justify-between px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{execution.toolName}</p>
                    <p className="text-xs text-muted-foreground">{execution.date}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  🪙 {execution.creditCost}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-4 py-3 text-center sm:px-6">
            <Link
              href="/dashboard/tools"
              className="text-sm font-medium text-accent hover:text-accent/80"
            >
              View all executions
            </Link>
          </div>
        </div>
      </div>

      {/* Favorite Tools */}
      <div>
        <h2 className="text-lg font-semibold text-primary">Favorite Tools</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-accent/50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl">
                {tool.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{tool.name}</p>
                <p className="text-xs text-muted-foreground">🪙 {tool.creditCost} per run</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
