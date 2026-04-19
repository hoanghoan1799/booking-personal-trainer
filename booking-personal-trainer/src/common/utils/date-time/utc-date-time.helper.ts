import dayjs from './utc-dayjs';

/**
 * Current instant as a UTC-backed {@link Date} (for persistence and APIs).
 */
export const utcNowAsDate = (): Date => {
  return dayjs.utc().toDate();
};

/**
 * Current instant as an ISO-8601 string in UTC (for logs and wire payloads).
 */
export const utcNowIso = (): string => {
  return dayjs.utc().toISOString();
};

/**
 * Parses an API / DB instant into a UTC-backed {@link Date}, or null if invalid.
 */
export const parseInstantToUtcDate = (
  input: Date | string | number | null | undefined,
): Date | null => {
  if (input == null) {
    return null;
  }
  const instant = dayjs.utc(input);
  return instant.isValid() ? instant.toDate() : null;
};

/**
 * Parses a UTC ISO string into a UTC-backed {@link Date}.
 */
export const parseUtcIsoToDate = (iso: string): Date => {
  return dayjs.utc(iso).toDate();
};
