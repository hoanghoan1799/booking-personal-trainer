export type BookingTimeRange = {
  readonly start: Date;
  readonly end: Date;
};

export type BookingTimeSlot = {
  readonly startTime: string;
  readonly endTime: string;
};

export type GetAvailableSlotsInput = {
  readonly trainerId: string;
  readonly rangeStart: Date;
  readonly rangeEnd: Date;
  readonly durationMinutes: number;
  readonly stepMinutes: number;
};

export type GetAvailableTrainersForRangeInput = {
  readonly start: Date;
  readonly end: Date;
};
