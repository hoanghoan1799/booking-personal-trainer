import dayjs from "./utc-dayjs";
import { utcNowAsDate } from "./utc-date-time.helper";

const END_HOUR = 24 as const;
const MINUTES_STEP = 30 as const;

export const getIsoDayOfWeek = (date: Date): number => {
  const d = dayjs.utc(date).day();
  return d === 0 ? 7 : d;
};

export const getStartOfWeekMonday = (date: Date): Date => {
  return dayjs.utc(date).startOf("isoWeek").toDate();
};

export const addDays = (date: Date, days: number): Date => {
  return dayjs.utc(date).add(days, "day").startOf("day").toDate();
};

export const startOfLocalDay = (date: Date): Date => {
  return dayjs.utc(date).startOf("day").toDate();
};

export const isPastCalendarDay = (dayDate: Date): boolean => {
  return startOfLocalDay(dayDate).getTime() < startOfLocalDay(utcNowAsDate()).getTime();
};

export const isTodayLocal = (dayDate: Date): boolean => {
  return startOfLocalDay(dayDate).getTime() === startOfLocalDay(utcNowAsDate()).getTime();
};

export const getFirstSelectableMinuteOnDay = (dayDate: Date): number | null => {
  if (isPastCalendarDay(dayDate)) {
    return null;
  }
  const nowMs: number = Date.now();
  for (let m = 0; m <= END_HOUR * 60; m += MINUTES_STEP) {
    const dt = dayjs
      .utc(dayDate)
      .startOf("day")
      .add(Math.floor(m / 60), "hour")
      .add(m % 60, "minute")
      .toDate();
    if (dt.getTime() > nowMs) {
      return m;
    }
  }
  return null;
};

export const clampDragRangeForDay = (
  dayDate: Date,
  anchorMinute: number,
  otherMinute: number,
): { start: number; end: number } | null => {
  const minM = getFirstSelectableMinuteOnDay(dayDate);
  if (minM === null) {
    return null;
  }
  const lo = Math.min(anchorMinute, otherMinute);
  const hi = Math.max(anchorMinute, otherMinute);
  const lo2 = Math.max(lo, minM);
  const hi2 = Math.max(hi, lo2);
  return { start: lo2, end: hi2 };
};

export const getMinutesFromLocalDate = (date: Date): number => {
  const d = dayjs.utc(date);
  return d.hour() * 60 + d.minute();
};

export const getTimeLabel = (date: Date): string => {
  return dayjs.utc(date).format("HH:mm");
};

export const formatDayHeader = (date: Date): string => {
  return dayjs.utc(date).format("ddd MMM D");
};

export const getClockTimeFromIso = (isoString: string): { hour: number; minute: number } | null => {
  const d = dayjs.utc(isoString);
  if (!d.isValid()) {
    return null;
  }
  return { hour: d.hour(), minute: d.minute() };
};

export const buildUtcInstantFromUtcDayAndClockMinutes = (
  dayDate: Date,
  totalMinutes: number,
): Date => {
  return dayjs
    .utc(dayDate)
    .startOf("day")
    .add(Math.floor(totalMinutes / 60), "hour")
    .add(totalMinutes % 60, "minute")
    .toDate();
};

export const utcInstantFromWire = (value: string | Date): Date => {
  return dayjs.utc(value).toDate();
};

export const utcFromMs = (ms: number): Date => {
  return dayjs.utc(ms).toDate();
};
