/**
 * Formats an integer cent amount as a major currency string (e.g. USD display).
 */
export const formatCents = (cents: number): string => {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}${dollars.toLocaleString()}.${String(remainder).padStart(2, "0")}`;
};
