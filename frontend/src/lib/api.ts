import type { ApiResponse } from '@cryptoscam/shared';

const API_HOST = import.meta.env.PROD ? 'https://api.scamledger.com' : '';
const BASE_URL = `${API_HOST}/api`;

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = path.startsWith('/v1') ? `${API_HOST}${path}` : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return (await res.json()) as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
