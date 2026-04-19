import dayjs from "@/lib/date-time/utc-dayjs";

/**
 * Returns UTC ISO strings for a sliding window [from, to) suitable for reporting APIs.
 */
export const getUtcRangeIso = (daysBack: number): { from: string; to: string } => {
  const to = dayjs.utc();
  const from = to.subtract(daysBack, "day");
  return { from: from.toISOString(), to: to.toISOString() };
};
