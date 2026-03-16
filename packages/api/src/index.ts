import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());
app.get('/health', (c) => c.json({ status: 'healthy', version: '0.1.0' }));

export default { port: 4000, fetch: app.fetch };
