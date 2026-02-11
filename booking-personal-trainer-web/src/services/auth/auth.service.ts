import type { User } from "@/types/user.types";
import { apiFetch } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error.utils";
import { clearAccessToken, setAccessToken } from "@/lib/token";
import { refreshAccessToken } from "@/lib/auth";
import { Router } from "next/router";

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
 * Gets the access token from cookies by calling the refresh endpoint.
 * Backend sets httpOnly cookies after login, and refresh endpoint returns the access token.
 */
async function getTokenFromCookies(): Promise<string | null> {
  try {
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
