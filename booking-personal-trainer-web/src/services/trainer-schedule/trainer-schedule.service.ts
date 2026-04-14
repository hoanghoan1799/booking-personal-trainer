import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/route.constants";
import type {
  BaseResponseDto,
  CreateTrainerAvailabilityInput,
  CreateTrainerTimeOffInput,
  GetPagedInput,
  TrainerAvailability,
  TrainerTimeOff,
  UpdateTrainerAvailabilityInput,
  UpdateTrainerTimeOffInput,
} from "./trainer-schedule.types";

function buildQueryString(params: GetPagedInput): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

const getMyAvailabilitiesEndpoint = (): string =>
  `${API_ENDPOINTS.TRAINERS}/me/availabilities`;

const getMyTimeOffEndpoint = (): string =>
  `${API_ENDPOINTS.TRAINERS}/me/time-off`;

export async function getMyAvailabilities(
  input: GetPagedInput = {},
): Promise<{ availabilities: TrainerAvailability[] }> {
  const qs = buildQueryString({ ...input, limit: input.limit ?? 100 });
  const res = await apiFetch<BaseResponseDto<TrainerAvailability[]>>(
    `${getMyAvailabilitiesEndpoint()}${qs}`,
  );
  return { availabilities: res.data };
}

export async function createAvailability(
  input: CreateTrainerAvailabilityInput,
): Promise<TrainerAvailability> {
  const res = await apiFetch<BaseResponseDto<TrainerAvailability>>(
    getMyAvailabilitiesEndpoint(),
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function updateAvailability(input: {
  availabilityId: string;
  update: UpdateTrainerAvailabilityInput;
}): Promise<TrainerAvailability> {
  const res = await apiFetch<BaseResponseDto<TrainerAvailability>>(
    `${getMyAvailabilitiesEndpoint()}/${input.availabilityId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input.update),
    },
  );
  return res.data;
}

export async function deleteAvailability(input: {
  availabilityId: string;
}): Promise<void> {
  await apiFetch<unknown>(
    `${getMyAvailabilitiesEndpoint()}/${input.availabilityId}`,
    {
      method: "DELETE",
    },
  );
}

export async function getMyTimeOff(
  input: GetPagedInput = {},
): Promise<{ timeOff: TrainerTimeOff[] }> {
  const qs = buildQueryString({ ...input, limit: input.limit ?? 100 });
  const res = await apiFetch<BaseResponseDto<TrainerTimeOff[]>>(
    `${getMyTimeOffEndpoint()}${qs}`,
  );
  return { timeOff: res.data };
}

export async function createTimeOff(
  input: CreateTrainerTimeOffInput,
): Promise<TrainerTimeOff> {
  const res = await apiFetch<BaseResponseDto<TrainerTimeOff>>(
    getMyTimeOffEndpoint(),
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function updateTimeOff(input: {
  timeOffId: string;
  update: UpdateTrainerTimeOffInput;
}): Promise<TrainerTimeOff> {
  const res = await apiFetch<BaseResponseDto<TrainerTimeOff>>(
    `${getMyTimeOffEndpoint()}/${input.timeOffId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input.update),
    },
  );
  return res.data;
}

export async function deleteTimeOff(input: { timeOffId: string }): Promise<void> {
  await apiFetch<unknown>(`${getMyTimeOffEndpoint()}/${input.timeOffId}`, {
    method: "DELETE",
  });
}

