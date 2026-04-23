import { isUniqueViolation } from '../workout-database-error.helper';

describe('workout-database-error.helper', () => {
  it('should return true when code matches unique violation', () => {
    const actual = isUniqueViolation({ code: '23505' });
    expect(actual).toBe(true);
  });

  it('should return false when code does not match', () => {
    const actual = isUniqueViolation({ code: 'other' });
    expect(actual).toBe(false);
  });

  it('should return false for null/undefined/non-object', () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
    expect(isUniqueViolation('x')).toBe(false);
  });
});
