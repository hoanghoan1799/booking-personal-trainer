import { API_PREFIX } from '../../common/constants/app.constant';

/** Versioned API root, e.g. `/api/v1` (global prefix + URI version). */
export const E2E_API_V1_ROOT = `/${API_PREFIX}/v1` as const;

export const e2ePath = (path: string): string => {
  if (path === '') {
    return E2E_API_V1_ROOT;
  }
  const normalized: string = path.startsWith('/') ? path : `/${path}`;
  return `${E2E_API_V1_ROOT}${normalized}`;
};

const HOURS_OFFSET_FOR_FUTURE_BOOKING = 2;
const HOURS_DURATION_BOOKING = 1;

/**
 * A booking window far enough in the future to pass minimum-notice rules.
 */
export const buildFutureBookingTimeRange = (): {
  startTime: string;
  endTime: string;
} => {
  const start = new Date();
  start.setUTCHours(
    start.getUTCHours() + HOURS_OFFSET_FOR_FUTURE_BOOKING,
    0,
    0,
    0,
  );
  const end = new Date(start);
  end.setUTCHours(end.getUTCHours() + HOURS_DURATION_BOOKING, 0, 0, 0);
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

const HOURS_OFFSET_FOR_SECOND_BOOKING = 4;

/**
 * A second, non-overlapping booking window (used when two bookings are needed in one test).
 */
export const buildSecondFutureBookingTimeRange = (): {
  startTime: string;
  endTime: string;
} => {
  const start = new Date();
  start.setUTCHours(
    start.getUTCHours() + HOURS_OFFSET_FOR_SECOND_BOOKING,
    0,
    0,
    0,
  );
  const end = new Date(start);
  end.setUTCHours(end.getUTCHours() + HOURS_DURATION_BOOKING, 0, 0, 0);
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

/**
 * ISO weekday: Monday = 1 … Sunday = 7 (used by trainer availability API).
 */
export const getIsoDayOfWeek = (date: Date): number => {
  const jsDay: number = date.getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
};
