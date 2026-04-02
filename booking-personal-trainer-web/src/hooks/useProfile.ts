"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types/user.types";
import { getProfile } from "@/services/auth/auth.service";

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load profile"));
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return { user, isLoading, error, refetch: fetchProfile, updateUser };
}
