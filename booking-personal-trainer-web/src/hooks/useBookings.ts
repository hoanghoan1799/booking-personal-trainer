"use client";

import { useCallback, useEffect, useState } from "react";
import type { Booking } from "@/services/bookings/bookings.service";
import { getBookings } from "@/services/bookings/bookings.service";
import { useProfile } from "./useProfile";

export function useBookings() {
  const { user: currentUser, isLoading: isProfileLoading } = useProfile();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [meta, setMeta] = useState<{
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const role = currentUser.role as string;

      if (role === "ADMIN") {
        const res = await getBookings({ limit: 100 });
        setBookings(res.bookings);
        setMeta(res.meta);
      } else if (role === "TRAINEE") {
        const res = await getBookings({
          traineeId: currentUser.id,
          limit: 100,
        });
        setBookings(res.bookings);
        setMeta(res.meta);
      } else if (role === "TRAINER") {
        const res = await getBookings({
          trainerId: currentUser.id,
          limit: 100,
        });
        setBookings(res.bookings);
        setMeta(res.meta);
      } else {
        setBookings([]);
        setMeta(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load bookings"));
      setBookings([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isProfileLoading) return;
    fetchBookings();
  }, [fetchBookings, isProfileLoading]);

  return {
    bookings,
    meta,
    isLoading: isProfileLoading || isLoading,
    error,
    refetch: fetchBookings,
  };
}
