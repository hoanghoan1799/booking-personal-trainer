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
import type { User } from "@/types/user.types";
import { getProfile } from "@/services/auth/auth.service";
import { getAccessToken, subscribeAccessTokenChange } from "@/lib/token";

type ProfileContextValue = {
  readonly user: User | null;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<void>;
  readonly updateUser: (updates: Partial<User>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const getHasAccessTokenSnapshot = (): boolean => getAccessToken() !== "";

const getHasAccessTokenServerSnapshot = (): boolean => false;

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const hasAccessToken = useSyncExternalStore(
    subscribeAccessTokenChange,
    getHasAccessTokenSnapshot,
    getHasAccessTokenServerSnapshot,
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const fetchProfile = useCallback(async () => {
    if (inFlightRef.current) {
      await inFlightRef.current;
      return;
    }
    const run = (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await getProfile();
        setUser(profile);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load profile"),
        );
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
    inFlightRef.current = run.finally(() => {
      inFlightRef.current = null;
    });
    await inFlightRef.current;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!hasAccessToken) {
      setIsLoading(false);
      setUser(null);
      setError(null);
      return;
    }
    void fetchProfile();
  }, [hasAccessToken, fetchProfile]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      error,
      refetch: fetchProfile,
      updateUser,
    }),
    [user, isLoading, error, fetchProfile, updateUser],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextValue => {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
};
