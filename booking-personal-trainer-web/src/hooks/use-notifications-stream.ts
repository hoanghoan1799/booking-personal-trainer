"use client";

import { useEffect, useRef, useState } from "react";
import { getAccessToken, subscribeAccessTokenChange } from "@/lib/token";

export type NotificationsStreamEvent = {
  readonly notificationId: string;
  readonly type: string;
  readonly title: string;
  readonly message: string;
  readonly data: Record<string, unknown> | null;
  readonly createdAt: string;
};

type UseNotificationsStreamArgs = {
  readonly enabled: boolean;
  readonly onNotification: (event: NotificationsStreamEvent) => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const readLinesFromEventStreamChunk = (input: string): {
  readonly events: string[];
  readonly remainder: string;
} => {
  const parts = input.split("\n\n");
  if (parts.length <= 1) {
    return { events: [], remainder: input };
  }
  const remainder = parts.pop() ?? "";
  return { events: parts, remainder };
};

const executeIsAbortError = (err: unknown): boolean => {
  if (err instanceof DOMException && err.name === "AbortError") {
    return true;
  }
  return err instanceof Error && err.name === "AbortError";
};

const parseEventBlock = (block: string): { readonly event?: string; readonly data?: string } => {
  const lines = block
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
  let event: string | undefined = undefined;
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }
  const data = dataLines.length > 0 ? dataLines.join("\n") : undefined;
  return { event, data };
};

export const useNotificationsStream = (args: UseNotificationsStreamArgs): { readonly isConnected: boolean } => {
  const { enabled, onNotification } = args;
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptRef = useRef(0);
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;
  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return;
    }
    if (!API_URL) {
      console.warn("NEXT_PUBLIC_API_URL is not configured; notifications stream disabled.");
      setIsConnected(false);
      return;
    }
    let isCancelled = false;
    let abortController: AbortController | null = null;
    let timeoutId: number | null = null;
    const connect = async (): Promise<void> => {
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      abortController?.abort();
      abortController = new AbortController();
      const token = getAccessToken();
      if (!token) {
        setIsConnected(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/v1/notifications/stream`, {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
          cache: "no-store",
        });
        if (!res.ok || !res.body) {
          throw new Error(`Stream failed (${res.status})`);
        }
        setIsConnected(true);
        reconnectAttemptRef.current = 0;
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        while (!isCancelled) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const { events, remainder } = readLinesFromEventStreamChunk(buffer);
          buffer = remainder;
          for (const block of events) {
            const parsed = parseEventBlock(block);
            if (!parsed.data) continue;
            if (parsed.event === "heartbeat") continue;
            try {
              const event = JSON.parse(parsed.data) as NotificationsStreamEvent;
              onNotificationRef.current(event);
            } catch {
              // Ignore malformed events.
            }
          }
        }
      } catch (err) {
        if (isCancelled) return;
        if (executeIsAbortError(err)) {
          return;
        }
        setIsConnected(false);
        const attempt = reconnectAttemptRef.current + 1;
        reconnectAttemptRef.current = attempt;
        const delay = Math.min(30_000, 500 * Math.pow(2, Math.min(attempt, 6)));
        timeoutId = window.setTimeout(() => {
          void connect();
        }, delay);
      }
    };
    void connect();
    const unsubscribe = subscribeAccessTokenChange(() => {
      if (isCancelled) return;
      void connect();
    });
    return () => {
      isCancelled = true;
      setIsConnected(false);
      unsubscribe();
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
      abortController?.abort();
    };
  }, [enabled]);
  return { isConnected };
};

