import type { NicheConfig } from '../types/v2';

// ─── V2 App Status Enum ─────────────────────────────────────────────────────

export const AppStatusEnum = {
  GENERATING: 'generating',
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNLISTED: 'unlisted',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived',
} as const;

export const GenerationStatusEnum = {
  QUEUED: 'queued',
  PARSING: 'parsing',
  ARCHITECTING: 'architecting',
  GENERATING: 'generating',
  VALIDATING: 'validating',
  BUILDING: 'building',
  DEPLOYING: 'deploying',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const;

// ─── V2 Platform Tiers ──────────────────────────────────────────────────────

export interface PlatformTier {
  id: string;
  name: string;
  priceMonthly: number;
  maxApps: number;
  maxGenerationsPerMonth: number;
  maxEndUsersPerMonth: number;
  customDomain: boolean;
  removeBadge: boolean;
  transactionFeePercent: number;
}

export const PLATFORM_TIERS: readonly PlatformTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    maxApps: 3,
    maxGenerationsPerMonth: 20,
    maxEndUsersPerMonth: 100,
    customDomain: false,
    removeBadge: false,
    transactionFeePercent: 20,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 1900, // cents
    maxApps: 25,
    maxGenerationsPerMonth: 200,
    maxEndUsersPerMonth: 10_000,
    customDomain: true,
    removeBadge: true,
    transactionFeePercent: 15,
  },
  {
    id: 'business',
    name: 'Business',
    priceMonthly: 4900, // cents
    maxApps: -1, // unlimited
    maxGenerationsPerMonth: -1, // unlimited
    maxEndUsersPerMonth: -1, // unlimited
    customDomain: true,
    removeBadge: true,
    transactionFeePercent: 12,
  },
] as const;

// ─── V2 Creator Revenue Split ───────────────────────────────────────────────

export const V2_CREATOR_REVENUE_SHARE_PERCENT = 85;
export const V2_PLATFORM_FEE_PERCENT = 15;

// ─── V2 Generation Costs (in credits) ───────────────────────────────────────

export const GENERATION_CREDITS = {
  INITIAL: 10,
  ITERATE: 5,
  FIX_BUG: 3,
  ADD_FEATURE: 8,
  RESTYLE: 3,
} as const;

// ─── V2 Limits ──────────────────────────────────────────────────────────────

export const MAX_PROMPT_LENGTH = 2000;
export const MAX_BIO_LENGTH = 500;
export const MAX_APP_DESCRIPTION_LENGTH = 500;
export const MAX_BUNDLE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_APP_DATA_VALUE_BYTES = 100 * 1024; // 100KB per value
export const MAX_APP_DATA_KEYS_PER_USER = 1000;
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 30;

// ─── V2 Reserved Slugs ─────────────────────────────────────────────────────

export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'www', 'help', 'support', 'about', 'blog',
  'docs', 'legal', 'terms', 'privacy', 'settings', 'dashboard', 'create',
  'studio', 'onboarding', 'explore', 'search', 'pricing', 'changelog',
  'status', 'health', 'webhooks', 'embed', 'cdn', 'static', 'assets',
  'auth', 'login', 'signup', 'register', 'logout', 'forgot', 'reset',
  'storefront', 'creators', 'apps', 'marketplace', 'discover',
]);

// ─── V2 Niches ──────────────────────────────────────────────────────────────

export const NICHES: readonly NicheConfig[] = [
  {
    slug: 'wellness',
    displayName: 'Wellness Coaches',
    shortName: 'Wellness',
    description: 'Build apps for mindfulness, meditation, and mental health',
    icon: '🧘',
    color: '#6EE7B7',
    examplePrompts: [
      'A meditation timer with ambient sounds and session history',
      'A mood tracker that shows weekly patterns as a chart',
      'A habit tracker for my 30-day wellness challenge',
      'A breathwork guide with animated breathing circles',
      'A gratitude journal with weekly theme summaries',
    ],
    creatorNoun: 'coach',
    audienceNoun: 'clients',
  },
  {
    slug: 'astrology',
    displayName: 'Astrologers & Spiritual Guides',
    shortName: 'Astrology',
    description: 'Build apps for birth charts, tarot, numerology, and moon phases',
    icon: '🔮',
    color: '#A78BFA',
    examplePrompts: [
      'A birth chart generator that shows sun, moon, and rising signs',
      'A daily tarot card pull with upright and reversed meanings',
      'A compatibility checker using both partners birth dates',
      'A moon phase tracker with journaling prompts',
      'A numerology life path calculator',
    ],
    creatorNoun: 'guide',
    audienceNoun: 'seekers',
  },
  {
    slug: 'fitness',
    displayName: 'Fitness Trainers',
    shortName: 'Fitness',
    description: 'Build workout generators, macro calculators, and progress trackers',
    icon: '💪',
    color: '#60A5FA',
    examplePrompts: [
      'A workout plan generator based on goals and available equipment',
      'A macro calculator with meal timing suggestions',
      'A one-rep max calculator with percentage loading charts',
      'A water intake tracker with daily progress animation',
      'A progress photo tracker with side-by-side comparison',
    ],
    creatorNoun: 'trainer',
    audienceNoun: 'clients',
  },
  {
    slug: 'education',
    displayName: 'Educators & Tutors',
    shortName: 'Education',
    description: 'Build quizzes, flashcards, study planners, and interactive lessons',
    icon: '📚',
    color: '#FBBF24',
    examplePrompts: [
      'A quiz app with randomized problems and score tracking',
      'A flashcard app with spaced repetition',
      'A study planner that generates a schedule from exam dates',
      'An interactive physics simulator for projectile motion',
      'A unit converter for all science units',
    ],
    creatorNoun: 'teacher',
    audienceNoun: 'students',
  },
  {
    slug: 'finance',
    displayName: 'Personal Finance Coaches',
    shortName: 'Finance',
    description: 'Build budget trackers, calculators, and financial planning tools',
    icon: '💰',
    color: '#34D399',
    examplePrompts: [
      'A monthly budget tracker with pie chart breakdown',
      'A debt snowball calculator showing payoff timeline',
      'A savings goal tracker with visual progress bar',
      'An emergency fund calculator based on personal situation',
      'A should-I-buy-this decision tool using work-hours math',
    ],
    creatorNoun: 'coach',
    audienceNoun: 'clients',
  },
  {
    slug: 'nutrition',
    displayName: 'Nutritionists & Dietitians',
    shortName: 'Nutrition',
    description: 'Build meal planners, food trackers, and dietary tools',
    icon: '🥗',
    color: '#4ADE80',
    examplePrompts: [
      'A meal planner with dietary restriction filters',
      'A food and symptom diary with correlation analysis',
      'A protein intake calculator with food examples',
      'A grocery list builder organized by store section',
      'A recipe cost per serving calculator',
    ],
    creatorNoun: 'nutritionist',
    audienceNoun: 'clients',
  },
  {
    slug: 'parenting',
    displayName: 'Parenting Coaches',
    shortName: 'Parenting',
    description: 'Build chore trackers, milestone tools, and family organizers',
    icon: '👶',
    color: '#F9A8D4',
    examplePrompts: [
      'A chore tracker for kids with visual completion board',
      'A screen time planner based on child age guidelines',
      'A bedtime routine builder with printable sequence cards',
      'A developmental milestone tracker for ages 0-5',
      'A boredom buster activity generator',
    ],
    creatorNoun: 'coach',
    audienceNoun: 'parents',
  },
  {
    slug: 'language',
    displayName: 'Language Teachers',
    shortName: 'Language',
    description: 'Build vocabulary apps, quizzers, and conversation practice tools',
    icon: '🌍',
    color: '#38BDF8',
    examplePrompts: [
      'A vocabulary flashcard app with spaced repetition',
      'A verb conjugation quizzer with instant feedback',
      'A daily phrase generator with word breakdowns',
      'A conversation simulator with multiple choice responses',
      'A kanji practice tool with stroke tracing',
    ],
    creatorNoun: 'teacher',
    audienceNoun: 'learners',
  },
  {
    slug: 'business',
    displayName: 'Small Business Coaches',
    shortName: 'Business',
    description: 'Build pricing calculators, invoicing tools, and client managers',
    icon: '💼',
    color: '#FB923C',
    examplePrompts: [
      'A freelancer pricing calculator based on income goals',
      'A simple invoice generator with PDF export',
      'A client CRM with follow-up reminders',
      'A proposal builder from project details',
      'A profit margin calculator for product businesses',
    ],
    creatorNoun: 'coach',
    audienceNoun: 'entrepreneurs',
  },
  {
    slug: 'real-estate',
    displayName: 'Real Estate Agents',
    shortName: 'Real Estate',
    description: 'Build mortgage calculators, property analyzers, and market tools',
    icon: '🏠',
    color: '#818CF8',
    examplePrompts: [
      'A mortgage calculator with full PITI breakdown',
      'A rental property analyzer with cash-on-cash return',
      'A closing cost estimator for buyers',
      'A side-by-side property comparison tool',
      'An agent commission calculator with splits',
    ],
    creatorNoun: 'agent',
    audienceNoun: 'clients',
  },
  {
    slug: 'content',
    displayName: 'Content Creators',
    shortName: 'Content',
    description: 'Build content planners, analytics tools, and growth calculators',
    icon: '🎬',
    color: '#F472B6',
    examplePrompts: [
      'A YouTube thumbnail A/B tester with voting',
      'A 30-day content calendar generator',
      'A sponsorship rate calculator for creators',
      'A channel analytics dashboard from manual stats',
      'A video title and thumbnail idea generator',
    ],
    creatorNoun: 'creator',
    audienceNoun: 'audience',
  },
  {
    slug: 'design',
    displayName: 'Creative Freelancers',
    shortName: 'Design',
    description: 'Build color palettes, brand tools, and design utilities',
    icon: '🎨',
    color: '#E879F9',
    examplePrompts: [
      'A color palette generator based on mood and base color',
      'A font pairing tool for different industries',
      'A brand style quiz that reveals your brand archetype',
      'A social media post template maker',
      'A logo concept direction generator',
    ],
    creatorNoun: 'designer',
    audienceNoun: 'clients',
  },
] as const;
