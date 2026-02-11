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
 */
async function getTokenFromCookies(): Promise<string | null> {
  try {
    // Wait a bit for cookies to be set by the browser
    await wait(100);
    
    // Call refresh endpoint which reads refresh token from cookies
    // and returns a new access token
    const accessToken = await refreshAccessToken();
    return accessToken;
  } catch (error) {
    console.error("Failed to get token from cookies:", error);
    return null;
  }
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
  // User will need to login after registration to get tokens.
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
