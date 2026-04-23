/**
 * Parses expiration string (e.g. "15m", "7d") to seconds.
 * @param expiration The expiration string.
 * @returns The expiration time in seconds.
 */
export const parseTokenExpirationStringToSeconds = (
  expiration: string,
): number => {
  const match: RegExpMatchArray | null = expiration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiration format: ${expiration}`);
  }
  const value = parseInt(match[1] ?? '0', 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      throw new Error(`Unknown expiration unit: ${String(unit)}`);
  }
};
