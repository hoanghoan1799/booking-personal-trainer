"use client";

import type { User } from "@auth0/nextjs-auth0/types";
import { usePathname } from "next/navigation";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AUTH0_PROFILE_ROUTE } from "@/lib/auth0-profile-route";
import {
  AUTH0_SIGNOUT_PENDING_TTL_MS,
  clearAuth0SignOutPending,
  isAuth0SignOutPending,
} from "@/lib/auth0-signout-pending";
import { getAccessToken, subscribeAccessTokenChange } from "@/lib/token";

const PUBLIC_AUTH_PREFIXES = ["/signin", "/signup", "/register"] as const;

const isPublicAuthPath = (pathname: string): boolean =>
  PUBLIC_AUTH_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

const fetchAuth0Profile = async (
  url: string,
  signal: AbortSignal,
): Promise<User | null> => {
  const res = await fetch(url, { credentials: "same-origin", signal });
  if (res.status === 204) {
    return null;
  }
  if (!res.ok) {
    if (res.status === 401) {
      return null;
    }
    throw new Error("Unauthorized");
  }
  return res.json() as Promise<User>;
};

type Auth0SessionContextValue = {
  readonly user: User | null;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly invalidate: () => void;
};

const Auth0SessionContext = createContext<Auth0SessionContextValue | null>(
  null,
);

export const Auth0SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();

  const [hasBackendSession, setHasBackendSession] = useState(false);
  const isPublic = isPublicAuthPath(pathname);
  const [, setSignOutPendingTtlBump] = useState(0);
  useEffect(() => {
    if (isPublic) {
      clearAuth0SignOutPending();
    }
  }, [isPublic]);
  const auth0SignOutPending = isAuth0SignOutPending();
  useEffect(() => {
    if (!auth0SignOutPending) {
      return;
    }
    const id = window.setTimeout(() => {
      clearAuth0SignOutPending();
      setSignOutPendingTtlBump((n) => n + 1);
    }, AUTH0_SIGNOUT_PENDING_TTL_MS + 150);
    return () => window.clearTimeout(id);
  }, [auth0SignOutPending]);

  useLayoutEffect(() => {
    const sync = (): void => {
      setHasBackendSession(getAccessToken() !== "");
    };
    sync();
    return subscribeAccessTokenChange(sync);
  }, []);

  const shouldFetch =
    !isPublic && !hasBackendSession && !auth0SignOutPending;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(shouldFetch);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);
  useEffect(() => {
    if (!shouldFetch) {
      setUser(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    const abortController = new AbortController();
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);
    void (async () => {
      try {
        const profile = await fetchAuth0Profile(
          AUTH0_PROFILE_ROUTE,
          abortController.signal,
        );
        if (requestId !== requestIdRef.current) {
          return;
        }
        setUser(profile);
      } catch (err) {
        if (abortController.signal.aborted) {
          return;
        }
        if (requestId !== requestIdRef.current) {
          return;
        }
        setError(err instanceof Error ? err : new Error("Unauthorized"));
        setUser(null);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      abortController.abort();
    };
  }, [shouldFetch, reloadToken]);
  const invalidate = useCallback(() => {
    if (!shouldFetch) {
      return;
    }
    setReloadToken((t) => t + 1);
  }, [shouldFetch]);
  const value = useMemo(
    () => ({
      user: shouldFetch ? user : null,
      isLoading: shouldFetch ? isLoading : false,
      error: shouldFetch ? error : null,
      invalidate,
    }),
    [shouldFetch, user, isLoading, error, invalidate],
  );
  return (
    <Auth0SessionContext.Provider value={value}>
      {children}
    </Auth0SessionContext.Provider>
  );
};

export const useAuth0Session = (): Auth0SessionContextValue => {
  const ctx = useContext(Auth0SessionContext);
  if (!ctx) {
    throw new Error("useAuth0Session must be used within Auth0SessionProvider");
  }
  return ctx;
};
