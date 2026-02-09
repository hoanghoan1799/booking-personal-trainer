// src/lib/auth.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', 
  });

  if (!res.ok) {
    throw new Error('Refresh token failed');
  }

  const data = await res.json();

  return data.accessToken as string;
}
