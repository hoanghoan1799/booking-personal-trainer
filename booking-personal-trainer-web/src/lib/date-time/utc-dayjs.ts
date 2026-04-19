import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);
dayjs.extend(advancedFormat);

/**
 * Application dayjs with UTC parsing and calendar plugins (no IANA time zone).
 */
export default dayjs;
