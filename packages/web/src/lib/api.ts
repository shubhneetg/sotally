const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchAPI<T>(path: string, options?: RequestInit & { token?: string }): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  };
  const res = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(error.error?.message || 'API request failed');
  }
  return res.json();
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
    purchase: (token: string, data: { package: string; successUrl: string; cancelUrl: string }) =>
      fetchAPI('/credits/purchase', { method: 'POST', body: JSON.stringify(data), token }),
    packages: () => fetchAPI('/credits/packages'),
  },
  tools: {
    list: (params?: { q?: string; category?: string; sort?: string; page?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set('q', params.q);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.sort) searchParams.set('sort', params.sort || 'popular');
      if (params?.page) searchParams.set('page', String(params.page));
      return fetchAPI(`/tools?${searchParams}`);
    },
    get: (slug: string) => fetchAPI(`/tools/${slug}`),
    execute: (token: string, slug: string, input: Record<string, unknown>) =>
      fetchAPI(`/tools/${slug}/execute`, { method: 'POST', body: JSON.stringify({ input }), token }),
    reviews: (slug: string, page = 1) => fetchAPI(`/tools/${slug}/reviews?page=${page}`),
  },
  executions: {
    get: (token: string, id: string) => fetchAPI(`/executions/${id}`, { token }),
    list: (token: string, page = 1) => fetchAPI(`/executions?page=${page}`, { token }),
  },
};
