export interface IntegrationAction {
  id: string;
  name: string;
  description: string;
}

export interface IntegrationUseCase {
  title: string;
  description: string;
}

export interface IntegrationFAQ {
  question: string;
  answer: string;
}

export interface Integration {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  category: string;
  description: string;
  longDescription: string;
  website: string;
  status: 'active' | 'coming_soon';
  authType: string;
  authLabel: string;
  authHelpUrl: string;
  actions: IntegrationAction[];
  useCases: IntegrationUseCase[];
  faq: IntegrationFAQ[];
}

export const INTEGRATION_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🔗' },
  { id: 'marketing', name: 'Marketing & Social', icon: '📈' },
  { id: 'development', name: 'Development', icon: '💻' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'crm', name: 'CRM & Sales', icon: '🤝' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'storage', name: 'Storage & Files', icon: '📁' },
  { id: 'analytics', name: 'Analytics', icon: '📊' },
  { id: 'ecommerce', name: 'E-Commerce', icon: '🛒' },
];

export const INTEGRATIONS: Integration[] = [
  // ━━━ ACTIVE CONNECTORS (15) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: 'github', name: 'GitHub', slug: 'github', icon: '🐙', color: '#333', category: 'development',
    description: 'Automate GitHub with AI — review PRs, manage issues, analyze code, and more.',
    longDescription: 'Connect GitHub to Sotally and let AI supercharge your development workflow. Automatically review pull requests for bugs and security issues, generate issue descriptions from bug reports, analyze repository code quality, and create documentation from source code. Every GitHub action flows through AI first, making your development process smarter.',
    website: 'https://github.com', status: 'active',
    authType: 'bearer_token', authLabel: 'Personal Access Token', authHelpUrl: 'https://github.com/settings/tokens',
    actions: [
      { id: 'create_issue', name: 'Create Issue', description: 'Create a new issue in a repository' },
      { id: 'create_comment', name: 'Comment on Issue', description: 'Add a comment to an existing issue or PR' },
      { id: 'list_repos', name: 'List Repositories', description: 'List repositories for the authenticated user' },
      { id: 'get_file', name: 'Get File Contents', description: 'Read a file from a repository' },
      { id: 'create_pr_review', name: 'Create PR Review', description: 'Submit a review on a pull request' },
    ],
    useCases: [
      { title: 'AI PR Reviewer', description: 'Automatically analyze pull request diffs for bugs, security vulnerabilities, and code style issues. Posts review comments directly on the PR.' },
      { title: 'Bug Report Generator', description: 'Paste error logs and stack traces — AI creates a well-structured GitHub issue with title, description, reproduction steps, and labels.' },
      { title: 'Code Documentation', description: 'Point at a file in your repo — AI reads the code and generates comprehensive documentation, then creates a PR with the docs.' },
    ],
    faq: [
      { question: 'How do I connect GitHub to Sotally?', answer: 'Go to Settings > Connections, click Connect on GitHub, and paste your Personal Access Token. You can create one at github.com/settings/tokens with the scopes you need (repo, issues, pull_requests).' },
      { question: 'Is my GitHub token secure?', answer: 'Yes. Your token is encrypted with AES-256-GCM and stored securely. It is only decrypted at the moment of tool execution and never logged or exposed to tool creators.' },
      { question: 'What GitHub actions can I automate?', answer: 'You can create issues, comment on PRs, review code, list repositories, read files, and more. Tool creators combine these actions with AI to build powerful developer tools.' },
    ],
  },
  {
    id: 'slack', name: 'Slack', slug: 'slack', icon: '💬', color: '#4A154B', category: 'productivity',
    description: 'Send AI-generated messages, summaries, and alerts to Slack channels automatically.',
    longDescription: 'Integrate Slack with Sotally to automate your team communication with AI. Generate standup summaries, post AI-written announcements, send smart alerts based on data analysis, and create channel digests. AI processes your content and delivers polished messages directly to the right Slack channels.',
    website: 'https://slack.com', status: 'active',
    authType: 'bearer_token', authLabel: 'Bot Token (xoxb-...)', authHelpUrl: 'https://api.slack.com/apps',
    actions: [
      { id: 'send_message', name: 'Send Message', description: 'Post a message to a Slack channel' },
      { id: 'list_channels', name: 'List Channels', description: 'List public channels in the workspace' },
      { id: 'set_topic', name: 'Set Channel Topic', description: 'Update a channel topic' },
      { id: 'add_reaction', name: 'Add Reaction', description: 'Add an emoji reaction to a message' },
    ],
    useCases: [
      { title: 'Daily Standup Publisher', description: 'AI generates a formatted standup summary from your notes and posts it to your team channel every morning.' },
      { title: 'Meeting Notes Distributor', description: 'Paste raw meeting notes — AI summarizes key decisions and action items, then posts to the relevant Slack channel.' },
      { title: 'Smart Alert System', description: 'AI analyzes incoming data and sends contextual alerts to Slack with priority-based channel routing.' },
    ],
    faq: [
      { question: 'How do I get a Slack bot token?', answer: 'Create a Slack app at api.slack.com/apps, add the chat:write and channels:read scopes, install to your workspace, and copy the Bot User OAuth Token (starts with xoxb-).' },
      { question: 'Can I send messages to private channels?', answer: 'Yes, as long as your Slack bot has been invited to the private channel. Use the channel ID (starts with C) in the tool configuration.' },
      { question: 'Will the messages come from my name?', answer: 'Messages are sent as your Slack bot. You can customize the bot name and icon in your Slack app settings.' },
    ],
  },
  {
    id: 'discord', name: 'Discord', slug: 'discord', icon: '🎮', color: '#5865F2', category: 'communication',
    description: 'Post AI-generated content to Discord servers — announcements, summaries, and bot responses.',
    longDescription: 'Connect Discord to Sotally for AI-powered community management. Automatically post announcements, generate community digests, moderate content, and create interactive bot responses. Perfect for community managers who want to keep their Discord servers active and engaging with AI-assisted content.',
    website: 'https://discord.com', status: 'active',
    authType: 'bearer_token', authLabel: 'Bot Token', authHelpUrl: 'https://discord.com/developers/applications',
    actions: [
      { id: 'send_message', name: 'Send Message', description: 'Send a message to a Discord channel' },
      { id: 'create_thread', name: 'Create Thread', description: 'Create a new thread in a channel' },
      { id: 'add_reaction', name: 'Add Reaction', description: 'Add a reaction to a message' },
    ],
    useCases: [
      { title: 'Community Announcements', description: 'AI drafts professional announcements from your notes and posts them to your Discord announcement channel.' },
      { title: 'FAQ Bot', description: 'Users ask questions in a channel — AI generates accurate answers and posts them as thread replies.' },
      { title: 'Event Summaries', description: 'After community events, AI generates highlights and discussion summaries posted to a recap channel.' },
    ],
    faq: [
      { question: 'How do I create a Discord bot token?', answer: 'Go to discord.com/developers/applications, create an application, add a Bot, and copy the token. Invite the bot to your server with the appropriate permissions.' },
      { question: 'Can I send rich embeds?', answer: 'Yes, the Discord connector supports embeds through the message body template. Format your content as a Discord embed object.' },
    ],
  },
  {
    id: 'notion', name: 'Notion', slug: 'notion', icon: '📝', color: '#000', category: 'productivity',
    description: 'Create and update Notion pages and databases with AI-generated content.',
    longDescription: 'Integrate Notion with Sotally to automate your knowledge management. AI generates structured content and writes it directly to your Notion workspace — create meeting notes pages, populate database entries, generate documentation, and organize information automatically.',
    website: 'https://notion.so', status: 'active',
    authType: 'bearer_token', authLabel: 'Integration Token', authHelpUrl: 'https://www.notion.so/my-integrations',
    actions: [
      { id: 'create_page', name: 'Create Page', description: 'Create a new page in a Notion database or as a child page' },
      { id: 'query_database', name: 'Query Database', description: 'Search and filter a Notion database' },
      { id: 'update_page', name: 'Update Page', description: 'Update properties of an existing page' },
    ],
    useCases: [
      { title: 'Meeting Notes Automation', description: 'Paste raw meeting notes — AI structures them into a formatted Notion page with attendees, decisions, and action items.' },
      { title: 'Research Database', description: 'Feed URLs or text to AI — it extracts key information and creates structured entries in your Notion research database.' },
      { title: 'Content Calendar', description: 'Describe your content ideas — AI generates titles, descriptions, and deadlines, then adds them to your Notion content calendar.' },
    ],
    faq: [
      { question: 'How do I connect Notion?', answer: 'Create an integration at notion.so/my-integrations, copy the Internal Integration Token, then share your target pages/databases with the integration.' },
      { question: 'Why can\'t the tool access my page?', answer: 'Notion integrations can only access pages explicitly shared with them. Open the page, click Share, and add your integration.' },
    ],
  },
  {
    id: 'airtable', name: 'Airtable', slug: 'airtable', icon: '📋', color: '#18BFFF', category: 'productivity',
    description: 'Read, create, and update Airtable records with AI-processed data.',
    longDescription: 'Connect Airtable to Sotally for AI-powered database operations. Automatically categorize and enrich records, generate summaries from table data, create new entries from unstructured input, and build smart data pipelines that combine AI analysis with structured storage.',
    website: 'https://airtable.com', status: 'active',
    authType: 'bearer_token', authLabel: 'Personal Access Token', authHelpUrl: 'https://airtable.com/create/tokens',
    actions: [
      { id: 'list_records', name: 'List Records', description: 'List records from an Airtable base and table' },
      { id: 'create_record', name: 'Create Record', description: 'Create a new record in a table' },
      { id: 'update_record', name: 'Update Record', description: 'Update fields in an existing record' },
    ],
    useCases: [
      { title: 'Lead Enrichment', description: 'AI reads new leads from Airtable, researches them online, and updates records with company info, social profiles, and lead scores.' },
      { title: 'Content Tracker', description: 'Describe content ideas in plain text — AI parses them into structured Airtable records with status, assignee, and deadline fields.' },
    ],
    faq: [
      { question: 'Where do I find my Airtable token?', answer: 'Go to airtable.com/create/tokens, create a new personal access token with the scopes you need (data.records:read, data.records:write).' },
    ],
  },
  {
    id: 'hubspot', name: 'HubSpot', slug: 'hubspot', icon: '🧲', color: '#FF7A59', category: 'crm',
    description: 'Manage HubSpot contacts, deals, and companies with AI-powered automation.',
    longDescription: 'Integrate HubSpot CRM with Sotally to supercharge your sales pipeline. AI qualifies leads, enriches contact data, generates personalized outreach, and updates deal stages automatically. Turn your CRM from a data entry tool into an intelligent sales assistant.',
    website: 'https://hubspot.com', status: 'active',
    authType: 'bearer_token', authLabel: 'Private App Token', authHelpUrl: 'https://developers.hubspot.com/docs/api/private-apps',
    actions: [
      { id: 'create_contact', name: 'Create Contact', description: 'Create a new contact in HubSpot' },
      { id: 'update_contact', name: 'Update Contact', description: 'Update contact properties' },
      { id: 'create_deal', name: 'Create Deal', description: 'Create a new deal in the pipeline' },
      { id: 'list_contacts', name: 'List Contacts', description: 'Search and list contacts' },
    ],
    useCases: [
      { title: 'AI Lead Qualifier', description: 'New contacts enter HubSpot — AI scores them based on company size, industry, and engagement, then updates the lead score field.' },
      { title: 'Personalized Outreach', description: 'AI reads contact data and generates personalized email drafts tailored to each prospect\'s industry and role.' },
      { title: 'Deal Stage Updater', description: 'AI analyzes recent interactions and automatically suggests or updates deal stages in your pipeline.' },
    ],
    faq: [
      { question: 'How do I get a HubSpot private app token?', answer: 'Go to HubSpot Settings > Integrations > Private Apps, create a new app with the scopes you need (crm.objects.contacts, crm.objects.deals), and copy the access token.' },
    ],
  },
  {
    id: 'mailchimp', name: 'Mailchimp', slug: 'mailchimp', icon: '📧', color: '#FFE01B', category: 'marketing',
    description: 'Manage email lists and send AI-written campaigns through Mailchimp.',
    longDescription: 'Connect Mailchimp to Sotally for AI-powered email marketing. Generate compelling email copy, segment audiences intelligently, personalize subject lines, and automate campaign creation. AI writes the emails, Mailchimp delivers them.',
    website: 'https://mailchimp.com', status: 'active',
    authType: 'api_key', authLabel: 'API Key', authHelpUrl: 'https://mailchimp.com/help/about-api-keys/',
    actions: [
      { id: 'add_subscriber', name: 'Add Subscriber', description: 'Add a new subscriber to an audience' },
      { id: 'list_audiences', name: 'List Audiences', description: 'List all audiences/lists' },
    ],
    useCases: [
      { title: 'Newsletter Generator', description: 'Provide bullet points — AI writes a full newsletter with subject line, preview text, and formatted body, ready to send via Mailchimp.' },
      { title: 'Smart Subscriber Tagging', description: 'AI analyzes subscriber behavior and automatically tags them for targeted segments.' },
    ],
    faq: [
      { question: 'Where is my Mailchimp API key?', answer: 'Go to Account > Extras > API keys in your Mailchimp dashboard. Create a new key and copy it.' },
    ],
  },
  {
    id: 'stripe', name: 'Stripe', slug: 'stripe', icon: '💳', color: '#635BFF', category: 'finance',
    description: 'Query Stripe data — customers, payments, invoices — and generate AI reports.',
    longDescription: 'Integrate Stripe with Sotally for AI-powered financial insights. Analyze payment trends, generate customer reports, create invoice summaries, and build smart financial dashboards. AI turns your raw Stripe data into actionable business intelligence.',
    website: 'https://stripe.com', status: 'active',
    authType: 'bearer_token', authLabel: 'Secret Key (sk_...)', authHelpUrl: 'https://dashboard.stripe.com/apikeys',
    actions: [
      { id: 'list_customers', name: 'List Customers', description: 'List recent customers' },
      { id: 'list_payments', name: 'List Payments', description: 'List recent payment intents' },
      { id: 'create_invoice', name: 'Create Invoice', description: 'Create a new invoice for a customer' },
    ],
    useCases: [
      { title: 'Revenue Report Generator', description: 'AI pulls your Stripe data and generates a formatted weekly/monthly revenue report with trends and insights.' },
      { title: 'Churn Analyzer', description: 'AI analyzes failed payments and subscription cancellations to identify churn patterns and suggest retention strategies.' },
    ],
    faq: [
      { question: 'Is it safe to use my Stripe secret key?', answer: 'Your key is encrypted with AES-256-GCM and only decrypted during tool execution. We recommend using a restricted key with read-only permissions for analytics tools.' },
    ],
  },
  {
    id: 'twilio', name: 'Twilio', slug: 'twilio', icon: '📱', color: '#F22F46', category: 'communication',
    description: 'Send AI-generated SMS messages and make calls through Twilio.',
    longDescription: 'Connect Twilio to Sotally for AI-powered communication. Generate personalized SMS messages, create smart notification systems, and build AI-driven customer outreach. Perfect for businesses that need to communicate at scale with a personal touch.',
    website: 'https://twilio.com', status: 'active',
    authType: 'basic_auth', authLabel: 'Account SID:Auth Token', authHelpUrl: 'https://console.twilio.com/',
    actions: [
      { id: 'send_sms', name: 'Send SMS', description: 'Send a text message via Twilio' },
    ],
    useCases: [
      { title: 'Personalized SMS Outreach', description: 'AI generates personalized text messages for each recipient based on their profile, then sends via Twilio.' },
      { title: 'Appointment Reminders', description: 'AI creates friendly, contextual appointment reminder messages and sends them at the right time.' },
    ],
    faq: [
      { question: 'How do I format my Twilio credentials?', answer: 'Enter your credentials as "AccountSID:AuthToken" (separated by a colon). Find both in your Twilio Console dashboard.' },
    ],
  },
  {
    id: 'sendgrid', name: 'SendGrid', slug: 'sendgrid', icon: '✉️', color: '#1A82E2', category: 'marketing',
    description: 'Send transactional and marketing emails with AI-written content via SendGrid.',
    longDescription: 'Integrate SendGrid with Sotally for AI-powered email delivery. Generate and send personalized transactional emails, create marketing campaigns, and manage contact lists. AI writes compelling email content while SendGrid handles reliable delivery.',
    website: 'https://sendgrid.com', status: 'active',
    authType: 'bearer_token', authLabel: 'API Key', authHelpUrl: 'https://app.sendgrid.com/settings/api_keys',
    actions: [
      { id: 'send_email', name: 'Send Email', description: 'Send an email through SendGrid' },
      { id: 'add_contact', name: 'Add Contact', description: 'Add a contact to a list' },
    ],
    useCases: [
      { title: 'AI Email Writer + Sender', description: 'Describe your email goal — AI writes subject, body, and CTA, then sends directly via SendGrid.' },
      { title: 'Welcome Email Generator', description: 'AI creates personalized welcome emails based on how users signed up, then sends through SendGrid.' },
    ],
    faq: [
      { question: 'Where do I find my SendGrid API key?', answer: 'Go to Settings > API Keys in your SendGrid dashboard, create a new key with Mail Send permissions.' },
    ],
  },
  {
    id: 'trello', name: 'Trello', slug: 'trello', icon: '📌', color: '#0079BF', category: 'productivity',
    description: 'Create and manage Trello cards and boards with AI automation.',
    longDescription: 'Connect Trello to Sotally for AI-powered project management. Automatically create cards from meeting notes, move cards based on status updates, generate task descriptions, and keep your boards organized with intelligent automation.',
    website: 'https://trello.com', status: 'active',
    authType: 'api_key', authLabel: 'API Key + Token', authHelpUrl: 'https://trello.com/power-ups/admin',
    actions: [
      { id: 'create_card', name: 'Create Card', description: 'Create a new card on a Trello board' },
      { id: 'move_card', name: 'Move Card', description: 'Move a card to a different list' },
      { id: 'add_comment', name: 'Add Comment', description: 'Add a comment to a card' },
    ],
    useCases: [
      { title: 'Meeting Action Items', description: 'Paste meeting notes — AI extracts action items and creates Trello cards with descriptions, assignees, and due dates.' },
      { title: 'Bug Report Cards', description: 'Users submit bug reports — AI categorizes them, assigns priority, and creates Trello cards in the right column.' },
    ],
    faq: [
      { question: 'How do I connect Trello?', answer: 'Get your API key from trello.com/power-ups/admin, then generate a token. Enter both as "key:token" in your connection settings.' },
    ],
  },
  {
    id: 'jira', name: 'Jira', slug: 'jira', icon: '🎫', color: '#0052CC', category: 'development',
    description: 'Create and manage Jira issues with AI — automate bug triage, sprint planning, and more.',
    longDescription: 'Integrate Jira with Sotally for AI-powered issue tracking. Automatically triage bugs, generate issue descriptions, update ticket statuses, and create sprint reports. AI understands your development context and keeps Jira organized without manual effort.',
    website: 'https://atlassian.com/jira', status: 'active',
    authType: 'basic_auth', authLabel: 'Email:API Token', authHelpUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
    actions: [
      { id: 'create_issue', name: 'Create Issue', description: 'Create a new Jira issue' },
      { id: 'update_issue', name: 'Update Issue', description: 'Update fields on an existing issue' },
      { id: 'add_comment', name: 'Add Comment', description: 'Add a comment to an issue' },
      { id: 'transition_issue', name: 'Transition Issue', description: 'Move an issue to a different status' },
    ],
    useCases: [
      { title: 'AI Bug Triage', description: 'Error logs arrive — AI categorizes severity, assigns component, suggests priority, and creates a well-structured Jira ticket.' },
      { title: 'Sprint Report Generator', description: 'AI reads completed issues and generates a sprint retrospective summary with metrics, highlights, and improvement suggestions.' },
    ],
    faq: [
      { question: 'How do I format Jira credentials?', answer: 'Enter as "your-email@company.com:api-token". Create an API token at id.atlassian.com/manage-profile/security/api-tokens.' },
    ],
  },
  {
    id: 'linear', name: 'Linear', slug: 'linear', icon: '📐', color: '#5E6AD2', category: 'development',
    description: 'Manage Linear issues and projects with AI-powered automation.',
    longDescription: 'Connect Linear to Sotally for intelligent issue management. AI creates well-structured issues, updates project status, generates release notes, and helps plan sprints. Keep your Linear workspace organized with AI that understands software development context.',
    website: 'https://linear.app', status: 'active',
    authType: 'bearer_token', authLabel: 'API Key', authHelpUrl: 'https://linear.app/settings/api',
    actions: [
      { id: 'create_issue', name: 'Create Issue', description: 'Create a new Linear issue' },
      { id: 'update_issue', name: 'Update Issue', description: 'Update an existing issue' },
      { id: 'list_issues', name: 'List Issues', description: 'List issues with filters' },
    ],
    useCases: [
      { title: 'Feature Request Processor', description: 'Customer feedback comes in — AI extracts feature requests, checks for duplicates, and creates Linear issues with proper labels and priority.' },
      { title: 'Release Notes Generator', description: 'AI reads completed Linear issues for a cycle and generates formatted release notes for your changelog.' },
    ],
    faq: [
      { question: 'Where is my Linear API key?', answer: 'Go to Linear Settings > API > Personal API Keys, create a new key, and copy it.' },
    ],
  },
  {
    id: 'asana', name: 'Asana', slug: 'asana', icon: '🎯', color: '#F06A6A', category: 'productivity',
    description: 'Create and manage Asana tasks with AI-generated content and automation.',
    longDescription: 'Integrate Asana with Sotally for AI-powered task management. Automatically create tasks from emails, generate project plans, update task statuses, and build smart workflows that keep your team productive.',
    website: 'https://asana.com', status: 'active',
    authType: 'bearer_token', authLabel: 'Personal Access Token', authHelpUrl: 'https://app.asana.com/0/developer-console',
    actions: [
      { id: 'create_task', name: 'Create Task', description: 'Create a new task in a project' },
      { id: 'update_task', name: 'Update Task', description: 'Update an existing task' },
      { id: 'add_comment', name: 'Add Comment', description: 'Add a comment to a task' },
    ],
    useCases: [
      { title: 'Email to Task', description: 'Forward emails or paste content — AI extracts action items and creates Asana tasks with proper projects, assignees, and due dates.' },
      { title: 'Project Plan Generator', description: 'Describe a project goal — AI generates a full task breakdown with dependencies and timeline in Asana.' },
    ],
    faq: [
      { question: 'How do I get an Asana token?', answer: 'Go to app.asana.com/0/developer-console, create a Personal Access Token, and copy it.' },
    ],
  },
  {
    id: 'webhook', name: 'Webhooks', slug: 'webhook', icon: '🔗', color: '#666', category: 'development',
    description: 'Send AI-generated data to any URL — connect Sotally to any service with an API.',
    longDescription: 'The universal connector. Webhooks let Sotally tools send data to ANY service that accepts HTTP requests. Use this to integrate with services that don\'t have a dedicated connector yet, build custom integrations, or trigger workflows in other platforms.',
    website: 'https://en.wikipedia.org/wiki/Webhook', status: 'active',
    authType: 'bearer_token', authLabel: 'Authorization Header (optional)', authHelpUrl: '',
    actions: [
      { id: 'send_post', name: 'Send POST Request', description: 'Send a POST request with JSON body to any URL' },
      { id: 'send_get', name: 'Send GET Request', description: 'Send a GET request to any URL' },
    ],
    useCases: [
      { title: 'Custom API Integration', description: 'Connect to any REST API — AI generates the request payload, webhook delivers it to your endpoint.' },
      { title: 'Workflow Trigger', description: 'Trigger automations in Make, n8n, or any webhook-compatible platform with AI-processed data.' },
    ],
    faq: [
      { question: 'Do webhooks require authentication?', answer: 'It depends on the receiving service. You can set a custom Authorization header if needed, or leave it blank for public endpoints.' },
    ],
  },

  // ━━━ COMING SOON — Marketing & Social ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: 'gmail', name: 'Gmail', slug: 'gmail', icon: '📬', color: '#EA4335', category: 'marketing', description: 'Send and read emails through Gmail with AI assistance.', longDescription: 'Connect Gmail to Sotally for AI-powered email management. Draft replies, summarize threads, send personalized emails at scale, and organize your inbox intelligently.', website: 'https://gmail.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Google Account', authHelpUrl: '', actions: [{ id: 'send_email', name: 'Send Email', description: 'Send an email' }, { id: 'read_inbox', name: 'Read Inbox', description: 'Read recent emails' }], useCases: [{ title: 'AI Email Responder', description: 'AI reads incoming emails and drafts contextual replies for your review.' }, { title: 'Personalized Outreach', description: 'AI generates unique, personalized emails for each recipient and sends them via Gmail.' }], faq: [{ question: 'When will Gmail be available?', answer: 'Gmail integration requires OAuth setup. Sign up to be notified when it launches.' }] },
  { id: 'twitter', name: 'Twitter / X', slug: 'twitter', icon: '🐦', color: '#1DA1F2', category: 'marketing', description: 'Post tweets, read timelines, and analyze trends with AI.', longDescription: 'Integrate Twitter/X with Sotally for AI-powered social media management. Generate viral tweet threads, analyze trending topics, schedule content, and engage with your audience intelligently.', website: 'https://x.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Bearer Token', authHelpUrl: 'https://developer.twitter.com', actions: [{ id: 'post_tweet', name: 'Post Tweet', description: 'Post a new tweet' }, { id: 'search_tweets', name: 'Search Tweets', description: 'Search for tweets' }], useCases: [{ title: 'Thread Generator', description: 'Provide a topic — AI creates a compelling tweet thread and posts it.' }, { title: 'Trend Analyzer', description: 'AI monitors trending topics and generates content ideas aligned with current trends.' }], faq: [{ question: 'How do I get Twitter API access?', answer: 'Apply for a developer account at developer.twitter.com and create a project to get your Bearer Token.' }] },
  { id: 'linkedin', name: 'LinkedIn', slug: 'linkedin', icon: '💼', color: '#0A66C2', category: 'marketing', description: 'Post AI-generated content and manage your LinkedIn presence.', longDescription: 'Connect LinkedIn to Sotally for AI-powered professional content creation. Generate thought leadership posts, analyze engagement, create company updates, and build your professional brand with AI assistance.', website: 'https://linkedin.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'LinkedIn Account', authHelpUrl: '', actions: [{ id: 'create_post', name: 'Create Post', description: 'Publish a LinkedIn post' }], useCases: [{ title: 'Thought Leadership Posts', description: 'AI generates professional LinkedIn posts from your ideas, optimized for engagement.' }], faq: [{ question: 'When will LinkedIn be available?', answer: 'LinkedIn requires OAuth integration. We\'re working on it — sign up to be notified.' }] },
  { id: 'facebook', name: 'Facebook', slug: 'facebook', icon: '👤', color: '#1877F2', category: 'marketing', description: 'Manage Facebook pages and post AI-generated content.', longDescription: 'Integrate Facebook with Sotally to automate your social media presence. AI generates engaging posts, responds to comments, and manages your page content.', website: 'https://facebook.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Page Access Token', authHelpUrl: '', actions: [{ id: 'create_post', name: 'Create Post', description: 'Post to a Facebook page' }], useCases: [{ title: 'Social Content Creator', description: 'AI generates platform-optimized posts for your Facebook page.' }], faq: [{ question: 'When will Facebook be available?', answer: 'Facebook integration requires OAuth. Coming soon.' }] },
  { id: 'instagram', name: 'Instagram', slug: 'instagram', icon: '📸', color: '#E4405F', category: 'marketing', description: 'Generate captions and manage Instagram content with AI.', longDescription: 'Connect Instagram to Sotally for AI-powered content management. Generate compelling captions, plan content calendars, and analyze engagement patterns.', website: 'https://instagram.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Instagram Account', authHelpUrl: '', actions: [{ id: 'create_caption', name: 'Generate Caption', description: 'Generate a caption for a post' }], useCases: [{ title: 'Caption Generator', description: 'Upload or describe an image — AI creates the perfect Instagram caption with hashtags.' }], faq: [{ question: 'When will Instagram be available?', answer: 'Instagram integration requires Meta API access. Coming soon.' }] },
  { id: 'pinterest', name: 'Pinterest', slug: 'pinterest', icon: '📍', color: '#BD081C', category: 'marketing', description: 'Create and manage Pinterest pins with AI-generated descriptions.', longDescription: 'Integrate Pinterest with Sotally for AI-powered visual content marketing.', website: 'https://pinterest.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Pinterest Account', authHelpUrl: '', actions: [{ id: 'create_pin', name: 'Create Pin', description: 'Create a new pin' }], useCases: [{ title: 'Pin Description Writer', description: 'AI generates SEO-optimized pin descriptions.' }], faq: [{ question: 'When will Pinterest be available?', answer: 'Coming soon.' }] },
  { id: 'tiktok', name: 'TikTok', slug: 'tiktok', icon: '🎵', color: '#000', category: 'marketing', description: 'Generate TikTok scripts and manage content with AI.', longDescription: 'Connect TikTok to Sotally for AI-powered short-form video content strategy.', website: 'https://tiktok.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'TikTok Account', authHelpUrl: '', actions: [{ id: 'generate_script', name: 'Generate Script', description: 'Generate a TikTok video script' }], useCases: [{ title: 'Script Generator', description: 'AI creates engaging TikTok scripts from your topic ideas.' }], faq: [{ question: 'When will TikTok be available?', answer: 'Coming soon.' }] },
  { id: 'buffer', name: 'Buffer', slug: 'buffer', icon: '📅', color: '#168EEA', category: 'marketing', description: 'Schedule AI-generated social media posts through Buffer.', longDescription: 'Integrate Buffer with Sotally to schedule AI-written social media content across all your platforms.', website: 'https://buffer.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Access Token', authHelpUrl: '', actions: [{ id: 'create_update', name: 'Schedule Post', description: 'Schedule a social media post' }], useCases: [{ title: 'Content Scheduler', description: 'AI generates a week of social posts and schedules them through Buffer.' }], faq: [{ question: 'When will Buffer be available?', answer: 'Coming soon.' }] },
  { id: 'activecampaign', name: 'ActiveCampaign', slug: 'activecampaign', icon: '🎯', color: '#356AE6', category: 'marketing', description: 'Automate email marketing and CRM with AI through ActiveCampaign.', longDescription: 'Connect ActiveCampaign to Sotally for AI-powered marketing automation.', website: 'https://activecampaign.com', status: 'coming_soon', authType: 'api_key', authLabel: 'API Key', authHelpUrl: '', actions: [{ id: 'add_contact', name: 'Add Contact', description: 'Add a contact' }], useCases: [{ title: 'Smart Segmentation', description: 'AI analyzes contacts and creates targeted segments.' }], faq: [{ question: 'When will ActiveCampaign be available?', answer: 'Coming soon.' }] },
  { id: 'convertkit', name: 'ConvertKit', slug: 'convertkit', icon: '📮', color: '#FB6970', category: 'marketing', description: 'Manage email subscribers and send AI-written broadcasts.', longDescription: 'Integrate ConvertKit with Sotally for AI-powered creator email marketing.', website: 'https://convertkit.com', status: 'coming_soon', authType: 'api_key', authLabel: 'API Key', authHelpUrl: '', actions: [{ id: 'add_subscriber', name: 'Add Subscriber', description: 'Add a subscriber' }], useCases: [{ title: 'Newsletter Writer', description: 'AI writes your newsletter based on weekly notes.' }], faq: [{ question: 'When will ConvertKit be available?', answer: 'Coming soon.' }] },
  { id: 'intercom', name: 'Intercom', slug: 'intercom', icon: '💁', color: '#1F8DED', category: 'marketing', description: 'Manage customer conversations and support with AI through Intercom.', longDescription: 'Connect Intercom to Sotally for AI-powered customer support automation.', website: 'https://intercom.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Access Token', authHelpUrl: '', actions: [{ id: 'send_message', name: 'Send Message', description: 'Send a message' }], useCases: [{ title: 'AI Support Agent', description: 'AI generates helpful responses to customer queries.' }], faq: [{ question: 'When will Intercom be available?', answer: 'Coming soon.' }] },

  // ━━━ COMING SOON — Development ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: 'gitlab', name: 'GitLab', slug: 'gitlab', icon: '🦊', color: '#FC6D26', category: 'development', description: 'Automate GitLab with AI — issues, merge requests, and CI/CD.', longDescription: 'Connect GitLab to Sotally for AI-powered DevOps automation.', website: 'https://gitlab.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Personal Access Token', authHelpUrl: '', actions: [{ id: 'create_issue', name: 'Create Issue', description: 'Create a GitLab issue' }], useCases: [{ title: 'MR Reviewer', description: 'AI reviews merge requests for code quality.' }], faq: [{ question: 'When will GitLab be available?', answer: 'Coming soon.' }] },
  { id: 'bitbucket', name: 'Bitbucket', slug: 'bitbucket', icon: '🪣', color: '#0052CC', category: 'development', description: 'Manage Bitbucket repositories and PRs with AI.', longDescription: 'Integrate Bitbucket with Sotally for AI-powered code management.', website: 'https://bitbucket.org', status: 'coming_soon', authType: 'basic_auth', authLabel: 'Username:App Password', authHelpUrl: '', actions: [{ id: 'create_pr', name: 'Create PR', description: 'Create a pull request' }], useCases: [{ title: 'PR Description Generator', description: 'AI generates PR descriptions from commit messages.' }], faq: [{ question: 'When will Bitbucket be available?', answer: 'Coming soon.' }] },
  { id: 'sentry', name: 'Sentry', slug: 'sentry', icon: '🐛', color: '#362D59', category: 'development', description: 'Analyze Sentry errors with AI and automate bug tracking.', longDescription: 'Connect Sentry to Sotally for AI-powered error analysis and bug triage.', website: 'https://sentry.io', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Auth Token', authHelpUrl: '', actions: [{ id: 'list_issues', name: 'List Issues', description: 'List recent Sentry issues' }], useCases: [{ title: 'Error Analyzer', description: 'AI reads Sentry errors and suggests fixes.' }], faq: [{ question: 'When will Sentry be available?', answer: 'Coming soon.' }] },
  { id: 'pagerduty', name: 'PagerDuty', slug: 'pagerduty', icon: '🚨', color: '#06AC38', category: 'development', description: 'Create and manage PagerDuty incidents with AI.', longDescription: 'Integrate PagerDuty with Sotally for AI-powered incident management.', website: 'https://pagerduty.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'API Key', authHelpUrl: '', actions: [{ id: 'create_incident', name: 'Create Incident', description: 'Create an incident' }], useCases: [{ title: 'Incident Summarizer', description: 'AI generates incident postmortems.' }], faq: [{ question: 'When will PagerDuty be available?', answer: 'Coming soon.' }] },
  { id: 'vercel', name: 'Vercel', slug: 'vercel', icon: '▲', color: '#000', category: 'development', description: 'Manage Vercel deployments and projects with AI.', longDescription: 'Connect Vercel to Sotally for AI-powered deployment management.', website: 'https://vercel.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Access Token', authHelpUrl: '', actions: [{ id: 'list_deployments', name: 'List Deployments', description: 'List recent deployments' }], useCases: [{ title: 'Deploy Monitor', description: 'AI monitors deployments and alerts on failures.' }], faq: [{ question: 'When will Vercel be available?', answer: 'Coming soon.' }] },

  // ━━━ COMING SOON — Productivity ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: 'google-sheets', name: 'Google Sheets', slug: 'google-sheets', icon: '📊', color: '#34A853', category: 'productivity', description: 'Read and write Google Sheets data with AI processing.', longDescription: 'Connect Google Sheets to Sotally for AI-powered spreadsheet automation. Analyze data, generate reports, populate sheets with AI-processed information.', website: 'https://sheets.google.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Google Service Account', authHelpUrl: '', actions: [{ id: 'read_range', name: 'Read Range', description: 'Read data from a range' }, { id: 'write_range', name: 'Write Range', description: 'Write data to a range' }], useCases: [{ title: 'Data Analyzer', description: 'AI reads spreadsheet data and generates insights and visualizations.' }], faq: [{ question: 'When will Google Sheets be available?', answer: 'Coming soon. Will support Service Account authentication.' }] },
  { id: 'google-calendar', name: 'Google Calendar', slug: 'google-calendar', icon: '📅', color: '#4285F4', category: 'productivity', description: 'Create and manage calendar events with AI.', longDescription: 'Integrate Google Calendar with Sotally for AI-powered scheduling.', website: 'https://calendar.google.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Google Service Account', authHelpUrl: '', actions: [{ id: 'create_event', name: 'Create Event', description: 'Create a calendar event' }], useCases: [{ title: 'Smart Scheduler', description: 'AI analyzes your availability and suggests optimal meeting times.' }], faq: [{ question: 'When will Google Calendar be available?', answer: 'Coming soon.' }] },
  { id: 'microsoft-teams', name: 'Microsoft Teams', slug: 'microsoft-teams', icon: '👥', color: '#6264A7', category: 'productivity', description: 'Send messages and manage Teams channels with AI.', longDescription: 'Connect Microsoft Teams to Sotally for AI-powered team communication.', website: 'https://teams.microsoft.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Microsoft Account', authHelpUrl: '', actions: [{ id: 'send_message', name: 'Send Message', description: 'Send a Teams message' }], useCases: [{ title: 'Meeting Summarizer', description: 'AI generates meeting summaries and posts to Teams.' }], faq: [{ question: 'When will Teams be available?', answer: 'Coming soon.' }] },
  { id: 'monday', name: 'Monday.com', slug: 'monday', icon: '📋', color: '#FF3D57', category: 'productivity', description: 'Manage Monday.com boards and items with AI.', longDescription: 'Integrate Monday.com with Sotally for AI-powered work management.', website: 'https://monday.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'API Token', authHelpUrl: '', actions: [{ id: 'create_item', name: 'Create Item', description: 'Create a board item' }], useCases: [{ title: 'Task Generator', description: 'AI creates structured Monday.com items from unstructured input.' }], faq: [{ question: 'When will Monday.com be available?', answer: 'Coming soon.' }] },
  { id: 'clickup', name: 'ClickUp', slug: 'clickup', icon: '✅', color: '#7B68EE', category: 'productivity', description: 'Create and manage ClickUp tasks with AI automation.', longDescription: 'Connect ClickUp to Sotally for AI-powered project management.', website: 'https://clickup.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'API Token', authHelpUrl: '', actions: [{ id: 'create_task', name: 'Create Task', description: 'Create a task' }], useCases: [{ title: 'Project Planner', description: 'AI breaks down goals into ClickUp tasks.' }], faq: [{ question: 'When will ClickUp be available?', answer: 'Coming soon.' }] },
  { id: 'todoist', name: 'Todoist', slug: 'todoist', icon: '☑️', color: '#E44332', category: 'productivity', description: 'Manage Todoist tasks with AI-powered organization.', longDescription: 'Integrate Todoist with Sotally for AI-powered personal task management.', website: 'https://todoist.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'API Token', authHelpUrl: '', actions: [{ id: 'create_task', name: 'Create Task', description: 'Create a task' }], useCases: [{ title: 'Smart Task Creator', description: 'Dump your thoughts — AI organizes them into Todoist tasks with projects and priorities.' }], faq: [{ question: 'When will Todoist be available?', answer: 'Coming soon.' }] },
  { id: 'coda', name: 'Coda', slug: 'coda', icon: '📄', color: '#F46A54', category: 'productivity', description: 'Create and manage Coda docs with AI content generation.', longDescription: 'Connect Coda to Sotally for AI-powered document automation.', website: 'https://coda.io', status: 'coming_soon', authType: 'bearer_token', authLabel: 'API Token', authHelpUrl: '', actions: [{ id: 'create_row', name: 'Create Row', description: 'Add a row to a table' }], useCases: [{ title: 'Doc Generator', description: 'AI generates structured Coda documents from your notes.' }], faq: [{ question: 'When will Coda be available?', answer: 'Coming soon.' }] },
  { id: 'google-docs', name: 'Google Docs', slug: 'google-docs', icon: '📝', color: '#4285F4', category: 'productivity', description: 'Create and edit Google Docs with AI-generated content.', longDescription: 'Integrate Google Docs with Sotally for AI-powered document creation.', website: 'https://docs.google.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Google Service Account', authHelpUrl: '', actions: [{ id: 'create_doc', name: 'Create Document', description: 'Create a new document' }], useCases: [{ title: 'Report Generator', description: 'AI creates formatted Google Docs reports from data.' }], faq: [{ question: 'When will Google Docs be available?', answer: 'Coming soon.' }] },

  // ━━━ COMING SOON — CRM & Sales ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: 'salesforce', name: 'Salesforce', slug: 'salesforce', icon: '☁️', color: '#00A1E0', category: 'crm', description: 'Manage Salesforce records and automate sales with AI.', longDescription: 'Connect Salesforce to Sotally for AI-powered CRM automation. Enrich leads, generate reports, and automate data entry.', website: 'https://salesforce.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Salesforce Account', authHelpUrl: '', actions: [{ id: 'create_lead', name: 'Create Lead', description: 'Create a lead' }], useCases: [{ title: 'Lead Enrichment', description: 'AI enriches Salesforce leads with company data.' }], faq: [{ question: 'When will Salesforce be available?', answer: 'Coming soon.' }] },
  { id: 'pipedrive', name: 'Pipedrive', slug: 'pipedrive', icon: '🔗', color: '#017737', category: 'crm', description: 'Manage Pipedrive deals and contacts with AI automation.', longDescription: 'Integrate Pipedrive with Sotally for AI-powered sales pipeline management.', website: 'https://pipedrive.com', status: 'coming_soon', authType: 'api_key', authLabel: 'API Token', authHelpUrl: '', actions: [{ id: 'create_deal', name: 'Create Deal', description: 'Create a deal' }], useCases: [{ title: 'Deal Scorer', description: 'AI scores deals based on activity patterns.' }], faq: [{ question: 'When will Pipedrive be available?', answer: 'Coming soon.' }] },
  { id: 'zoho-crm', name: 'Zoho CRM', slug: 'zoho-crm', icon: '📊', color: '#DC2626', category: 'crm', description: 'Automate Zoho CRM with AI-powered lead and deal management.', longDescription: 'Connect Zoho CRM to Sotally for intelligent sales automation.', website: 'https://zoho.com/crm', status: 'coming_soon', authType: 'oauth2', authLabel: 'Zoho Account', authHelpUrl: '', actions: [{ id: 'create_contact', name: 'Create Contact', description: 'Create a contact' }], useCases: [{ title: 'Contact Enricher', description: 'AI enriches contact profiles with web data.' }], faq: [{ question: 'When will Zoho CRM be available?', answer: 'Coming soon.' }] },
  { id: 'close', name: 'Close', slug: 'close', icon: '📞', color: '#1E3A5F', category: 'crm', description: 'Manage Close CRM leads and activities with AI.', longDescription: 'Integrate Close with Sotally for AI-powered inside sales automation.', website: 'https://close.com', status: 'coming_soon', authType: 'api_key', authLabel: 'API Key', authHelpUrl: '', actions: [{ id: 'create_lead', name: 'Create Lead', description: 'Create a lead' }], useCases: [{ title: 'Call Notes Processor', description: 'AI processes call notes into structured CRM updates.' }], faq: [{ question: 'When will Close be available?', answer: 'Coming soon.' }] },
  { id: 'apollo', name: 'Apollo.io', slug: 'apollo', icon: '🚀', color: '#6366F1', category: 'crm', description: 'Enrich leads and automate outreach with Apollo.io and AI.', longDescription: 'Connect Apollo.io to Sotally for AI-powered sales prospecting.', website: 'https://apollo.io', status: 'coming_soon', authType: 'api_key', authLabel: 'API Key', authHelpUrl: '', actions: [{ id: 'search_people', name: 'Search People', description: 'Search for prospects' }], useCases: [{ title: 'Prospect Finder', description: 'AI finds and qualifies ideal prospects via Apollo.' }], faq: [{ question: 'When will Apollo be available?', answer: 'Coming soon.' }] },

  // ━━━ COMING SOON — Communication ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: 'whatsapp', name: 'WhatsApp Business', slug: 'whatsapp', icon: '💚', color: '#25D366', category: 'communication', description: 'Send AI-generated WhatsApp messages to customers.', longDescription: 'Connect WhatsApp Business to Sotally for AI-powered customer messaging.', website: 'https://business.whatsapp.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Access Token', authHelpUrl: '', actions: [{ id: 'send_message', name: 'Send Message', description: 'Send a WhatsApp message' }], useCases: [{ title: 'Customer Notifier', description: 'AI generates personalized WhatsApp notifications.' }], faq: [{ question: 'When will WhatsApp be available?', answer: 'Coming soon.' }] },
  { id: 'telegram', name: 'Telegram', slug: 'telegram', icon: '✈️', color: '#26A5E4', category: 'communication', description: 'Send messages and manage Telegram bots with AI.', longDescription: 'Integrate Telegram with Sotally for AI-powered bot and channel management.', website: 'https://telegram.org', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Bot Token', authHelpUrl: '', actions: [{ id: 'send_message', name: 'Send Message', description: 'Send a Telegram message' }], useCases: [{ title: 'Channel Publisher', description: 'AI writes and publishes content to Telegram channels.' }], faq: [{ question: 'When will Telegram be available?', answer: 'Coming soon.' }] },

  // ━━━ COMING SOON — Finance ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: 'paypal', name: 'PayPal', slug: 'paypal', icon: '💲', color: '#00457C', category: 'finance', description: 'Query PayPal transactions and generate financial reports with AI.', longDescription: 'Connect PayPal to Sotally for AI-powered payment analytics.', website: 'https://paypal.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'PayPal Account', authHelpUrl: '', actions: [{ id: 'list_transactions', name: 'List Transactions', description: 'List recent transactions' }], useCases: [{ title: 'Transaction Analyzer', description: 'AI generates insights from PayPal transaction data.' }], faq: [{ question: 'When will PayPal be available?', answer: 'Coming soon.' }] },
  { id: 'quickbooks', name: 'QuickBooks', slug: 'quickbooks', icon: '📒', color: '#2CA01C', category: 'finance', description: 'Automate QuickBooks with AI-powered accounting.', longDescription: 'Integrate QuickBooks with Sotally for intelligent bookkeeping automation.', website: 'https://quickbooks.intuit.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Intuit Account', authHelpUrl: '', actions: [{ id: 'create_invoice', name: 'Create Invoice', description: 'Create an invoice' }], useCases: [{ title: 'Invoice Generator', description: 'AI creates QuickBooks invoices from project data.' }], faq: [{ question: 'When will QuickBooks be available?', answer: 'Coming soon.' }] },
  { id: 'xero', name: 'Xero', slug: 'xero', icon: '📗', color: '#13B5EA', category: 'finance', description: 'Manage Xero accounting with AI automation.', longDescription: 'Connect Xero to Sotally for AI-powered accounting workflows.', website: 'https://xero.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Xero Account', authHelpUrl: '', actions: [{ id: 'create_invoice', name: 'Create Invoice', description: 'Create an invoice' }], useCases: [{ title: 'Expense Categorizer', description: 'AI categorizes expenses automatically.' }], faq: [{ question: 'When will Xero be available?', answer: 'Coming soon.' }] },
  { id: 'wise', name: 'Wise', slug: 'wise', icon: '🌍', color: '#9FE870', category: 'finance', description: 'Manage international transfers with Wise and AI.', longDescription: 'Integrate Wise with Sotally for AI-powered international payment management.', website: 'https://wise.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'API Token', authHelpUrl: '', actions: [{ id: 'get_rate', name: 'Get Exchange Rate', description: 'Get current exchange rates' }], useCases: [{ title: 'FX Advisor', description: 'AI monitors exchange rates and suggests optimal transfer times.' }], faq: [{ question: 'When will Wise be available?', answer: 'Coming soon.' }] },

  // ━━━ COMING SOON — Storage ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: 'dropbox', name: 'Dropbox', slug: 'dropbox', icon: '📦', color: '#0061FF', category: 'storage', description: 'Manage Dropbox files with AI — organize, search, and process documents.', longDescription: 'Connect Dropbox to Sotally for AI-powered file management.', website: 'https://dropbox.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Dropbox Account', authHelpUrl: '', actions: [{ id: 'list_files', name: 'List Files', description: 'List files in a folder' }], useCases: [{ title: 'Document Organizer', description: 'AI reads file names and content to auto-organize your Dropbox.' }], faq: [{ question: 'When will Dropbox be available?', answer: 'Coming soon.' }] },
  { id: 'google-drive', name: 'Google Drive', slug: 'google-drive', icon: '📁', color: '#4285F4', category: 'storage', description: 'Manage Google Drive files with AI processing.', longDescription: 'Integrate Google Drive with Sotally for AI-powered file management.', website: 'https://drive.google.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Google Service Account', authHelpUrl: '', actions: [{ id: 'list_files', name: 'List Files', description: 'List files' }], useCases: [{ title: 'File Analyzer', description: 'AI processes and summarizes Drive documents.' }], faq: [{ question: 'When will Google Drive be available?', answer: 'Coming soon.' }] },
  { id: 'aws-s3', name: 'AWS S3', slug: 'aws-s3', icon: '🪣', color: '#FF9900', category: 'storage', description: 'Manage S3 buckets and objects with AI.', longDescription: 'Connect AWS S3 to Sotally for AI-powered cloud storage operations.', website: 'https://aws.amazon.com/s3', status: 'coming_soon', authType: 'api_key', authLabel: 'Access Key ID:Secret', authHelpUrl: '', actions: [{ id: 'list_objects', name: 'List Objects', description: 'List objects in a bucket' }], useCases: [{ title: 'Data Processor', description: 'AI reads and processes files from S3 buckets.' }], faq: [{ question: 'When will AWS S3 be available?', answer: 'Coming soon.' }] },

  // ━━━ COMING SOON — Analytics ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: 'google-analytics', name: 'Google Analytics', slug: 'google-analytics', icon: '📈', color: '#E37400', category: 'analytics', description: 'Analyze website traffic with AI-powered Google Analytics insights.', longDescription: 'Connect Google Analytics to Sotally for AI-powered traffic analysis and reporting.', website: 'https://analytics.google.com', status: 'coming_soon', authType: 'oauth2', authLabel: 'Google Service Account', authHelpUrl: '', actions: [{ id: 'get_report', name: 'Get Report', description: 'Fetch analytics data' }], useCases: [{ title: 'Traffic Analyzer', description: 'AI generates weekly traffic reports with insights and recommendations.' }], faq: [{ question: 'When will Google Analytics be available?', answer: 'Coming soon.' }] },
  { id: 'mixpanel', name: 'Mixpanel', slug: 'mixpanel', icon: '🔬', color: '#7856FF', category: 'analytics', description: 'Analyze product analytics with AI through Mixpanel.', longDescription: 'Integrate Mixpanel with Sotally for AI-powered product analytics.', website: 'https://mixpanel.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Service Account', authHelpUrl: '', actions: [{ id: 'query_events', name: 'Query Events', description: 'Query event data' }], useCases: [{ title: 'Behavior Analyzer', description: 'AI identifies user behavior patterns from Mixpanel data.' }], faq: [{ question: 'When will Mixpanel be available?', answer: 'Coming soon.' }] },
  { id: 'segment', name: 'Segment', slug: 'segment', icon: '🟢', color: '#52BD95', category: 'analytics', description: 'Route and analyze customer data with Segment and AI.', longDescription: 'Connect Segment to Sotally for AI-powered customer data analysis.', website: 'https://segment.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Write Key', authHelpUrl: '', actions: [{ id: 'track_event', name: 'Track Event', description: 'Send a track event' }], useCases: [{ title: 'Event Enricher', description: 'AI enriches Segment events with additional context.' }], faq: [{ question: 'When will Segment be available?', answer: 'Coming soon.' }] },
  { id: 'supabase', name: 'Supabase', slug: 'supabase', icon: '⚡', color: '#3ECF8E', category: 'analytics', description: 'Query and manage Supabase databases with AI.', longDescription: 'Integrate Supabase with Sotally for AI-powered database operations.', website: 'https://supabase.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Service Role Key', authHelpUrl: '', actions: [{ id: 'query', name: 'Run Query', description: 'Execute a database query' }], useCases: [{ title: 'Data Analyst', description: 'AI generates SQL queries and analyzes your Supabase data.' }], faq: [{ question: 'When will Supabase be available?', answer: 'Coming soon.' }] },

  // ━━━ COMING SOON — E-Commerce ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: 'shopify', name: 'Shopify', slug: 'shopify', icon: '🛍️', color: '#96BF48', category: 'ecommerce', description: 'Manage Shopify products and orders with AI automation.', longDescription: 'Connect Shopify to Sotally for AI-powered e-commerce management. Generate product descriptions, analyze sales data, and automate order processing.', website: 'https://shopify.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Admin API Token', authHelpUrl: '', actions: [{ id: 'list_products', name: 'List Products', description: 'List products' }, { id: 'create_product', name: 'Create Product', description: 'Create a product' }], useCases: [{ title: 'Product Description Generator', description: 'AI writes compelling product descriptions optimized for SEO.' }, { title: 'Sales Analyzer', description: 'AI generates insights from your Shopify sales data.' }], faq: [{ question: 'When will Shopify be available?', answer: 'Coming soon.' }] },
  { id: 'woocommerce', name: 'WooCommerce', slug: 'woocommerce', icon: '🛒', color: '#96588A', category: 'ecommerce', description: 'Manage WooCommerce products and orders with AI.', longDescription: 'Integrate WooCommerce with Sotally for AI-powered WordPress e-commerce.', website: 'https://woocommerce.com', status: 'coming_soon', authType: 'basic_auth', authLabel: 'Consumer Key:Secret', authHelpUrl: '', actions: [{ id: 'list_products', name: 'List Products', description: 'List products' }], useCases: [{ title: 'Product Copier', description: 'AI rewrites product descriptions for better conversion.' }], faq: [{ question: 'When will WooCommerce be available?', answer: 'Coming soon.' }] },
  { id: 'gumroad', name: 'Gumroad', slug: 'gumroad', icon: '🎁', color: '#FF90E8', category: 'ecommerce', description: 'Manage Gumroad products and sales with AI.', longDescription: 'Connect Gumroad to Sotally for AI-powered digital product management.', website: 'https://gumroad.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'Access Token', authHelpUrl: '', actions: [{ id: 'list_products', name: 'List Products', description: 'List products' }], useCases: [{ title: 'Sales Reporter', description: 'AI generates Gumroad sales reports with insights.' }], faq: [{ question: 'When will Gumroad be available?', answer: 'Coming soon.' }] },
  { id: 'lemonsqueezy', name: 'Lemon Squeezy', slug: 'lemonsqueezy', icon: '🍋', color: '#FFC233', category: 'ecommerce', description: 'Manage digital products and subscriptions with AI.', longDescription: 'Integrate Lemon Squeezy with Sotally for AI-powered SaaS billing management.', website: 'https://lemonsqueezy.com', status: 'coming_soon', authType: 'bearer_token', authLabel: 'API Key', authHelpUrl: '', actions: [{ id: 'list_products', name: 'List Products', description: 'List products' }], useCases: [{ title: 'Revenue Dashboard', description: 'AI creates subscription revenue dashboards.' }], faq: [{ question: 'When will Lemon Squeezy be available?', answer: 'Coming soon.' }] },
];

export function getIntegrationBySlug(slug: string): Integration | undefined {
  return INTEGRATIONS.find(i => i.slug === slug);
}

export function getIntegrationsByCategory(category: string): Integration[] {
  if (category === 'all') return INTEGRATIONS;
  return INTEGRATIONS.filter(i => i.category === category);
}

export function getActiveIntegrations(): Integration[] {
  return INTEGRATIONS.filter(i => i.status === 'active');
}
