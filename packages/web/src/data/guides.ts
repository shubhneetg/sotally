export interface GuideUseCase {
  title: string;
  problem: string;
  solution: string;
  steps: string[];
  tools: string[];
  result: string;
}

export interface GuidePersona {
  name: string;
  role: string;
  company: string;
  avatar: string;
  story: string;
  quote: string;
}

export interface GuideFAQ {
  question: string;
  answer: string;
}

export interface Guide {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  persona: GuidePersona;
  introduction: string;
  useCases: GuideUseCase[];
  gettingStarted: string[];
  relatedIntegrations: string[];
  relatedGuides: string[];
  faq: GuideFAQ[];
  seoTitle: string;
  seoDescription: string;
}

export const GUIDES: Guide[] = [
  // ━━━ 1. DEVELOPMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'development', slug: 'development',
    title: 'AI Tools for Developers',
    subtitle: 'Automate code reviews, generate documentation, and ship faster with AI-powered developer tools.',
    icon: '💻', color: '#333',
    persona: {
      name: 'Alex Kumar', role: 'Senior Developer', company: 'at a SaaS startup',
      avatar: 'AK',
      story: 'Alex leads a team of 5 developers building a B2B SaaS product. Code reviews were eating 2 hours of his day — every PR needed careful review for bugs, security issues, and code style. Documentation was always outdated because nobody had time to write it. Git commit messages were inconsistent, and regex patterns took forever to debug.\n\nAfter discovering Sotally, Alex set up AI-powered tools that transformed his workflow. PR reviews now happen automatically — AI catches bugs and security vulnerabilities before human review. Documentation generates itself from source code. Even regex patterns get explained in plain English.',
      quote: 'What used to take me 2 hours of PR review now takes 15 minutes. AI catches things I\'d miss at the end of a long day.',
    },
    introduction: 'Software development is full of repetitive tasks that slow you down — reviewing code, writing docs, debugging regex, crafting commit messages. AI excels at exactly these tasks. On Sotally, you\'ll find developer tools that integrate with GitHub, Jira, and Linear to automate the tedious parts of your workflow, so you can focus on building features.',
    useCases: [
      {
        title: 'Automated PR Code Review',
        problem: 'Every pull request needs review for bugs, security issues, and code style. Manual reviews are slow, inconsistent, and often miss subtle issues — especially at the end of a long sprint.',
        solution: 'An AI-powered PR reviewer that reads your diff, identifies potential bugs, security vulnerabilities (SQL injection, XSS, exposed secrets), and code style issues, then posts a detailed review comment directly on the GitHub PR.',
        steps: ['Connect your GitHub account in Settings > Connections', 'Find "AI PR Reviewer" in the marketplace', 'Paste your PR URL or repository + PR number', 'AI analyzes the diff and generates a comprehensive review', 'Review is posted as a GitHub PR comment automatically'],
        tools: ['pr-review-assistant', 'code-quality-analyzer'],
        result: 'Reviews that took 30-60 minutes now complete in under 2 minutes. AI catches SQL injection, password exposure, and missing error handling that human reviewers often miss.',
      },
      {
        title: 'Code Documentation Generator',
        problem: 'Documentation is always the last priority. README files are outdated, function docs are missing, and new team members struggle to understand the codebase.',
        solution: 'Point an AI tool at your repository file — it reads the code, understands the logic, and generates comprehensive documentation including function descriptions, parameter explanations, and usage examples.',
        steps: ['Select the "Code Documenter" tool', 'Provide the repository owner, repo name, and file path', 'AI reads the file via GitHub API and analyzes the code', 'Generates markdown documentation with examples', 'Copy the docs or have it create a PR with the documentation'],
        tools: ['api-documentation-generator'],
        result: 'Complete API documentation generated in seconds. New team members onboard 3x faster with always-up-to-date docs.',
      },
      {
        title: 'Smart Git Commit Messages',
        problem: 'Commit messages like "fix stuff" and "wip" make git history useless. Writing good commit messages takes thought and discipline.',
        solution: 'Paste your diff or describe your changes — AI generates a conventional commit message following your team\'s format (conventional commits, gitmoji, etc.).',
        steps: ['Open the "Git Commit Writer" tool', 'Paste your diff or describe what you changed', 'Select your format preference (conventional, gitmoji, descriptive)', 'AI generates a clear, descriptive commit message', 'Copy and use in your git commit'],
        tools: ['git-commit-message-generator'],
        result: 'Consistent, descriptive commit messages across the entire team. Git history becomes a useful changelog.',
      },
      {
        title: 'Regex Pattern Builder',
        problem: 'Writing and debugging regex is painful. Complex patterns are hard to read, and small mistakes cause silent failures.',
        solution: 'Describe what you want to match in plain English — AI generates the regex pattern, explains each part, and provides test cases.',
        steps: ['Open the "Regex Generator" tool', 'Describe your pattern: "Match email addresses" or "Extract URLs from text"', 'AI generates the regex with explanation of each component', 'Test cases are provided to verify the pattern', 'Copy the regex into your code'],
        tools: ['regex-pattern-generator'],
        result: 'Regex patterns in seconds instead of 20 minutes of trial and error. Fully explained so you understand what each part does.',
      },
    ],
    gettingStarted: [
      'Create your Sotally account — you get 50 free credits instantly',
      'Connect your GitHub account in Settings > Connections (paste your Personal Access Token)',
      'Browse Development tools in the marketplace (filter by Development category)',
      'Try the PR Review tool on one of your open pull requests',
      'If you love it, build your own developer tools with the no-code builder',
    ],
    relatedIntegrations: ['github', 'jira', 'linear', 'sentry', 'gitlab'],
    relatedGuides: ['productivity', 'getting-started', 'creators'],
    faq: [
      { question: 'Is AI code review accurate enough for production use?', answer: 'AI code review is a supplement, not a replacement for human review. It catches common bugs, security issues, and style problems with high accuracy — but you should still have a human reviewer approve the PR. Think of it as a thorough first pass that catches issues before your team even looks at it.' },
      { question: 'Does AI see my private code?', answer: 'Your code is processed during the tool execution and not stored permanently. Execution data is retained for 90 days for your history, then deleted. Your GitHub token is encrypted with AES-256 and never exposed to tool creators.' },
      { question: 'Can I use AI tools with GitLab or Bitbucket?', answer: 'GitHub is our first-supported platform with a native connector. GitLab and Bitbucket are coming soon. In the meantime, you can use the Webhook connector to integrate with any Git platform\'s API.' },
      { question: 'How much do developer tools cost?', answer: 'Most developer tools cost 3-10 credits per run (~$0.09-$0.30). You get 50 free credits on signup, enough to try 5-15 tools. Credits never expire.' },
    ],
    seoTitle: 'AI Tools for Developers — Automate Code Reviews, Docs & More | Sotally',
    seoDescription: 'Discover AI-powered developer tools on Sotally. Automate PR reviews, generate documentation, write commit messages, and build regex patterns. Pay per use, no subscription.',
  },

  // ━━━ 2. MARKETING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'marketing', slug: 'marketing',
    title: 'AI Marketing Tools',
    subtitle: 'Generate campaigns, analyze competitors, and scale your content with AI-powered marketing automation.',
    icon: '📈', color: '#FF6B35',
    persona: {
      name: 'James Rodriguez', role: 'Marketing Manager', company: 'at a D2C brand',
      avatar: 'JR',
      story: 'James manages marketing for a growing D2C skincare brand. He\'s responsible for social media across 4 platforms, email campaigns, competitor monitoring, and content strategy — all with a team of two. The content treadmill was burning them out: 20 social posts per week, 2 email campaigns, and constant competitor analysis.\n\nSotally\'s marketing tools changed the game. AI generates social media calendars in minutes, writes email campaigns that match the brand voice, and monitors competitor ads automatically. James went from working 60-hour weeks to 45 — and content quality actually improved.',
      quote: 'We went from spending 3 days on our social calendar to 30 minutes. And engagement is up 40% because the content is more consistent.',
    },
    introduction: 'Marketing teams are drowning in content demands. Every platform needs unique content, every campaign needs copy variations, and competitors never stop. AI marketing tools on Sotally help you produce more content, maintain brand consistency, and analyze your market — all without adding headcount.',
    useCases: [
      {
        title: 'Social Media Content Calendar',
        problem: 'Creating 20+ social posts per week across multiple platforms is exhausting. Content quality drops when you\'re rushing to fill the calendar.',
        solution: 'Describe your brand, target audience, and upcoming promotions — AI generates a full week of platform-optimized social posts with hashtags, hooks, and CTAs.',
        steps: ['Open the "Social Calendar Generator" tool', 'Enter your brand name, voice, and this week\'s focus topics', 'Select platforms (Instagram, Twitter, LinkedIn, Facebook)', 'AI generates 20+ posts with platform-specific formatting', 'Copy to your scheduling tool or post directly via Slack/Buffer'],
        tools: ['social-media-content-calendar'],
        result: 'A full week of social content in 10 minutes instead of 3 days. Posts are tailored to each platform\'s best practices.',
      },
      {
        title: 'Brand Voice Email Campaigns',
        problem: 'Email campaigns need to sound like your brand, not like a robot. Writing unique emails for each segment takes hours.',
        solution: 'Feed the tool your brand guidelines and campaign goal — AI writes complete email campaigns including subject lines, preview text, body copy, and CTAs, all in your brand voice.',
        steps: ['Use the "Brand Voice Email Writer" tool', 'Paste your brand voice guidelines or describe your tone', 'Enter the campaign goal and target segment', 'AI generates 3 subject line variants + full email body', 'Send directly via Mailchimp or SendGrid connector'],
        tools: ['brand-voice-analyzer', 'newsletter-draft-generator'],
        result: 'Email campaigns written in 5 minutes instead of 2 hours. Open rates improved because AI generates better subject line variations.',
      },
      {
        title: 'Competitor Ad Analysis',
        problem: 'You need to know what competitors are running, but manually tracking their ads across platforms is a full-time job.',
        solution: 'Enter competitor names or URLs — AI analyzes their messaging, positioning, offers, and ad creative themes, then generates a competitive intelligence report.',
        steps: ['Open "Competitor Ad Spy" tool', 'Enter 3-5 competitor brand names or websites', 'AI researches their public presence and messaging', 'Generates a detailed competitive analysis report', 'Includes actionable recommendations for differentiation'],
        tools: ['competitor-ad-spy'],
        result: 'Competitive intelligence that would take a week of manual research, delivered in 2 minutes.',
      },
    ],
    gettingStarted: [
      'Sign up and get 50 free credits — enough to generate several campaigns',
      'Connect Mailchimp or SendGrid for direct email sending',
      'Connect Slack to receive generated content in your marketing channel',
      'Try the Social Calendar tool with your brand details',
      'Build custom marketing tools tailored to your brand with the tool builder',
    ],
    relatedIntegrations: ['mailchimp', 'sendgrid', 'hubspot', 'slack', 'twitter', 'buffer'],
    relatedGuides: ['writing', 'creative', 'getting-started'],
    faq: [
      { question: 'Will AI content sound generic?', answer: 'Not if you provide your brand voice guidelines. Sotally tools let you input your tone, style, and key messaging — AI generates content that matches your brand identity. The more context you provide, the more on-brand the output.' },
      { question: 'Can AI write emails that actually convert?', answer: 'AI-generated emails consistently match or outperform human-written emails in A/B tests, especially for subject lines and CTAs. The key is providing clear goals and audience context.' },
      { question: 'How does this compare to ChatGPT?', answer: 'ChatGPT is a general-purpose chatbot. Sotally tools are purpose-built for specific marketing tasks — they\'re pre-configured with the right prompts, output formats, and can connect directly to your email/social platforms via connectors.' },
    ],
    seoTitle: 'AI Marketing Tools — Generate Campaigns, Analyze Competitors | Sotally',
    seoDescription: 'Scale your marketing with AI tools on Sotally. Generate social media calendars, write email campaigns, analyze competitors. Pay per use, no subscription needed.',
  },

  // ━━━ 3. WRITING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'writing', slug: 'writing',
    title: 'AI Writing Tools',
    subtitle: 'Craft compelling content — from blog posts to newsletters — with AI that adapts to your voice.',
    icon: '✍️', color: '#8B5CF6',
    persona: {
      name: 'Lisa Chen', role: 'Content Writer', company: 'freelance for tech companies',
      avatar: 'LC',
      story: 'Lisa is a freelance content writer serving 5 tech clients simultaneously. Each client needs a different voice, different formats, and different publishing cadence. She was spending more time on research and outlining than actual writing — and writer\'s block hit harder when juggling multiple brands.\n\nSotally\'s writing tools gave Lisa superpowers. AI generates story hooks that grab attention, repurposes long-form content into social posts, and drafts newsletters from bullet points. Lisa now takes on 2 more clients without working longer hours.',
      quote: 'I used to stare at a blank page for an hour. Now I feed my notes to AI and have a solid first draft in minutes.',
    },
    introduction: 'Every writer knows the pain of the blank page. AI writing tools don\'t replace your creativity — they amplify it. Use them to overcome writer\'s block, generate first drafts from notes, repurpose content across formats, and maintain consistency across multiple clients or brands.',
    useCases: [
      {
        title: 'Story Hook Generator',
        problem: 'The opening line determines whether someone reads your entire piece. Coming up with compelling hooks for every article is mentally exhausting.',
        solution: 'Enter your topic and target audience — AI generates 10 unique story hooks using proven frameworks (question, statistic, anecdote, contrarian, etc.).',
        steps: ['Open "Story Hook Generator"', 'Enter your article topic and target reader', 'Select hook styles (question, stat, story, bold claim)', 'AI generates 10 unique hooks', 'Pick your favorite and start writing from there'],
        tools: ['story-hook-generator'],
        result: 'Writer\'s block eliminated. 10 compelling hooks in 30 seconds — just pick and go.',
      },
      {
        title: 'Newsletter Draft from Notes',
        problem: 'You have a week of notes, bookmarks, and ideas but turning them into a polished newsletter takes hours of organizing and writing.',
        solution: 'Dump your raw notes — AI organizes them into a structured newsletter with intro, sections, takeaways, and CTA.',
        steps: ['Open "Newsletter Draft Generator"', 'Paste your raw notes, links, and ideas for this week', 'Select your newsletter tone and format', 'AI structures everything into a polished draft', 'Edit and publish — the hard part (structure) is done'],
        tools: ['newsletter-draft-generator'],
        result: 'Newsletter drafts in 5 minutes instead of 2 hours. Better structure because AI sees patterns in your notes that you miss.',
      },
      {
        title: 'Content Repurposer',
        problem: 'A great blog post could be 5 tweets, a LinkedIn post, an email, and a video script. But repurposing takes almost as long as creating.',
        solution: 'Paste any long-form content — AI breaks it into platform-optimized pieces (tweets, LinkedIn posts, email snippets, video scripts).',
        steps: ['Open "Content Repurposer"', 'Paste your blog post or article', 'Select target formats (Twitter thread, LinkedIn, email, etc.)', 'AI generates optimized versions for each platform', 'Post directly or schedule with your preferred tool'],
        tools: ['content-repurposer'],
        result: 'One blog post becomes 10 pieces of content in 2 minutes. Maximum reach from minimum effort.',
      },
    ],
    gettingStarted: [
      'Create your account — 50 free credits, no credit card needed',
      'Try the Story Hook Generator with your current article topic',
      'Feed your raw notes into the Newsletter Generator',
      'Connect Notion to save AI outputs directly to your workspace',
      'Build custom writing tools fine-tuned to your clients\' brand voices',
    ],
    relatedIntegrations: ['notion', 'google-docs', 'slack'],
    relatedGuides: ['marketing', 'creative', 'getting-started'],
    faq: [
      { question: 'Will Google penalize AI-generated content?', answer: 'Google has stated they focus on content quality, not whether it was AI-generated. Sotally tools generate first drafts that you edit and personalize. The key is adding your expertise, voice, and insights — AI handles the structure and initial draft.' },
      { question: 'Can AI match my writing style?', answer: 'Yes! Many Sotally writing tools accept brand voice guidelines or writing samples. The more context you provide about your style, the more the output sounds like you.' },
      { question: 'Is this different from using ChatGPT directly?', answer: 'Sotally writing tools are pre-optimized for specific tasks. Instead of crafting the perfect prompt every time, you fill in structured fields and get consistently formatted output. Plus, tools can save to Notion or send via email automatically.' },
    ],
    seoTitle: 'AI Writing Tools — Overcome Writer\'s Block, Generate Content | Sotally',
    seoDescription: 'AI writing tools for content creators. Generate story hooks, draft newsletters, repurpose content across platforms. Pay per use on Sotally.',
  },

  // ━━━ 4. DATA ANALYTICS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'data-analytics', slug: 'data-analytics',
    title: 'AI Data Analytics Tools',
    subtitle: 'Analyze data, generate insights, and build dashboards with AI — no complex queries needed.',
    icon: '📊', color: '#0EA5E9',
    persona: {
      name: 'David Park', role: 'Data Analyst', company: 'at an e-commerce company',
      avatar: 'DP',
      story: 'David spends most of his day writing SQL queries, building dashboards, and explaining data to non-technical stakeholders. The hardest part isn\'t the analysis — it\'s translating complex data into insights that executives can act on. Survey design, KPI definitions, and data storytelling take as much time as the actual analysis.\n\nWith Sotally, David uses AI to generate survey questions, explain complex SQL queries in plain English, and create KPI dashboard recommendations. He delivers insights faster and stakeholders actually understand the data.',
      quote: 'AI doesn\'t replace my analysis skills — it handles the tedious parts so I can focus on finding the real insights.',
    },
    introduction: 'Data analysis is powerful but time-consuming. AI tools on Sotally help you work faster at every stage — from designing surveys and defining KPIs to explaining SQL queries and generating reports. Spend less time on mechanics, more time on insights.',
    useCases: [
      {
        title: 'Survey Question Designer', problem: 'Designing unbiased, effective survey questions is a skill. Leading questions, ambiguous wording, and poor scales produce useless data.', solution: 'Describe your research objective — AI generates professional survey questions with proper scales, avoiding common biases.', steps: ['Open "Survey Question Generator"', 'Describe what you want to learn', 'Select question types (Likert, multiple choice, open-ended)', 'AI generates 10-15 research-grade questions', 'Export to your survey tool'], tools: ['survey-question-generator'], result: 'Professional surveys in minutes. Questions follow research methodology best practices.',
      },
      {
        title: 'SQL Query Explainer', problem: 'Complex SQL queries are hard to understand, especially for junior analysts or when reviewing inherited code.', solution: 'Paste any SQL query — AI explains what it does step by step in plain English.', steps: ['Open "SQL Explainer"', 'Paste your SQL query', 'AI breaks down each clause, join, and subquery', 'Explains the logic in plain English', 'Suggests optimizations if applicable'], tools: ['sql-query-explainer'], result: 'Any SQL query understood in seconds. Great for onboarding new analysts or documenting data pipelines.',
      },
      {
        title: 'KPI Dashboard Designer', problem: 'Defining the right KPIs and organizing them into a useful dashboard layout takes research and experience.', solution: 'Describe your business and goals — AI recommends KPIs, defines metrics, and suggests a dashboard layout.', steps: ['Open "KPI Dashboard Generator"', 'Enter your business type and goals', 'AI recommends relevant KPIs with definitions', 'Generates a dashboard layout with metric groupings', 'Export to your BI tool'], tools: ['kpi-dashboard-generator'], result: 'Data-driven dashboard designs in minutes instead of days of stakeholder interviews.',
      },
    ],
    gettingStarted: [
      'Sign up for 50 free credits', 'Try the SQL Explainer with a complex query from your codebase', 'Use the KPI Dashboard Generator for your next dashboard project', 'Connect Google Sheets or Airtable for data import/export', 'Build custom data tools for your specific domain',
    ],
    relatedIntegrations: ['google-sheets', 'airtable', 'supabase', 'notion'],
    relatedGuides: ['development', 'business', 'getting-started'],
    faq: [
      { question: 'Can AI analyze my actual data?', answer: 'Sotally tools currently work best with descriptions and metadata. For security, we recommend describing your data structure rather than pasting raw customer data. Integration with Google Sheets and databases for direct analysis is coming soon.' },
      { question: 'How accurate are AI-generated KPI recommendations?', answer: 'AI recommendations are based on industry best practices and are a strong starting point. Always validate against your specific business context and stakeholder needs.' },
    ],
    seoTitle: 'AI Data Analytics Tools — Surveys, KPIs, SQL Explained | Sotally',
    seoDescription: 'AI tools for data analysts. Design surveys, explain SQL queries, generate KPI dashboards. Pay per use on Sotally — no subscription needed.',
  },

  // ━━━ 5. BUSINESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'business', slug: 'business',
    title: 'AI Business Tools',
    subtitle: 'Generate business plans, OKRs, meeting notes, and strategy frameworks with AI.',
    icon: '💼', color: '#059669',
    persona: {
      name: 'Priya Sharma', role: 'Business Consultant', company: 'independent, serving SMBs',
      avatar: 'PS',
      story: 'Priya consults for 8 small businesses simultaneously. Each client needs business plans, OKRs, strategic frameworks, and meeting summaries. She was spending more time on deliverable creation than actual strategic thinking.\n\nSotally\'s business tools let Priya generate first drafts of business plans, OKR frameworks, and meeting summaries in minutes. She edits and adds her expertise, delivering polished work 3x faster.',
      quote: 'AI handles the template and structure. I add the strategic insight. Together we deliver in hours what used to take days.',
    },
    introduction: 'Business professionals spend too much time on document creation and not enough on strategic thinking. AI business tools on Sotally generate frameworks, plans, and summaries so you can focus on the insights that matter.',
    useCases: [
      { title: 'Business Plan Generator', problem: 'Writing a comprehensive business plan takes weeks. Most of it is structure and formatting, not original thinking.', solution: 'Describe your business idea — AI generates a complete business plan with executive summary, market analysis, revenue model, and financial projections.', steps: ['Open "Business Plan Generator"', 'Enter business name, industry, target market, and revenue model', 'AI generates a comprehensive business plan', 'Edit and customize with your specific data', 'Export or share with stakeholders'], tools: ['business-plan-executive-summary'], result: 'First draft of a business plan in 5 minutes. Edit and refine instead of starting from scratch.' },
      { title: 'OKR Framework Generator', problem: 'Setting good OKRs (Objectives and Key Results) requires understanding the framework and translating vague goals into measurable outcomes.', solution: 'Describe your team and goals — AI generates SMART OKRs with clear objectives, measurable key results, and suggested initiatives.', steps: ['Open "OKR Generator"', 'Enter your team, time period, and strategic goals', 'AI generates 3-5 objectives with 3 key results each', 'Review and adjust metrics to your context', 'Share with team for alignment'], tools: ['okr-generator'], result: 'Professional OKRs in 2 minutes instead of a multi-hour planning session.' },
      { title: 'Meeting Notes Summarizer', problem: 'Meeting notes are messy, action items get lost, and nobody reads the full transcript.', solution: 'Paste raw meeting notes or transcript — AI generates a structured summary with decisions, action items, and owners.', steps: ['Open "Meeting Notes Processor"', 'Paste your raw notes or transcript', 'AI identifies decisions, action items, and key points', 'Generates a structured summary', 'Send to Slack or Notion automatically'], tools: ['meeting-notes-summarizer'], result: 'Clear, actionable meeting summaries in 30 seconds. No more lost action items.' },
    ],
    gettingStarted: ['Sign up with 50 free credits', 'Try the Business Plan Generator with your next project', 'Connect Notion to save outputs directly', 'Connect Slack to share summaries with your team', 'Build custom business tools for your consulting practice'],
    relatedIntegrations: ['notion', 'slack', 'google-docs'],
    relatedGuides: ['productivity', 'finance', 'getting-started'],
    faq: [
      { question: 'Are AI business plans good enough for investors?', answer: 'AI generates a solid first draft with proper structure. You should always add your specific market data, financial projections, and competitive insights. Think of it as a framework that saves 80% of the writing time.' },
      { question: 'Can AI understand my specific industry?', answer: 'Yes. Sotally tools accept detailed context about your industry, market, and business model. The more specific you are, the more relevant the output.' },
    ],
    seoTitle: 'AI Business Tools — Plans, OKRs, Meeting Notes | Sotally',
    seoDescription: 'AI-powered business tools. Generate business plans, OKR frameworks, and meeting summaries. Pay per use on Sotally.',
  },

  // ━━━ 6. EDUCATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'education', slug: 'education',
    title: 'AI Tools for Educators',
    subtitle: 'Create lesson plans, quizzes, and study guides in minutes — not hours.',
    icon: '🎓', color: '#7C3AED',
    persona: {
      name: 'Marcus Johnson', role: 'High School Science Teacher', company: 'at a public school',
      avatar: 'MJ',
      story: 'Marcus teaches chemistry and physics to 150 students across 5 classes. Lesson planning, quiz creation, and personalized study guides eat his evenings and weekends. Each class needs differentiated materials, and standardized test prep adds another layer.\n\nSotally\'s education tools transformed Marcus\'s prep time. AI generates lesson plans aligned to standards, creates varied quiz questions, and builds study guides tailored to different learning levels.',
      quote: 'I got my weekends back. AI generates the materials, I add my teaching expertise. My students actually get better resources now.',
    },
    introduction: 'Teaching is one of the most time-intensive professions — not because of classroom time, but because of the hours spent creating materials. AI education tools on Sotally help teachers generate lesson plans, quizzes, and study guides that are standards-aligned and differentiated for different learning levels.',
    useCases: [
      { title: 'Standards-Aligned Lesson Plans', problem: 'Creating lesson plans that meet curriculum standards, include varied activities, and accommodate different learning levels takes hours per lesson.', solution: 'Enter your subject, grade level, and topic — AI generates a complete lesson plan with objectives, activities, assessments, and differentiation notes.', steps: ['Open "Lesson Plan Generator"', 'Enter subject, grade, topic, and standards', 'AI generates a complete lesson plan', 'Includes warm-up, main activity, assessment, and extension', 'Edit to match your teaching style'], tools: ['lesson-plan-generator'], result: 'Full lesson plans in 3 minutes. Aligned to standards with built-in differentiation.' },
      { title: 'Quiz & Assessment Generator', problem: 'Writing good quiz questions that test understanding (not just memorization) at varied difficulty levels is tedious.', solution: 'Enter the topic and difficulty level — AI generates a mix of question types (multiple choice, short answer, essay) with answer keys.', steps: ['Open "Quiz Generator"', 'Enter topic, grade level, and number of questions', 'Select question types and difficulty distribution', 'AI generates questions with answer key and rubric', 'Export or print for classroom use'], tools: ['quiz-generator'], result: 'Complete quizzes with answer keys in 2 minutes. Questions test real understanding, not just recall.' },
      { title: 'Personalized Study Guides', problem: 'Every student needs different support. Creating personalized study materials for 150 students is impossible.', solution: 'Enter the topic and target level — AI generates study guides with explanations, examples, and practice problems suited to that level.', steps: ['Open "Study Guide Creator"', 'Enter topic and student level (beginner/intermediate/advanced)', 'AI generates an illustrated study guide', 'Includes key concepts, examples, and practice problems', 'Create multiple versions for different levels'], tools: ['study-guide-creator'], result: 'Differentiated study guides in seconds. Every student gets materials matched to their level.' },
    ],
    gettingStarted: ['Sign up — 50 free credits, no school budget needed', 'Generate a lesson plan for tomorrow\'s class', 'Create a quiz for your next unit assessment', 'Share the tool with your department — each teacher gets their own account'],
    relatedIntegrations: ['notion', 'google-docs'],
    relatedGuides: ['writing', 'getting-started'],
    faq: [
      { question: 'Are AI-generated materials aligned to my state standards?', answer: 'Specify your state and standards in the input, and AI will align the content. Always review for accuracy and alignment with your specific curriculum.' },
      { question: 'Is this appropriate for K-12 use?', answer: 'Sotally tools are designed for educator use. Teachers generate materials and review before sharing with students. The AI doesn\'t interact directly with students.' },
    ],
    seoTitle: 'AI Tools for Teachers — Lesson Plans, Quizzes, Study Guides | Sotally',
    seoDescription: 'AI-powered education tools for teachers. Generate lesson plans, quizzes, and study guides in minutes. Pay per use, no subscription.',
  },

  // ━━━ 7. DESIGN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'design', slug: 'design',
    title: 'AI Design Tools',
    subtitle: 'Generate color palettes, UI copy, font pairings, and design systems with AI assistance.',
    icon: '🎨', color: '#EC4899',
    persona: {
      name: 'Tom Nguyen', role: 'UI/UX Designer', company: 'at a design agency',
      avatar: 'TN',
      story: 'Tom works at a design agency handling 4-5 client projects simultaneously. Color palette decisions, microcopy, font selections, and design system documentation eat hours that should go to actual design work.\n\nSotally\'s design tools handle the analytical decisions — generating harmonious color palettes from brand guidelines, writing button labels and error messages, and suggesting font combinations. Tom spends more time designing and less time agonizing over HSL values.',
      quote: 'AI nails the analytical side of design — color theory, typography rules, copy tone. I focus on the creative vision.',
    },
    introduction: 'Design is both creative and analytical. AI excels at the analytical parts — color harmony, typography rules, UI writing patterns. Use AI design tools to handle the decisions that have "right answers" so you can focus on the creative work that doesn\'t.',
    useCases: [
      { title: 'Color Palette Generator', problem: 'Choosing harmonious, accessible color palettes that work for web is both art and science.', solution: 'Enter a brand color or mood — AI generates a complete palette with primary, secondary, accent, and neutral colors, all with WCAG contrast ratios.', steps: ['Open "Color Palette Generator"', 'Enter a base color or describe the mood', 'AI generates a full palette with hex codes', 'Includes light/dark mode variants', 'Accessibility contrast ratios for each pair'], tools: ['color-palette-generator'], result: 'Production-ready color palettes with accessibility built in. Complete with CSS variables.' },
      { title: 'UI Microcopy Writer', problem: 'Button labels, error messages, empty states, tooltips — they all need to be clear, concise, and consistent.', solution: 'Describe the UI element and context — AI generates multiple copy options following UX writing best practices.', steps: ['Open "UI Copy Generator"', 'Describe the element (button, error, empty state, tooltip)', 'Provide context and tone', 'AI generates 5 copy variations', 'Pick the best fit for your design'], tools: ['ui-copy-writer'], result: 'Consistent, user-friendly microcopy. No more "Click Here" buttons or "Error occurred" messages.' },
      { title: 'Font Pairing Advisor', problem: 'Finding fonts that work well together requires understanding type classification, x-height ratios, and visual contrast.', solution: 'Enter your heading font or describe the project style — AI suggests 5 complementary body font pairings with reasoning.', steps: ['Open "Font Pairing" tool', 'Enter your primary font or style description', 'AI suggests 5 pairings with explanations', 'Includes Google Fonts links for each', 'Shows sample text with the pairing'], tools: ['font-pairing-advisor'], result: 'Professional font pairings with typographic reasoning. All from Google Fonts for easy implementation.' },
    ],
    gettingStarted: ['Sign up with 50 free credits', 'Generate a color palette for your current project', 'Try the UI Copy tool for your next form or error state', 'Build custom design tools for your agency\'s workflow'],
    relatedIntegrations: ['notion', 'slack'],
    relatedGuides: ['creative', 'writing', 'getting-started'],
    faq: [
      { question: 'Can AI really make good design decisions?', answer: 'AI excels at design decisions that follow rules — color harmony, contrast ratios, typography pairing. It\'s less good at subjective creative decisions. Use it for the analytical parts and apply your creative judgment on top.' },
      { question: 'Will these tools replace designers?', answer: 'No. They handle the repetitive analytical tasks so designers can focus on creative problem-solving, user research, and visual storytelling — the parts that require human empathy and creativity.' },
    ],
    seoTitle: 'AI Design Tools — Color Palettes, UI Copy, Font Pairing | Sotally',
    seoDescription: 'AI design tools for UI/UX designers. Generate color palettes, UI microcopy, and font pairings. Pay per use on Sotally.',
  },

  // ━━━ 8. PRODUCTIVITY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'productivity', slug: 'productivity',
    title: 'AI Productivity Tools',
    subtitle: 'Streamline standups, reflections, and workflows with AI-powered productivity automation.',
    icon: '⚡', color: '#F59E0B',
    persona: {
      name: 'Rachel Kim', role: 'Operations Manager', company: 'at a remote-first startup',
      avatar: 'RK',
      story: 'Rachel manages operations for a 30-person remote team. Daily standups, weekly reports, process docs, and cross-team coordination fill her calendar. The team uses Slack, Asana, and Notion — but none of them talk to each other without manual copy-pasting.\n\nSotally\'s productivity tools automate the glue work. AI generates standup summaries from yesterday\'s Slack messages, writes weekly reflection reports, and formats process documentation consistently.',
      quote: 'The boring admin work that took 2 hours a day now takes 20 minutes. I finally have time for strategic operations work.',
    },
    introduction: 'Productivity isn\'t about working harder — it\'s about eliminating the tedious tasks that fragment your day. AI productivity tools automate standups, reflections, documentation, and coordination so you can focus on work that moves the needle.',
    useCases: [
      { title: 'Daily Standup Generator', problem: 'Writing standup updates every morning is repetitive. Often you forget what you did yesterday or can\'t articulate today\'s plan clearly.', solution: 'Enter quick bullet points — AI formats them into a professional standup update with Done/Doing/Blockers sections.', steps: ['Open "Daily Standup Generator"', 'Enter rough bullet points about yesterday and today', 'AI formats into Done / Doing / Blockers structure', 'Generates a Slack-ready one-liner summary', 'Post directly to your Slack standup channel'], tools: ['daily-standup-summary'], result: 'Consistent, professional standups in 30 seconds. Posted to Slack automatically.' },
      { title: 'Weekly Reflection Report', problem: 'End-of-week reports take 30 minutes to compile. You forget half of what happened by Friday afternoon.', solution: 'Enter this week\'s highlights and challenges — AI generates a structured reflection with wins, learnings, and next week priorities.', steps: ['Open "Weekly Reflection" tool', 'List this week\'s key activities and outcomes', 'AI generates a structured reflection', 'Includes wins, challenges, learnings, and next-week priorities', 'Share with your manager or team'], tools: ['weekly-reflection-generator'], result: 'Thoughtful weekly reflections in 2 minutes. Helps you track your growth and communicate impact.' },
    ],
    gettingStarted: ['Sign up — 50 free credits', 'Try the Standup Generator tomorrow morning', 'Connect Slack for direct posting', 'Connect Asana or Trello for task integration'],
    relatedIntegrations: ['slack', 'asana', 'trello', 'clickup', 'notion'],
    relatedGuides: ['business', 'development', 'getting-started'],
    faq: [
      { question: 'Can AI really improve my productivity?', answer: 'AI handles the formatting, structuring, and repetitive writing that fragments your day. Most users save 30-60 minutes daily on administrative tasks like standups, reports, and documentation.' },
    ],
    seoTitle: 'AI Productivity Tools — Standups, Reports, Workflows | Sotally',
    seoDescription: 'AI productivity tools for teams. Generate standup updates, weekly reflections, and process docs. Pay per use on Sotally.',
  },

  // ━━━ 9. FINANCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'finance', slug: 'finance',
    title: 'AI Finance Tools',
    subtitle: 'Generate pricing strategies, pitch decks, and financial analysis with AI.',
    icon: '💰', color: '#10B981',
    persona: {
      name: 'Mike Torres', role: 'Startup Founder', company: 'bootstrapping a SaaS product',
      avatar: 'MT',
      story: 'Mike is a solo founder building a SaaS product while managing finances, fundraising, and pricing strategy. He\'s technical but struggles with the business side — pricing models, investor pitch decks, and financial projections don\'t come naturally.\n\nSotally\'s finance tools help Mike model pricing strategies, generate pitch deck content, and analyze his business metrics. He makes better decisions faster without hiring a CFO.',
      quote: 'I\'m an engineer, not a finance person. AI helps me make informed business decisions without an MBA.',
    },
    introduction: 'Finance and strategy decisions are critical but many founders and small business owners lack formal training. AI finance tools provide frameworks, analysis, and recommendations based on best practices — giving you CFO-level insights without the CFO salary.',
    useCases: [
      { title: 'Pricing Strategy Advisor', problem: 'Setting the right price is make-or-break. Too high and you lose customers. Too low and you leave money on the table.', solution: 'Describe your product, market, and costs — AI generates a pricing strategy with model recommendation, price points, and competitive positioning.', steps: ['Open "Pricing Strategy" tool', 'Enter product details, costs, and competitor prices', 'AI analyzes and recommends pricing models', 'Generates tiered pricing with justification', 'Includes A/B test suggestions'], tools: ['pricing-strategy-generator'], result: 'Data-informed pricing strategy in 5 minutes. Includes competitive analysis and model recommendations.' },
      { title: 'Pitch Deck Content Generator', problem: 'Writing a compelling pitch deck takes weeks. The narrative structure, market sizing, and competitive slides are especially challenging.', solution: 'Enter your startup details — AI generates slide-by-slide content for a complete pitch deck following the standard investor format.', steps: ['Open "Pitch Deck Generator"', 'Enter company details, traction, and ask', 'AI generates content for each slide', 'Includes problem, solution, market, traction, team, and ask slides', 'Paste into your slide template'], tools: ['pitch-deck-outline'], result: 'Pitch deck content in 10 minutes. Professional narrative structure that investors expect.' },
    ],
    gettingStarted: ['Sign up with 50 free credits', 'Try the Pricing Strategy tool for your product', 'Connect Stripe to analyze your actual revenue data', 'Build custom financial tools for your specific needs'],
    relatedIntegrations: ['stripe', 'quickbooks'],
    relatedGuides: ['business', 'getting-started'],
    faq: [
      { question: 'Can AI really help with financial decisions?', answer: 'AI provides frameworks and analysis based on best practices. Always validate with your accountant or financial advisor for critical decisions. Think of it as a smart research assistant, not a replacement for professional financial advice.' },
    ],
    seoTitle: 'AI Finance Tools — Pricing, Pitch Decks, Analysis | Sotally',
    seoDescription: 'AI finance tools for founders and businesses. Generate pricing strategies, pitch deck content, and financial analysis. Pay per use.',
  },

  // ━━━ 10. CREATIVE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'creative', slug: 'creative',
    title: 'AI Creative Tools',
    subtitle: 'Brainstorm campaigns, generate concepts, and spark creative ideas with AI.',
    icon: '🎭', color: '#F43F5E',
    persona: {
      name: 'Emma Zhang', role: 'Creative Director', company: 'at a branding agency',
      avatar: 'EZ',
      story: 'Emma leads creative for a branding agency with 12 clients. The constant demand for fresh ideas — campaign concepts, taglines, creative briefs, mood board descriptions — is relentless. Creative block is real when you\'re generating ideas for multiple brands simultaneously.\n\nSotally\'s creative tools serve as a brainstorming partner. AI generates campaign concepts, writes creative briefs, and suggests tagline variations. Emma uses them as a starting point, not a final product — they spark ideas she wouldn\'t have found alone.',
      quote: 'AI is the brainstorming partner that never gets tired. It generates 20 ideas in seconds — I just need to find the 1 gem.',
    },
    introduction: 'Creativity isn\'t about waiting for inspiration — it\'s about generating lots of ideas and finding the gems. AI creative tools give you an infinite brainstorming partner that produces diverse concepts, taglines, and campaign ideas. Use them to break through creative blocks and explore directions you wouldn\'t have considered.',
    useCases: [
      { title: 'Campaign Concept Generator', problem: 'Coming up with fresh campaign concepts for multiple clients is mentally exhausting. Creative blocks hit harder under deadline pressure.', solution: 'Describe the brand, audience, and campaign goal — AI generates 10 unique campaign concepts with taglines, visual directions, and channel strategies.', steps: ['Describe the brand and campaign objective', 'AI generates 10 unique concepts', 'Each includes tagline, visual direction, and channels', 'Pick your top 3 and develop further', 'Present options to the client'], tools: [], result: 'Creative block eliminated. 10 diverse campaign concepts in 2 minutes.' },
      { title: 'Creative Brief Writer', problem: 'Writing creative briefs that clearly communicate the project vision takes time and often gets revised multiple times.', solution: 'Enter project details — AI generates a complete creative brief with objectives, audience, tone, deliverables, and success metrics.', steps: ['Enter client, project, and goals', 'AI generates a structured creative brief', 'Includes background, objectives, audience, tone, deliverables', 'Edit and share with your team'], tools: [], result: 'Professional creative briefs in 5 minutes. Clear enough to align the entire team.' },
      { title: 'Tagline Generator', problem: 'Writing a memorable tagline requires distilling a brand\'s essence into a few words. Most attempts are forgettable.', solution: 'Describe the brand values and audience — AI generates 20 tagline options using proven copywriting frameworks.', steps: ['Enter brand name, values, and differentiator', 'AI generates 20 tagline variations', 'Organized by style: clever, emotional, direct, aspirational', 'Rate and shortlist your favorites'], tools: [], result: '20 tagline options in 30 seconds. More variety than a week of brainstorming.' },
    ],
    gettingStarted: ['Sign up with 50 free credits', 'Try the Campaign Concept Generator for your current project', 'Use the Tagline tool to break through a creative block', 'Build custom creative tools tailored to your agency\'s process'],
    relatedIntegrations: ['notion', 'slack'],
    relatedGuides: ['marketing', 'design', 'writing'],
    faq: [
      { question: 'Doesn\'t using AI defeat the purpose of being creative?', answer: 'AI generates raw material and diverse starting points. The creative judgment — deciding what\'s good, refining concepts, adding emotional resonance — is entirely human. Think of AI as expanding your creative playground, not replacing your creativity.' },
    ],
    seoTitle: 'AI Creative Tools — Campaign Ideas, Taglines, Briefs | Sotally',
    seoDescription: 'AI creative tools for agencies and creatives. Generate campaign concepts, taglines, and creative briefs. Brainstorm without limits.',
  },

  // ━━━ 11. GETTING STARTED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'getting-started', slug: 'getting-started',
    title: 'Getting Started with Sotally',
    subtitle: 'Your complete guide to running AI tools, earning credits, and building your own tools.',
    icon: '🚀', color: '#6366F1',
    persona: {
      name: 'Carlos Mendez', role: 'Curious Professional', company: 'exploring AI tools',
      avatar: 'CM',
      story: 'Carlos keeps hearing about AI tools but is overwhelmed by the options. ChatGPT subscriptions, Jasper, Copy.ai — they all want monthly commitments. He just wants to try things without a subscription.\n\nSotally\'s pay-per-use model is exactly what Carlos needed. Sign up, get 50 free credits, browse 50+ tools, try the ones that look useful. No commitment, no subscription, no wasted money on tools he doesn\'t use.',
      quote: 'Finally, an AI tool platform where I pay for what I use. No more $20/month subscriptions for tools I use twice.',
    },
    introduction: 'Welcome to Sotally — the marketplace where you access AI-powered software tools without subscriptions. Pay only for what you use with credits. This guide walks you through everything: from your first tool run to building and selling your own tools.',
    useCases: [
      { title: 'Run Your First Tool', problem: 'You\'re new to Sotally and want to understand how it works.', solution: 'Browse the marketplace, pick a tool that matches your needs, fill in the inputs, and run it.', steps: ['Go to the marketplace (/tools)', 'Browse or search for a tool (try "Daily Standup" for a quick win)', 'Click the tool to see details, pricing, and reviews', 'Click "Run Tool" and fill in the input form', 'See your result in seconds — formatted and ready to use'], tools: [], result: 'Your first AI-powered result in under 2 minutes. No configuration needed.' },
      { title: 'Understand Credits', problem: 'How does the credit system work? How much do things cost?', solution: 'Credits are Sotally\'s currency. You get 50 free on signup. Most tools cost 3-10 credits per run.', steps: ['Sign up to get 50 free credits automatically', 'Each tool shows its credit cost before you run it', 'Credits are deducted when a tool runs successfully', 'If a tool fails, credits are refunded automatically', 'Buy more credits anytime — they never expire'], tools: [], result: 'Simple, transparent pricing. No surprises, no subscriptions, no expiring credits.' },
      { title: 'Build Your First Tool', problem: 'You have domain expertise and want to create a tool others can use.', solution: 'Use the no-code tool builder to create an AI tool in minutes. No coding required.', steps: ['Go to Creator Studio (/creator)', 'Click "Create Tool" and follow the 7-step wizard', 'Name your tool and describe what it does', 'Define input fields (what users enter)', 'Configure the AI logic (prompt, model, temperature)', 'Set pricing (free, per-run, or tiered)', 'Publish — your tool is live in the marketplace'], tools: [], result: 'A published AI tool in 15 minutes. Start earning credits from every user who runs it.' },
    ],
    gettingStarted: ['Create your account at sotally.com/register — 50 free credits, no credit card', 'Browse tools at /tools — try one that matches your work', 'Check your credit balance at /dashboard', 'Explore integrations at /integrations to connect your services', 'Create your first tool at /creator — turn your expertise into software'],
    relatedIntegrations: ['slack', 'notion', 'github'],
    relatedGuides: ['creators', 'development', 'marketing'],
    faq: [
      { question: 'Is Sotally free?', answer: 'You get 50 free credits on signup (enough to try 5-15 tools). After that, you can buy credit packages starting at $5. There are no subscriptions or monthly fees — buy credits when you need them, they never expire.' },
      { question: 'Do I need technical skills?', answer: 'No. Running tools requires zero technical knowledge — just fill in a form and click Run. Creating tools uses a no-code builder with step-by-step guidance.' },
      { question: 'How is this different from ChatGPT?', answer: 'ChatGPT is a general-purpose chatbot. Sotally has purpose-built tools optimized for specific tasks — with structured inputs, formatted outputs, and integrations to services like GitHub, Slack, and Notion. Think of it as an app store for AI tools vs. a single chatbot.' },
    ],
    seoTitle: 'Getting Started with Sotally — AI Tool Marketplace Guide',
    seoDescription: 'Learn how to use Sotally — the AI tool marketplace. Run tools, earn credits, build and sell your own AI tools. No subscription needed.',
  },

  // ━━━ 12. CREATORS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'creators', slug: 'creators',
    title: 'Creator Guide — Build & Sell AI Tools',
    subtitle: 'Turn your expertise into software. Build AI tools with no code and earn credits from every run.',
    icon: '🛠️', color: '#F97316',
    persona: {
      name: 'The Sotally Creator', role: 'Tool Builder', company: 'earning passive income',
      avatar: 'SC',
      story: 'The Sotally creator economy is for anyone with domain expertise — marketers who know what makes great ad copy, developers who understand code review, teachers who know pedagogy. You don\'t need to be a programmer to build software on Sotally.\n\nCreators earn 70-85% of every credit spent on their tools. Top creators earn thousands of credits monthly from tools they built once. It\'s like publishing a book that earns royalties forever — except it takes 15 minutes, not 15 months.',
      quote: 'I built a tool in 15 minutes that now earns me 500 credits a month. That\'s $15/month for 15 minutes of work.',
    },
    introduction: 'Sotally\'s creator platform lets anyone turn their expertise into AI-powered software. No coding required. Build a tool once, publish it in the marketplace, and earn credits every time someone runs it. This guide covers everything from your first tool to growing a profitable tool portfolio.',
    useCases: [
      { title: 'Build a Tool from Scratch', problem: 'You have expertise that others would pay for, but you can\'t code a web app.', solution: 'Use the 7-step no-code wizard: define inputs, write the AI prompt, set pricing, and publish.', steps: ['Go to /creator and click "Create Tool"', 'Name it and write a clear description', 'Define input fields (text, textarea, select, number)', 'Write the AI prompt using {{input.fieldname}} variables', 'Set pricing (start with 3-5 credits per run)', 'Preview and test with sample inputs', 'Publish to the marketplace'], tools: [], result: 'A live, published AI tool in 15 minutes. Accessible to every Sotally user.' },
      { title: 'Use AI Canvas to Generate Tools', problem: 'You know what tool you want but don\'t know how to configure the AI prompt.', solution: 'Describe your tool in plain English — AI Canvas generates the complete configuration for you.', steps: ['Go to /creator/canvas', 'Describe your tool: "A tool that generates LinkedIn posts from bullet points"', 'AI generates name, slug, input fields, prompt, and pricing', 'Review and customize the generated configuration', 'Publish with one click'], tools: [], result: 'AI builds your tool from a description. Even the prompt engineering is automated.' },
      { title: 'Grow Your Tool Portfolio', problem: 'One tool earns pocket change. How do you build a real income stream?', solution: 'Build 5-10 tools in your niche. Use analytics to see which perform best. Iterate based on user feedback and reviews.', steps: ['Start with 3 tools in your area of expertise', 'Check analytics at /creator/analytics weekly', 'Read reviews and iterate on underperforming tools', 'Create tool bundles for common workflows', 'Share your creator storefront to build an audience'], tools: [], result: 'A portfolio of tools earning passive income. Top creators earn 2000+ credits/month from 5-10 tools.' },
    ],
    gettingStarted: ['Sign up and go to /creator to access the Creator Studio', 'Build your first tool using the 7-step wizard', 'Or use AI Canvas (/creator/canvas) — describe your tool and let AI build it', 'Set competitive pricing (check similar tools for reference)', 'Share your creator storefront link to build an audience'],
    relatedIntegrations: ['github', 'slack', 'notion'],
    relatedGuides: ['getting-started', 'marketing', 'development'],
    faq: [
      { question: 'How much can I earn as a creator?', answer: 'Earnings depend on your tool quality and niche. A tool with 100 daily runs at 5 credits earns ~350 credits/day (at 70% revenue share). Top creators with portfolios of 5-10 tools earn 2000+ credits/month. Credits can be cashed out via Stripe at ~$0.03/credit.' },
      { question: 'Do I need to know programming?', answer: 'No. The tool builder is completely no-code. You write a prompt (natural language instruction for the AI), define input fields, and publish. If you\'re more technical, you can use advanced features like multi-step pipelines and connectors.' },
      { question: 'What makes a successful tool?', answer: 'The best tools solve a specific, repeated problem. "Generate LinkedIn posts" is better than "Write anything." Clear descriptions, good examples, and competitive pricing attract users. Read reviews and iterate.' },
      { question: 'Are my prompts protected?', answer: 'Yes. Your tool prompts (the AI instructions) are encrypted and never shown to users. Users see the input form and output, but the prompt logic stays private. Your intellectual property is protected.' },
    ],
    seoTitle: 'Build & Sell AI Tools — Sotally Creator Guide',
    seoDescription: 'Turn your expertise into AI-powered tools on Sotally. No coding required. Build once, earn passive income from every run. Creator guide with step-by-step instructions.',
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find(g => g.slug === slug);
}
