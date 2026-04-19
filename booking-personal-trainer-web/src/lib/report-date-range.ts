const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * Returns UTC ISO strings for a sliding window [from, to) suitable for reporting APIs.
 */
export const getUtcRangeIso = (daysBack: number): { from: string; to: string } => {
  const to = new Date();
  const from = new Date(to.getTime() - daysBack * MILLISECONDS_PER_DAY);
  return { from: from.toISOString(), to: to.toISOString() };
};
