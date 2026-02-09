import { refreshAccessToken } from './auth';

let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export async function fetcher(
  input: RequestInfo,
  init?: RequestInit
) {
  const res = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.headers || {}),
      ...(accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {}),
    },
  });

  if (res.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken();
      setAccessToken(newAccessToken);

      // retry request
      return fetch(input, {
        ...init,
        credentials: 'include',
        headers: {
          ...(init?.headers || {}),
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
    } catch {
      window.location.href = '/login';
    }
  }

  return res;
}
