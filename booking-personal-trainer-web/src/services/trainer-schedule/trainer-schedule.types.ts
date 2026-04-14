export type BaseResponseMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type BaseResponseDto<TData> = {
  data: TData;
  meta?: BaseResponseMeta;
};

export type TrainerAvailability = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TrainerTimeOff = {
  id: string;
  reason: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GetPagedInput = {
  page?: number;
  limit?: number;
};

export type CreateTrainerAvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type UpdateTrainerAvailabilityInput = {
  startTime?: string;
  endTime?: string;
};

export type CreateTrainerTimeOffInput = {
  reason: string;
  startTime: string;
  endTime: string;
};

