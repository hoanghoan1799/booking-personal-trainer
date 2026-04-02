import { addMinutesToDate } from './time.helper';

const MINUTES_ADD_POSITIVE = 30;
const MINUTES_ADD_ZERO = 0;
const MINUTES_SUBTRACT = -30;
const MINUTES_ADD_ONE_HOUR = 60;

describe('addMinutesToDate', () => {
  it('should add positive minutes to a date', () => {
    const inputDate = new Date('2025-02-21T10:00:00.000Z');
    const actual = addMinutesToDate(inputDate, MINUTES_ADD_POSITIVE);
    const expected = new Date('2025-02-21T10:30:00.000Z');
    expect(actual.getTime()).toBe(expected.getTime());
  });

  it('should add zero minutes and return same time', () => {
    const inputDate = new Date('2025-02-21T10:00:00.000Z');
    const actual = addMinutesToDate(inputDate, MINUTES_ADD_ZERO);
    expect(actual.getTime()).toBe(inputDate.getTime());
  });

  it('should add negative minutes (subtract)', () => {
    const inputDate = new Date('2025-02-21T10:30:00.000Z');
    const actual = addMinutesToDate(inputDate, MINUTES_SUBTRACT);
    const expected = new Date('2025-02-21T10:00:00.000Z');
    expect(actual.getTime()).toBe(expected.getTime());
  });

  it('should not mutate the original date', () => {
    const inputDate = new Date('2025-02-21T10:00:00.000Z');
    const originalTime = inputDate.getTime();
    addMinutesToDate(inputDate, MINUTES_ADD_ONE_HOUR);
    expect(inputDate.getTime()).toBe(originalTime);
  });
});
