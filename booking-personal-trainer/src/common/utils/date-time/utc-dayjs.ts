import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Application dayjs with UTC parsing and math (no default local time zone).
 */
export default dayjs;
