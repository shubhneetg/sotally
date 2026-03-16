import type { AuthUser } from './middleware/auth';

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}
