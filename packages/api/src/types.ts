import type { AuthUser } from './middleware/auth.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}
