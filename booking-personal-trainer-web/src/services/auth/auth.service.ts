import type { User } from "@/types/user.types";
import { apiFetch } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error.utils";
import { clearAccessToken, setAccessToken } from "@/lib/token";
import { refreshAccessToken } from "@/lib/auth";

interface ApiResponse<T> {
  data: T;
}

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  email: string;
  password: string;
  userName: string;
  firstName: string;
  lastName: string;
  userType: "TRAINER" | "TRAINEE";
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    userName: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Waits for a specified number of milliseconds.
 */
const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Gets the access token from cookies by calling the refresh endpoint.
 * This works because the backend sets httpOnly cookies after login/register.
 * Retries multiple times with increasing delays to handle cookie propagation delays.
 */
async function getTokenFromCookies(maxRetries = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Wait progressively longer for cookies to be set by the browser
      // First attempt: 200ms, second: 500ms, third: 1000ms
      const delay = attempt === 1 ? 200 : attempt === 2 ? 500 : 1000;
      await wait(delay);
      
      // Call refresh endpoint which reads refresh token from cookies
      // and returns a new access token
      const accessToken = await refreshAccessToken();
      if (accessToken) {
        return accessToken;
      }
    } catch (error) {
      // If this is the last attempt, log the error
      if (attempt === maxRetries) {
        console.error("Failed to get token from cookies after retries:", error);
        return null;
      }
      // Otherwise, continue to next retry
    }
  }
  return null;
}

export async function login(data: LoginBody) {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // IMPORTANT - allows cookies to be set
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = getApiErrorMessage(body) || "Login failed";
    throw new Error(message);
  }
  
  const result = await res.json();
  
  // Try to get token from cookies (backend sets httpOnly cookies)
  // Wait a bit and then fetch token via refresh endpoint
  const accessToken = await getTokenFromCookies();
  if (accessToken) {
    setAccessToken(accessToken);
  }

  return result;
}

export async function register(data: RegisterBody) {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // IMPORTANT - allows cookies to be set
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = getApiErrorMessage(body) || "Registration failed";
    throw new Error(message);
  }

  const result = await res.json();
  
  // Note: Registration typically doesn't set auth cookies.
  // SignUpForm calls login() after register, so we get token there.
  // If backend does set cookies on register, we try to get the token here.
  const accessToken = await getTokenFromCookies();
  if (accessToken) {
    setAccessToken(accessToken);
  }

  return result;
}

export async function getProfile(): Promise<User> {
  const res = await apiFetch<ApiResponse<User>>("/api/v1/auth/profile");
  return res.data;
}

export interface UpdateProfileBody {
  age?: number;
  height?: number;
  weight?: number;
}

export async function updateProfile(data: UpdateProfileBody): Promise<User> {
  const res = await apiFetch<ApiResponse<User>>("/api/v1/users/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function logout() {
  try {
    await apiFetch("/api/v1/auth/logout", {
      method: "POST",
    });
  } finally {
    clearAccessToken();
  }
}
