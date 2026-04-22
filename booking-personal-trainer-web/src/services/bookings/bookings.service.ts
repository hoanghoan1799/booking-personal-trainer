import type { User } from "@/types/user.types";
import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/route.constants";

export interface CreateBookingInput {
  trainerId: string;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  trainer?: User | null;
  trainee?: User | null;
  status: string;
  statusChangedAt?: string | null;
  cancelledById?: string | null;
  cancellationReason?: string | null;
  rejectionReason?: string | null;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface GetBookingsQuery {
  traineeId?: string;
  trainerId?: string;
  status?: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
  page?: number;
  limit?: number;
  order?: "ASC" | "DESC";
}

export interface GetBookingsResponse {
  bookings: Booking[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

function buildQueryString(params: GetBookingsQuery): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export async function getBookings(
  query: GetBookingsQuery = {},
): Promise<GetBookingsResponse> {
  const qs = buildQueryString({ ...query, limit: query.limit ?? 50 });
  const res = await apiFetch<ApiResponse<Booking[]>>(
    `${API_ENDPOINTS.BOOKINGS}${qs}`,
  );
  return {
    bookings: res.data,
    meta: res.meta ?? {
      page: 1,
      limit: 50,
      totalItems: res.data.length,
      totalPages: 1,
    },
  };
}

export async function createBooking(
  input: CreateBookingInput,
): Promise<void> {
  await apiFetch<ApiResponse<unknown>>(
    API_ENDPOINTS.BOOKINGS,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export type CreateBookingsBulkPeriod = "day" | "week" | "month" | "year";

export interface CreateBookingsBulkInput {
  trainerId: string;
  startDate: string;
  startClockTime: string;
  endClockTime: string;
  period: CreateBookingsBulkPeriod;
}

export async function createBookingsBulk(
  input: CreateBookingsBulkInput,
): Promise<void> {
  await apiFetch<ApiResponse<unknown>>(
    `${API_ENDPOINTS.BOOKINGS}/bulk`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";

export async function updateBookingStatus(
  bookingId: string,
  input: { status: BookingStatus; cancellationReason?: string; rejectionReason?: string },
): Promise<Booking> {
  const res = await apiFetch<ApiResponse<Booking>>(
    `${API_ENDPOINTS.BOOKINGS}/${bookingId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return res.data;
}
