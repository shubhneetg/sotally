import type { AuthUser } from './middleware/auth';

interface ApiKeyUser {
  id: string;
  tokenId: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
    apiUser: ApiKeyUser;
  }
}
