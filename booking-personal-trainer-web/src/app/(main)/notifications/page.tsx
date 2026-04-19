"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Notification } from "@/types/notification.types";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications/notifications.service";
import { formatInstantUtc } from "@/lib/date-time/utc-date-time.helper";
import dayjs from "@/lib/date-time/utc-dayjs";

type Tab = "UNREAD" | "ALL";

const PAGE_SIZE = 20 as const;

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("UNREAD");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const isReadFilter = useMemo(() => {
    if (tab === "UNREAD") {
      return false;
    }
    return undefined;
  }, [tab]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getNotifications({
        page,
        limit: PAGE_SIZE,
        isRead: isReadFilter,
      });
      setItems(res.notifications);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [page, isReadFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    },
    [],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const formatTimestamp = (iso?: string): string => {
    if (!iso) return "";
    if (!dayjs.utc(iso).isValid()) return "";
    return formatInstantUtc(iso, "MMM D, YYYY • HH:mm");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time updates from bookings, payments, workouts, and admin actions.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Mark all read
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setTab("UNREAD");
            setPage(1);
          }}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "UNREAD"
              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => {
            setTab("ALL");
            setPage(1);
          }}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "ALL"
              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          }`}
        >
          All
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
            No notifications.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                      {n.title}
                    </h3>
                    {!n.isRead && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-500/10 dark:text-orange-300">
                        Unread
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {n.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(n.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.isRead && (
                    <button
                      onClick={() => void handleMarkRead(n.id)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 p-3 dark:border-gray-800">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

