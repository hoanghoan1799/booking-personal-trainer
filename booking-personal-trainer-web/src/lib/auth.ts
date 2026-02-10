const API_URL = process.env.NEXT_PUBLIC_API_URL;
const REFRESH_ENDPOINT = "/api/v1/auth/token/refresh";

export async function refreshAccessToken(): Promise<string> {
  const url = `${API_URL}${REFRESH_ENDPOINT}`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Refresh token failed");
  }

  const data = (await res.json()) as { accessToken?: string };
  if (!data.accessToken) {
    throw new Error("Refresh token failed");
  }

  return data.accessToken;
}
