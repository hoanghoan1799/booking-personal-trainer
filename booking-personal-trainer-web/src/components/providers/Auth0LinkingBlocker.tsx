"use client";

import { useEffect, useState } from "react";

import {
  AUTH0_LINKING_PENDING_TTL_MS,
  clearAuth0LinkingPending,
  isAuth0LinkingPending,
} from "@/lib/auth0-linking-pending";

export default function Auth0LinkingBlocker(): React.ReactNode {
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    const sync = (): void => {
      setIsBlocking(isAuth0LinkingPending());
    };
    sync();
    const intervalId = window.setInterval(sync, 200);
    const timeoutId = window.setTimeout(() => {
      clearAuth0LinkingPending();
      sync();
    }, AUTH0_LINKING_PENDING_TTL_MS + 200);
    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!isBlocking) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      aria-label="Preparing account linking"
      role="alert"
    >
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-700 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark dark:text-gray-200">
        Redirecting to account linking…
      </div>
    </div>
  );
}

