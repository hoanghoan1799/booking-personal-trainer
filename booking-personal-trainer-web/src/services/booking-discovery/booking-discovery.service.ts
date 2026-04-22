import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/route.constants";
import type { User } from "@/types/user.types";

type ApiResponse<T> = {
  data: T;
};

export type AvailableSlot = {
  startTime: string;
  endTime: string;
};

export type GetAvailableTrainersInput = {
  startTime: string;
  endTime: string;
};

export async function getAvailableTrainers(
  input: GetAvailableTrainersInput,
): Promise<User[]> {
  const searchParams = new URLSearchParams({
    startTime: input.startTime,
    endTime: input.endTime,
  });
  const res = await apiFetch<ApiResponse<User[]>>(
    `${API_ENDPOINTS.BOOKING_DISCOVERY}/available-trainers?${searchParams.toString()}`,
  );
  return res.data;
}

export type GetAvailableSlotsInput = {
  trainerId: string;
  rangeStart: string;
  rangeEnd: string;
  durationMinutes?: number;
  stepMinutes?: number;
};

export async function getAvailableSlots(
  input: GetAvailableSlotsInput,
): Promise<AvailableSlot[]> {
  const searchParams = new URLSearchParams({
    trainerId: input.trainerId,
    rangeStart: input.rangeStart,
    rangeEnd: input.rangeEnd,
  });
  if (input.durationMinutes) {
    searchParams.set("durationMinutes", String(input.durationMinutes));
  }
  if (input.stepMinutes) {
    searchParams.set("stepMinutes", String(input.stepMinutes));
  }
  const res = await apiFetch<ApiResponse<AvailableSlot[]>>(
    `${API_ENDPOINTS.BOOKING_DISCOVERY}/available-slots?${searchParams.toString()}`,
  );
  return res.data;
}

export type GetAvailableTrainersForPeriodInput = {
  startDate: string;
  startClockTime: string;
  endClockTime: string;
  period: "week" | "month" | "year";
};

export async function getAvailableTrainersForPeriod(
  input: GetAvailableTrainersForPeriodInput,
): Promise<User[]> {
  const searchParams = new URLSearchParams({
    startDate: input.startDate,
    startClockTime: input.startClockTime,
    endClockTime: input.endClockTime,
    period: input.period,
  });
  const res = await apiFetch<ApiResponse<User[]>>(
    `${API_ENDPOINTS.BOOKING_DISCOVERY}/available-trainers-for-period?${searchParams.toString()}`,
  );
  return res.data;
}

