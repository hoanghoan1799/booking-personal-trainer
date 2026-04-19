import dayjs from '../utils/date-time/utc-dayjs';

/**
 * Add the given number of minutes to the given date.
 *
 * @param {Date} date The date to which minutes will be added.
 * @param {number} minutes The number of minutes to add.
 * @returns {Date} The resulting date after adding the minutes.
 */
export const addMinutesToDate = (date: Date, minutes: number): Date => {
  return dayjs(date).add(minutes, 'minute').toDate();
};
