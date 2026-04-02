import type { User } from "@/types/user.types";
import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/route.constants";

const ROLE_VALUES = ["ADMIN", "TRAINER", "TRAINEE"] as const;
export type UserRole = (typeof ROLE_VALUES)[number];

interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface GetUsersQuery {
  role?: "ADMIN" | "TRAINER" | "TRAINEE";
  approvalStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  userType?: "TRAINER" | "TRAINEE";
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetUsersResponse {
  users: User[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

function buildQueryString(params: GetUsersQuery): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export async function getUsers(
  query: GetUsersQuery = {},
): Promise<GetUsersResponse> {
  const qs = buildQueryString({
    ...query,
    limit: query.limit ?? 100,
  });
  const res = await apiFetch<ApiResponse<User[]>>(`${API_ENDPOINTS.USERS}${qs}`);
  return {
    users: res.data,
    meta: res.meta ?? {
      page: 1,
      limit: 100,
      totalItems: res.data.length,
      totalPages: 1,
    },
  };
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<User> {
  const res = await apiFetch<{ data: User }>(
    `${API_ENDPOINTS.USERS}/${userId}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    },
  );
  return res.data;
}
