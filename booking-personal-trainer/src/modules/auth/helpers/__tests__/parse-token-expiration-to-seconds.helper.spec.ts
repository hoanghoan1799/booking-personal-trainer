import { parseTokenExpirationStringToSeconds } from '../parse-token-expiration-to-seconds.helper';

describe('parseTokenExpirationStringToSeconds', () => {
  it('should parse seconds', () => {
    expect(parseTokenExpirationStringToSeconds('10s')).toBe(10);
  });

  it('should parse minutes', () => {
    expect(parseTokenExpirationStringToSeconds('2m')).toBe(120);
  });

  it('should parse hours', () => {
    expect(parseTokenExpirationStringToSeconds('3h')).toBe(10800);
  });

  it('should parse days', () => {
    expect(parseTokenExpirationStringToSeconds('1d')).toBe(86400);
  });

  it('should throw on invalid format', () => {
    expect(() => parseTokenExpirationStringToSeconds('15')).toThrow(
      'Invalid expiration format',
    );
  });

  it('should throw on invalid unit', () => {
    expect(() => parseTokenExpirationStringToSeconds('15y')).toThrow(
      'Invalid expiration format',
    );
  });
});
