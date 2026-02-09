import type { User } from "@/types/user.types";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, setAccessToken } from "@/lib/token";

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

export async function login(data: LoginBody) {
 const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // IMPORTANT
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Login failed');
  }
  
  const result = await res.json();
  if (result.accessToken) {
    setAccessToken(result.accessToken);
  }
  return result;
}

export async function register(data: RegisterBody) {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Registration failed");
  }

  return res.json();
}

export async function getProfile(): Promise<User> {
  const res = await apiFetch<ApiResponse<User>>("/api/v1/auth/profile");
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
