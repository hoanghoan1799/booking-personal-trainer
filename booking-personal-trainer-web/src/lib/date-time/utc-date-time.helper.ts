import dayjs from "./utc-dayjs";

export const utcNowAsDate = (): Date => {
  return dayjs.utc().toDate();
};

export const utcNowIso = (): string => {
  return dayjs.utc().toISOString();
};

export const parseUtcIsoToDate = (iso: string): Date => {
  return dayjs.utc(iso).toDate();
};

export const parseInstantToUtcDate = (
  input: Date | string | number | null | undefined,
): Date | null => {
  if (input == null) {
    return null;
  }
  const instant = dayjs.utc(input);
  return instant.isValid() ? instant.toDate() : null;
};

export const formatInstantUtc = (iso: string, pattern = "DD/MM/YYYY HH:mm"): string => {
  const d = dayjs.utc(iso);
  return d.isValid() ? d.format(pattern) : iso;
};

export const formatPeriodUtcFromUtcIso = (startIso: string, endIso: string): string => {
  const s = dayjs.utc(startIso);
  const e = dayjs.utc(endIso);
  if (!s.isValid() || !e.isValid()) {
    return `${startIso} → ${endIso}`;
  }
  return `${s.format("DD/MM/YYYY")} → ${e.format("DD/MM/YYYY")}`;
};

export const utcCurrentYear = (): number => {
  return dayjs.utc().year();
};

export const dateInputToUtcIsoStartOfUtcDay = (value: string): string => {
  const base = dayjs.utc(value, "YYYY-MM-DD", true);
  if (!base.isValid()) {
    return dayjs.utc(value).toISOString();
  }
  return base.startOf("day").toISOString();
};

export const dateInputToUtcIsoExclusiveEndNextUtcDay = (value: string): string => {
  const base = dayjs.utc(value, "YYYY-MM-DD", true);
  if (!base.isValid()) {
    return dayjs.utc(value).toISOString();
  }
  return base.add(1, "day").startOf("day").toISOString();
};

export const normalizeUnknownToUtcIso = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return dayjs.utc(value).toISOString();
  }
  const parsed = dayjs.utc(String(value));
  return parsed.isValid() ? parsed.toISOString() : utcNowIso();
};

export const toDateTimeLocalUtcFromUtcDate = (instant: Date): string => {
  return dayjs.utc(instant).format("YYYY-MM-DDTHH:mm");
};

export const formatDateRangeLabelUtc = (startIso: string, endIso: string): string => {
  const s = dayjs.utc(startIso);
  const e = dayjs.utc(endIso);
  if (!s.isValid() || !e.isValid()) {
    return "—";
  }
  const pattern = "ddd, D MMM YYYY, HH:mm";
  return `${s.format(pattern)} → ${e.format(pattern)}`;
};
