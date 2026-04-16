import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/route.constants";
import type { Notification } from "@/types/notification.types";

type ApiResponse<T> = {
  readonly data: T;
  readonly meta?: {
    readonly page: number;
    readonly limit: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
};

export type GetNotificationsQuery = {
  readonly page?: number;
  readonly limit?: number;
  readonly isRead?: boolean;
};

const buildQueryString = (params: GetNotificationsQuery): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    searchParams.set(key, String(value));
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
};

export const getNotifications = async (
  query: GetNotificationsQuery = {},
): Promise<{
  readonly notifications: Notification[];
  readonly meta: NonNullable<ApiResponse<unknown>["meta"]>;
}> => {
  const qs = buildQueryString({ ...query, limit: query.limit ?? 20 });
  const res = await apiFetch<ApiResponse<Notification[]>>(
    `${API_ENDPOINTS.NOTIFICATIONS}${qs}`,
  );
  return {
    notifications: res.data,
    meta: res.meta ?? { page: 1, limit: 20, totalItems: res.data.length, totalPages: 1 },
  };
};

export const getUnreadCount = async (): Promise<number> => {
  const res = await apiFetch<ApiResponse<{ unreadCount: number }>>(
    `${API_ENDPOINTS.NOTIFICATIONS}/unread-count`,
  );
  return res.data.unreadCount;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiFetch<ApiResponse<{ id: string; isRead: true }>>(
    `${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`,
    { method: "PATCH" },
  );
};

export const markAllNotificationsRead = async (): Promise<number> => {
  const res = await apiFetch<ApiResponse<{ updated: number }>>(
    `${API_ENDPOINTS.NOTIFICATIONS}/read-all`,
    { method: "PATCH" },
  );
  return res.data.updated;
};

