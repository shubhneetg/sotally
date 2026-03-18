export interface NicheExampleApp {
  name: string;
  description: string;
  screenshot: string;
}

export interface NicheTestimonial {
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

export interface NicheLandingContent {
  slug: string;
  heroHeadline: string;
  heroSubheadline: string;
  exampleApps: NicheExampleApp[];
  testimonial: NicheTestimonial;
  ctaText: string;
}

export const NICHE_LANDING: Record<string, NicheLandingContent> = {
  wellness: {
    slug: 'wellness',
    heroHeadline: 'Build wellness apps your clients will love',
    heroSubheadline: 'Create meditation timers, habit trackers, and mindfulness tools in minutes — no coding required.',
    exampleApps: [
      {
        name: 'Guided Breathing Timer',
        description: 'A calming breathing exercise app with customizable patterns for box breathing, 4-7-8, and more.',
        screenshot: '/images/niches/wellness-breathing.png',
      },
      {
        name: 'Daily Gratitude Journal',
        description: 'Interactive journaling tool that prompts clients with reflection questions and tracks gratitude streaks.',
        screenshot: '/images/niches/wellness-gratitude.png',
      },
      {
        name: 'Sleep Hygiene Checklist',
        description: 'Personalized bedtime routine builder with science-backed tips and nightly score tracking.',
        screenshot: '/images/niches/wellness-sleep.png',
      },
    ],
    testimonial: {
      name: 'Priya Sharma',
      role: 'Certified Wellness Coach',
      quote: 'I built a full mindfulness toolkit for my clients in one afternoon. They use it daily now and engagement has never been higher.',
      avatar: '/images/avatars/priya.jpg',
    },
    ctaText: 'Create your wellness app',
  },
  astrology: {
    slug: 'astrology',
    heroHeadline: 'Turn cosmic wisdom into interactive experiences',
    heroSubheadline: 'Build birth chart interpreters, tarot readers, and moon phase trackers that keep your community engaged.',
    exampleApps: [
      {
        name: 'Birth Chart Calculator',
        description: 'Enter birth details and get a personalized natal chart breakdown with house and planet interpretations.',
        screenshot: '/images/niches/astro-chart.png',
      },
      {
        name: 'Daily Tarot Pull',
        description: 'A one-card, three-card, or Celtic Cross spread generator with detailed card meanings and journaling prompts.',
        screenshot: '/images/niches/astro-tarot.png',
      },
      {
        name: 'Moon Phase Tracker',
        description: 'Shows current moon phase with rituals, affirmations, and journaling prompts for each lunar stage.',
        screenshot: '/images/niches/astro-moon.png',
      },
    ],
    testimonial: {
      name: 'Luna Martinez',
      role: 'Astrologer & Content Creator',
      quote: 'My tarot app gets more engagement than any Instagram post I have ever made. My followers come back to it every single day.',
      avatar: '/images/avatars/luna.jpg',
    },
    ctaText: 'Create your astrology app',
  },
  fitness: {
    slug: 'fitness',
    heroHeadline: 'Empower your clients with custom fitness apps',
    heroSubheadline: 'Build workout generators, macro calculators, and progress trackers that keep clients accountable between sessions.',
    exampleApps: [
      {
        name: 'Custom Workout Builder',
        description: 'Generate personalized workout plans based on goals, equipment, and fitness level with rest timers built in.',
        screenshot: '/images/niches/fitness-workout.png',
      },
      {
        name: 'Macro Calculator',
        description: 'Calculate daily macros based on body stats and goals, with meal suggestions and portion guidance.',
        screenshot: '/images/niches/fitness-macros.png',
      },
      {
        name: '1RM & PR Tracker',
        description: 'Log personal records, estimate one-rep maxes, and visualize strength progression over time.',
        screenshot: '/images/niches/fitness-tracker.png',
      },
    ],
    testimonial: {
      name: 'Marcus Johnson',
      role: 'Online Fitness Coach',
      quote: 'I replaced three paid apps with tools I built myself on Sotally. My clients get a better experience and I keep full control.',
      avatar: '/images/avatars/marcus.jpg',
    },
    ctaText: 'Create your fitness app',
  },
  education: {
    slug: 'education',
    heroHeadline: 'Make learning interactive and unforgettable',
    heroSubheadline: 'Create quizzes, flashcard sets, and study planners that transform how your students learn.',
    exampleApps: [
      {
        name: 'AI Quiz Generator',
        description: 'Paste any text and generate multiple-choice quizzes with explanations — perfect for exam prep.',
        screenshot: '/images/niches/edu-quiz.png',
      },
      {
        name: 'Spaced Repetition Flashcards',
        description: 'Smart flashcard system that schedules reviews based on how well students remember each card.',
        screenshot: '/images/niches/edu-flashcards.png',
      },
      {
        name: 'Study Planner',
        description: 'Break down any syllabus into a daily study schedule with Pomodoro timers and progress tracking.',
        screenshot: '/images/niches/edu-planner.png',
      },
    ],
    testimonial: {
      name: 'Dr. Sarah Chen',
      role: 'University Lecturer',
      quote: 'My students scored 15% higher on finals after using the quiz tools I built. Interactive learning really works.',
      avatar: '/images/avatars/sarah.jpg',
    },
    ctaText: 'Create your education app',
  },
  finance: {
    slug: 'finance',
    heroHeadline: 'Help your clients take control of their money',
    heroSubheadline: 'Build budget planners, investment calculators, and debt payoff tools that deliver real financial clarity.',
    exampleApps: [
      {
        name: '50/30/20 Budget Planner',
        description: 'Categorize income into needs, wants, and savings with visual breakdowns and monthly tracking.',
        screenshot: '/images/niches/finance-budget.png',
      },
      {
        name: 'Compound Interest Calculator',
        description: 'Visualize long-term investment growth with adjustable contributions, rates, and time horizons.',
        screenshot: '/images/niches/finance-compound.png',
      },
      {
        name: 'Debt Snowball Tracker',
        description: 'Plan debt payoff using snowball or avalanche methods with progress visualization and milestone celebrations.',
        screenshot: '/images/niches/finance-debt.png',
      },
    ],
    testimonial: {
      name: 'James Wright',
      role: 'Certified Financial Planner',
      quote: 'My clients use the budget planner between our sessions. It keeps them engaged and makes our meetings way more productive.',
      avatar: '/images/avatars/james.jpg',
    },
    ctaText: 'Create your finance app',
  },
  nutrition: {
    slug: 'nutrition',
    heroHeadline: 'Nutrition tools your clients will actually use',
    heroSubheadline: 'Build meal planners, food trackers, and dietary calculators that support healthy habits every day.',
    exampleApps: [
      {
        name: 'Weekly Meal Planner',
        description: 'Generate balanced meal plans based on dietary preferences, allergies, and calorie targets with a grocery list.',
        screenshot: '/images/niches/nutrition-meals.png',
      },
      {
        name: 'Food Diary',
        description: 'Simple daily food logging with automatic macro estimates and hydration tracking.',
        screenshot: '/images/niches/nutrition-diary.png',
      },
      {
        name: 'Recipe Nutrition Analyzer',
        description: 'Enter ingredients and portions to get a full nutritional breakdown with micronutrient details.',
        screenshot: '/images/niches/nutrition-recipe.png',
      },
    ],
    testimonial: {
      name: 'Emma Rodriguez',
      role: 'Registered Dietitian',
      quote: 'I created a meal planner that generates shopping lists. My clients say it saves them two hours every week.',
      avatar: '/images/avatars/emma.jpg',
    },
    ctaText: 'Create your nutrition app',
  },
  parenting: {
    slug: 'parenting',
    heroHeadline: 'Tools that make parenting a little bit easier',
    heroSubheadline: 'Create chore charts, milestone trackers, and family organizers that families will use every day.',
    exampleApps: [
      {
        name: 'Age-Based Milestone Tracker',
        description: 'Track developmental milestones from newborn to school age with expert guidance and celebration badges.',
        screenshot: '/images/niches/parent-milestones.png',
      },
      {
        name: 'Chore Chart & Rewards',
        description: 'Gamified chore tracking with point systems, streaks, and rewards that motivate kids to help out.',
        screenshot: '/images/niches/parent-chores.png',
      },
      {
        name: 'Screen Time Calculator',
        description: 'Set age-appropriate screen time limits, track usage, and suggest offline activity alternatives.',
        screenshot: '/images/niches/parent-screen.png',
      },
    ],
    testimonial: {
      name: 'Lisa Park',
      role: 'Parenting Coach & Author',
      quote: 'The chore chart app went viral in my Facebook group. Over 500 families use it now and it practically runs itself.',
      avatar: '/images/avatars/lisa.jpg',
    },
    ctaText: 'Create your parenting app',
  },
  language: {
    slug: 'language',
    heroHeadline: 'Language learning tools that stick',
    heroSubheadline: 'Build vocabulary quizzers, grammar drills, and conversation practice tools that accelerate fluency.',
    exampleApps: [
      {
        name: 'Vocabulary Flashcard Deck',
        description: 'Curated word lists by topic and level with audio pronunciation, example sentences, and spaced repetition.',
        screenshot: '/images/niches/lang-vocab.png',
      },
      {
        name: 'Conjugation Drill',
        description: 'Interactive verb conjugation practice with timed challenges, difficulty scaling, and progress reports.',
        screenshot: '/images/niches/lang-conjugation.png',
      },
      {
        name: 'Conversation Scenario Builder',
        description: 'Role-play common real-world scenarios like ordering food or booking a hotel with guided dialogue prompts.',
        screenshot: '/images/niches/lang-conversation.png',
      },
    ],
    testimonial: {
      name: 'Ana Torres',
      role: 'Spanish Teacher & Polyglot',
      quote: 'My students practice vocabulary on the app between classes. Their retention improved dramatically within the first month.',
      avatar: '/images/avatars/ana.jpg',
    },
    ctaText: 'Create your language app',
  },
  business: {
    slug: 'business',
    heroHeadline: 'Give your clients the tools to grow their business',
    heroSubheadline: 'Build pricing calculators, proposal generators, and ROI tools that help entrepreneurs make better decisions.',
    exampleApps: [
      {
        name: 'Pricing Strategy Calculator',
        description: 'Calculate optimal pricing based on costs, market positioning, and profit margin targets with scenario comparison.',
        screenshot: '/images/niches/biz-pricing.png',
      },
      {
        name: 'Business Model Canvas',
        description: 'Interactive canvas tool for mapping out value propositions, customer segments, and revenue streams.',
        screenshot: '/images/niches/biz-canvas.png',
      },
      {
        name: 'ROI Calculator',
        description: 'Project return on investment for marketing campaigns, hiring decisions, or equipment purchases.',
        screenshot: '/images/niches/biz-roi.png',
      },
    ],
    testimonial: {
      name: 'David Kim',
      role: 'Small Business Consultant',
      quote: 'The pricing calculator alone has helped my clients increase margins by 20%. It pays for itself in one session.',
      avatar: '/images/avatars/david.jpg',
    },
    ctaText: 'Create your business app',
  },
  'real-estate': {
    slug: 'real-estate',
    heroHeadline: 'Stand out with interactive real estate tools',
    heroSubheadline: 'Build mortgage calculators, property analyzers, and market comparison tools that impress clients and close deals.',
    exampleApps: [
      {
        name: 'Mortgage Affordability Calculator',
        description: 'Estimate monthly payments with adjustable rates, down payments, and tax/insurance breakdowns.',
        screenshot: '/images/niches/re-mortgage.png',
      },
      {
        name: 'Rent vs Buy Analyzer',
        description: 'Compare the true cost of renting versus buying over 5, 10, and 30-year periods with market appreciation.',
        screenshot: '/images/niches/re-rentvbuy.png',
      },
      {
        name: 'Open House Lead Capture',
        description: 'Digital sign-in form that captures visitor info, preferences, and budget, then sends automated follow-ups.',
        screenshot: '/images/niches/re-openhouse.png',
      },
    ],
    testimonial: {
      name: 'Rachel Adams',
      role: 'Real Estate Agent',
      quote: 'I embed the mortgage calculator on my listings. Buyers engage with it for an average of 4 minutes — that is incredible dwell time.',
      avatar: '/images/avatars/rachel.jpg',
    },
    ctaText: 'Create your real estate app',
  },
};
