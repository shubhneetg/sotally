import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: 'Changelog — What\'s New on Sotally',
  description: 'See every feature we\'ve shipped on Sotally. We build fast and ship daily. Follow our progress.',
};

interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  tag: 'feature' | 'improvement' | 'fix' | 'content';
  link?: string;
}

const entries: ChangelogEntry[] = [
  { date: '2026-03-17', title: 'Enhanced Pricing Page', description: 'Competitor comparison table (Sotally vs ChatGPT vs Jasper), "How credits work" explainer, Schema.org FAQ markup.', tag: 'improvement', link: '/pricing' },
  { date: '2026-03-17', title: 'Favorites/Bookmark System', description: 'Save tools to your personal toolkit. Toggle favorites via API, view saved tools on dashboard.', tag: 'feature' },
  { date: '2026-03-17', title: 'Consistent Global Navigation', description: 'Shared header with auth-aware menu on all public pages. Mobile responsive hamburger nav.', tag: 'improvement' },
  { date: '2026-03-17', title: 'Referral Sharing Card', description: 'Dashboard and welcome page now show your referral link with Copy, Tweet, and LinkedIn share buttons. Both parties get 50 credits.', tag: 'feature' },
  { date: '2026-03-17', title: 'Dynamic SEO Meta Tags', description: 'Every tool detail page now has tool-specific title, description, OG image, and Schema.org SoftwareApplication markup.', tag: 'improvement' },
  { date: '2026-03-17', title: 'Welcome Onboarding Page', description: 'New users see a role picker, starter tools, and AI Canvas CTA instead of an empty dashboard.', tag: 'feature', link: '/welcome' },
  { date: '2026-03-17', title: 'Social Proof Badges', description: '"Popular" badge for tools with 50+ runs, "New" badge for tools less than 7 days old. Quick Actions on dashboard.', tag: 'improvement' },
  { date: '2026-03-17', title: 'Homepage Redesign', description: 'Conversion-optimized landing page with stats bar, category grid, integration strip, creator section, and guide links.', tag: 'improvement' },
  { date: '2026-03-17', title: 'Demo Output Preview', description: 'Tool detail pages show example output so users see value before spending credits.', tag: 'feature' },
  { date: '2026-03-17', title: 'Knowledge Base — 12 Guides', description: '12 persona-based guides for developers, marketers, writers, educators, and more. Schema.org Article + FAQPage + HowTo markup.', tag: 'content', link: '/guides' },
  { date: '2026-03-17', title: '100 Integration SEO Pages', description: '100 service integration pages with unique descriptions, use cases, FAQ, and Schema.org markup. 15 active connectors.', tag: 'content', link: '/integrations' },
  { date: '2026-03-17', title: '15 Working Connectors', description: 'GitHub, Slack, Discord, Notion, Airtable, HubSpot, Mailchimp, Stripe, Twilio, SendGrid, Trello, Jira, Linear, Asana, Webhooks.', tag: 'feature', link: '/integrations' },
  { date: '2026-03-17', title: 'Bounty System', description: 'Users can post tool requests with credit rewards. Creators submit tools to fulfill bounties.', tag: 'feature', link: '/bounties' },
  { date: '2026-03-17', title: 'Custom Domain Support', description: 'Creators can register custom domains for their storefronts. Middleware lookups route to creator profiles.', tag: 'feature' },
  { date: '2026-03-17', title: 'Multi-Action Tools', description: 'Tools can now define multiple actions. Pipeline runner selects action by input._actionId.', tag: 'feature' },
  { date: '2026-03-17', title: 'Tool Versioning', description: 'Auto-snapshot config on publish. Version history API with rollback support.', tag: 'feature' },
  { date: '2026-03-17', title: 'Embeddable Widget', description: 'embed.js script for external sites. Auto-resize iframe with PostMessage communication.', tag: 'feature' },
  { date: '2026-03-17', title: 'Shareable Execution OG Images', description: '/api/og/execution/[id] generates social cards for tool results.', tag: 'feature' },
  { date: '2026-03-17', title: 'Stateful Tools', description: 'tool_user_data API + data_store pipeline step. Tools can remember data between runs.', tag: 'feature' },
  { date: '2026-03-17', title: 'Subscription + License Pricing', description: 'subscription and one_time pricing models implemented. Subscribe/purchase API endpoints.', tag: 'feature' },
  { date: '2026-03-17', title: 'Streaming LLM Output', description: 'Token-by-token streaming via SSE. Live markdown rendering while AI generates.', tag: 'feature' },
  { date: '2026-03-17', title: 'Creator Level Auto-Advancement', description: 'Creators auto-promote (bronze→silver→gold→platinum) based on monthly execution count.', tag: 'feature' },
  { date: '2026-03-17', title: '"More by This Creator"', description: 'Tool detail pages show other tools by the same creator with link to their storefront.', tag: 'improvement' },
  { date: '2026-03-17', title: 'Playground Mode', description: 'Guests can try free tools without signup. 3 runs/day with signup CTA.', tag: 'feature' },
  { date: '2026-03-17', title: 'Review Submission System', description: 'Interactive star rating picker and comment form on tool detail pages.', tag: 'feature' },
  { date: '2026-03-17', title: 'Follow System', description: 'Follow/unfollow creators with follower count on storefronts.', tag: 'feature' },
  { date: '2026-03-17', title: 'Markdown Tool Output', description: 'Tool results rendered with ReactMarkdown + remark-gfm for rich formatting.', tag: 'improvement' },
  { date: '2026-03-17', title: 'Marketplace UX Polish', description: 'Category emojis, "Free" pricing badge, sorting dropdown, search results count.', tag: 'improvement' },
  { date: '2026-03-17', title: 'PWA + SEO Foundation', description: 'manifest.json, OpenGraph/Twitter meta tags, dynamic sitemap with 200+ URLs.', tag: 'improvement' },
];

const tagColors: Record<string, string> = {
  feature: 'bg-blue-100 text-blue-700',
  improvement: 'bg-emerald-100 text-emerald-700',
  fix: 'bg-amber-100 text-amber-700',
  content: 'bg-purple-100 text-purple-700',
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary">Changelog</h1>
          <p className="mt-3 text-muted-foreground">
            Everything we&apos;ve shipped. We build fast and ship daily.
          </p>
          <p className="mt-2 text-sm text-accent font-medium">
            {entries.length} updates shipped
          </p>
        </div>

        <div className="space-y-6">
          {entries.map((entry, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-accent mt-1.5" />
                {i < entries.length - 1 && <div className="flex-1 w-px bg-border mt-2" />}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${tagColors[entry.tag]}`}>
                    {entry.tag}
                  </span>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <h3 className="mt-1 text-sm font-semibold text-foreground">
                  {entry.link ? (
                    <Link href={entry.link} className="hover:text-accent transition-colors">{entry.title}</Link>
                  ) : (
                    entry.title
                  )}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{entry.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
