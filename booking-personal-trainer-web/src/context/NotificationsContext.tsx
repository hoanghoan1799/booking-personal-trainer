"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Notification } from "@/types/notification.types";
import { getAccessToken, subscribeAccessTokenChange } from "@/lib/token";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications/notifications.service";
import {
  useNotificationsStream,
  type NotificationsStreamEvent,
} from "@/hooks/use-notifications-stream";

type NotificationsContextValue = {
  readonly notifications: Notification[];
  readonly unreadCount: number;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly isStreamConnected: boolean;
  readonly refresh: () => Promise<void>;
  readonly markRead: (id: string) => Promise<void>;
  readonly markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const getHasAccessTokenSnapshot = (): boolean => getAccessToken() !== "";
const getHasAccessTokenServerSnapshot = (): boolean => false;

const MAX_DROPDOWN_ITEMS = 10 as const;

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const hasAccessToken = useSyncExternalStore(
    subscribeAccessTokenChange,
    getHasAccessTokenSnapshot,
    getHasAccessTokenServerSnapshot,
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const refresh = useCallback(async () => {
    if (!hasAccessToken) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      setError(null);
      return;
    }
    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }
    const run = (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [list, count] = await Promise.all([
          getNotifications({ page: 1, limit: MAX_DROPDOWN_ITEMS }),
          getUnreadCount(),
        ]);
        setNotifications(list.notifications);
        setUnreadCount(count);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load notifications"));
      } finally {
        setIsLoading(false);
      }
    })();
    inFlightRef.current = run.finally(() => {
      inFlightRef.current = null;
    });
    await inFlightRef.current;
  }, [hasAccessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleStreamNotification = useCallback((event: NotificationsStreamEvent) => {
    const created: Notification = {
      id: event.notificationId,
      type: event.type,
      title: event.title,
      message: event.message,
      data: event.data,
      isRead: false,
      createdAt: event.createdAt,
    } as Notification;
    setNotifications((prev) => {
      const next = [created, ...prev.filter((n) => n.id !== created.id)];
      return next.slice(0, MAX_DROPDOWN_ITEMS);
    });
    setUnreadCount((n) => n + 1);
  }, []);

  const { isConnected: isStreamConnected } = useNotificationsStream({
    enabled: hasAccessToken,
    onNotification: handleStreamNotification,
  });

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((n) => Math.max(0, n - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      isStreamConnected,
      refresh,
      markRead,
      markAllRead,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      error,
      isStreamConnected,
      refresh,
      markRead,
      markAllRead,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextValue => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
};

