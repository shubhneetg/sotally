const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

async function fetchAPI<T>(path: string, options?: RequestInit & { token?: string }): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  };
  const res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: { message: res.statusText } })) as {
      error?: { message?: string };
    };
    throw new Error(errBody.error?.message || 'API request failed');
  }
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string; referralCode?: string }) =>
      fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: (token: string) => fetchAPI('/auth/me', { token }),
  },
  credits: {
    balance: (token: string) => fetchAPI('/credits/balance', { token }),
    transactions: (token: string, page = 1) =>
      fetchAPI(`/credits/transactions?page=${page}`, { token }),
    purchase: (token: string, data: { packageId: string; successUrl: string; cancelUrl: string }) =>
      fetchAPI(`/credits/purchase?success_url=${encodeURIComponent(data.successUrl)}&cancel_url=${encodeURIComponent(data.cancelUrl)}`, {
        method: 'POST',
        body: JSON.stringify({ packageId: data.packageId }),
        token,
      }),
    packages: () => fetchAPI('/credits/packages'),
    claimDaily: (token: string) =>
      fetchAPI('/credits/claim-daily', { method: 'POST', token }),
  },
  tools: {
    list: (params?: { q?: string; category?: string; sort?: string; page?: number; per_page?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set('q', params.q);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.sort) searchParams.set('sort', params.sort || 'popular');
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.per_page) searchParams.set('per_page', String(params.per_page));
      return fetchAPI(`/tools?${searchParams}`);
    },
    get: (slug: string) => fetchAPI(`/tools/${slug}`),
    execute: (token: string, slug: string, input: Record<string, unknown>, options?: { useOwnKey?: boolean }) =>
      fetchAPI(`/tools/${slug}/execute`, { method: 'POST', body: JSON.stringify({ input, ...(options?.useOwnKey && { useOwnKey: true }) }), token }),
    reviews: (slug: string, page = 1) => fetchAPI(`/tools/${slug}/reviews?page=${page}`),
    report: (slug: string, data: { reason: string; description?: string }) =>
      fetchAPI(`/tools/${slug}/report`, { method: 'POST', body: JSON.stringify(data) }),
    trending: () => fetchAPI('/tools/trending'),
    similar: (slug: string) => fetchAPI(`/tools/${slug}/similar`),
  },
  executions: {
    get: (token: string, id: string) => fetchAPI(`/executions/${id}`, { token }),
    list: (token: string, page = 1) => fetchAPI(`/executions?page=${page}`, { token }),
  },
  creator: {
    createTool: (token: string, data: Record<string, unknown>) =>
      fetchAPI('/creator/tools', { method: 'POST', body: JSON.stringify(data), token }),
    updateTool: (token: string, id: string, data: Record<string, unknown>) =>
      fetchAPI(`/creator/tools/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
    publishTool: (token: string, id: string) =>
      fetchAPI(`/creator/tools/${id}/publish`, { method: 'POST', token }),
    listTools: (token: string, params?: { status?: string; page?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.page) searchParams.set('page', String(params.page));
      return fetchAPI(`/creator/tools?${searchParams}`, { token });
    },
    getTool: (token: string, id: string) =>
      fetchAPI(`/creator/tools/${id}`, { token }),
    archiveTool: (token: string, id: string) =>
      fetchAPI(`/creator/tools/${id}`, { method: 'DELETE', token }),
    analytics: (token: string, days = 30) =>
      fetchAPI(`/creator/analytics?days=${days}`, { token }),
    earnings: (token: string, page = 1) =>
      fetchAPI(`/creator/earnings?page=${page}`, { token }),
    templates: (token: string) =>
      fetchAPI('/creator/templates', { token }),
    canvasGenerate: (token: string, description: string) =>
      fetchAPI('/creator/canvas/generate', {
        method: 'POST',
        body: JSON.stringify({ description }),
        token,
      }),
  },
  affiliates: {
    apply: (token: string) =>
      fetchAPI('/affiliates/apply', { method: 'POST', token }),
    dashboard: (token: string) =>
      fetchAPI('/affiliates/dashboard', { token }),
    referrals: (token: string, page = 1) =>
      fetchAPI(`/affiliates/referrals?page=${page}`, { token }),
    earnings: (token: string, page = 1) =>
      fetchAPI(`/affiliates/earnings?page=${page}`, { token }),
    requestPayout: (token: string) =>
      fetchAPI('/affiliates/payouts', { method: 'POST', token }),
  },
  creators: {
    profile: (userId: string) =>
      fetchAPI(`/creator/profile/${userId}`),
    storefront: (username: string) =>
      fetchAPI(`/creator/storefront/${encodeURIComponent(username)}`),
    follow: (token: string, userId: string) =>
      fetchAPI(`/creator/follow/${userId}`, { method: 'POST', token }),
    following: (token: string | null, userId: string) =>
      fetchAPI(`/creator/following/${userId}`, { ...(token && { token }) }),
  },
};
