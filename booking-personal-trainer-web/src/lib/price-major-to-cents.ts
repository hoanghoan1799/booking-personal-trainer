/**
 * Parses a major-unit amount (e.g. dollars) typed by the user into integer cents for the API.
 * Examples: "50" → 5000, "12.99" → 1299.
 */
export const parseMajorUnitsToCents = (raw: string): number | null => {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) {
    return null;
  }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const major = Number(trimmed);
  if (!Number.isFinite(major) || major < 0) {
    return null;
  }
  const cents = Math.round(major * 100);
  if (cents < 1) {
    return null;
  }
  return cents;
};

export const normalizeCurrencyCode = (raw: string): string | null => {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed.length !== 3) {
    return null;
  }
  if (!/^[A-Z]{3}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
};
