import type { User } from "@/types/user.types";
import { apiFetch } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/error.utils";
import { setTokens, clearTokens, setAuthSessionMethod } from "@/lib/token";
import { getRefreshToken } from "@/lib/token";

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

interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    userName: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function login(data: LoginBody): Promise<ApiResponse<AuthResponseData>> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = getApiErrorMessage(body) || "Login failed";
    throw new Error(message);
  }

  const result = (await res.json()) as ApiResponse<AuthResponseData>;
  const { accessToken, refreshToken } = result.data;
  setTokens(accessToken, refreshToken);
  setAuthSessionMethod("credentials");
  return result;
}

export async function register(data: RegisterBody): Promise<ApiResponse<AuthResponseData>> {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = getApiErrorMessage(body) || "Registration failed";
    throw new Error(message);
  }

  const result = (await res.json()) as ApiResponse<AuthResponseData>;
  const { accessToken, refreshToken } = result.data;
  setTokens(accessToken, refreshToken);
  setAuthSessionMethod("credentials");
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

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearTokens();
  }
}
