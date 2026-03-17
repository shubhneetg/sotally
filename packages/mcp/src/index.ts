import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_URL = process.env.SOTALLY_API_URL || 'https://sotally.com/api';
const API_TOKEN = process.env.SOTALLY_API_TOKEN || '';

const server = new McpServer({
  name: 'sotally',
  version: '0.1.0',
});

// Helper to call Sotally API
async function callAPI(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN && { Authorization: `Bearer ${API_TOKEN}` }),
      ...options?.headers,
    },
  });
  return res.json();
}

// Tool: List available tools
server.tool('sotally_list_tools',
  'Search and list available tools on Sotally marketplace',
  { query: z.string().optional().describe('Search query to filter tools'), category: z.string().optional().describe('Category slug to filter') },
  async ({ query, category }) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    const data = await callAPI(`/tools?${params}`);
    const tools = data.data?.items || [];
    const text = tools.map((t: any) =>
      `**${t.name}** (${t.slug})\n${t.description}\nCredits: ${t.pricing?.creditsPerRun || 'free'} | Runs: ${t.totalRuns} | Rating: ${t.avgRating || 'N/A'}`
    ).join('\n\n');
    return { content: [{ type: 'text', text: text || 'No tools found.' }] };
  }
);

// Tool: Get tool details
server.tool('sotally_get_tool',
  'Get detailed information about a specific Sotally tool',
  { slug: z.string().describe('Tool slug (e.g., "smart-text-classifier")') },
  async ({ slug }) => {
    const data = await callAPI(`/tools/${slug}`);
    const tool = data.data;
    if (!tool) return { content: [{ type: 'text', text: `Tool "${slug}" not found.` }] };
    const text = `**${tool.name}**\n${tool.description}\n\nCredits: ${tool.pricing?.creditsPerRun || 'free'}\nCategory: ${tool.categoryId || 'N/A'}\nTotal Runs: ${tool.totalRuns}\nRating: ${tool.avgRating || 'N/A'}\n\nInput fields:\n${JSON.stringify(tool.inputSchema?.properties || {}, null, 2)}`;
    return { content: [{ type: 'text', text }] };
  }
);

// Tool: Execute a tool
server.tool('sotally_run_tool',
  'Execute a Sotally tool with given inputs. Requires API token for paid tools.',
  {
    slug: z.string().describe('Tool slug to execute'),
    input: z.record(z.any()).describe('Input values matching the tool\'s input schema'),
  },
  async ({ slug, input }) => {
    if (!API_TOKEN) {
      return { content: [{ type: 'text', text: 'Error: SOTALLY_API_TOKEN required to execute tools. Set it in your environment.' }] };
    }

    // Execute
    const execResult = await callAPI(`/tools/${slug}/execute`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });

    if (!execResult.success) {
      return { content: [{ type: 'text', text: `Execution failed: ${execResult.error?.message || 'Unknown error'}` }] };
    }

    const executionId = execResult.data?.executionId;

    // Poll for result (max 30 seconds)
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const result = await callAPI(`/executions/${executionId}`);
      const exec = result.data;

      if (exec?.status === 'completed') {
        return { content: [{ type: 'text', text: `**Result** (${exec.creditsCharged} credits, ${exec.durationMs}ms):\n\n${typeof exec.output === 'string' ? exec.output : JSON.stringify(exec.output, null, 2)}` }] };
      }
      if (exec?.status === 'failed') {
        return { content: [{ type: 'text', text: `Execution failed: ${exec.error || 'Unknown error'}. Credits refunded.` }] };
      }
    }

    return { content: [{ type: 'text', text: 'Execution timed out. Check status later.' }] };
  }
);

// Tool: Check credit balance
server.tool('sotally_balance',
  'Check your Sotally credit balance',
  {},
  async () => {
    if (!API_TOKEN) return { content: [{ type: 'text', text: 'Set SOTALLY_API_TOKEN to check balance.' }] };
    const data = await callAPI('/credits/balance');
    return { content: [{ type: 'text', text: `Credit Balance: ${data.data?.creditBalance || 0} credits\nEarnings: ${data.data?.earningsBalance || 0} credits` }] };
  }
);

// Tool: Get trending tools
server.tool('sotally_trending',
  'Get currently trending tools on Sotally',
  {},
  async () => {
    const data = await callAPI('/tools/trending');
    const tools = data.data || [];
    const text = tools.length > 0
      ? tools.map((t: any, i: number) => `${i + 1}. **${t.name}** — ${t.description} (${t.totalRuns} runs)`).join('\n')
      : 'No trending data available yet.';
    return { content: [{ type: 'text', text: `**Trending Tools on Sotally:**\n\n${text}` }] };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[Sotally MCP] Server started');
}

main().catch(console.error);
