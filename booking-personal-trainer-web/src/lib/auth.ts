import { getAccessToken, getRefreshToken, setTokens } from "./token";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const REFRESH_ENDPOINT = "/api/v1/auth/token/refresh";

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Refresh token not found");
  }

  const url = `${API_URL}${REFRESH_ENDPOINT}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error("Refresh token failed");
  }

  const data = (await res.json()) as RefreshResponse;
  if (!data.accessToken || !data.refreshToken) {
    throw new Error("Refresh token failed");
  }

  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}
