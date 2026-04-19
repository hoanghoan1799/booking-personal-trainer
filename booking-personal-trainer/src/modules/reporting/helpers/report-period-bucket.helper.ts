import type { Dayjs } from 'dayjs';

import dayjs from '../../../common/utils/date-time/utc-dayjs';

import { ReportBucket } from '../enums/report-bucket.enum';

/**
 * UTC calendar bucketing for revenue reports.
 */
export class ReportPeriodBucketHelper {
  /**
   * Returns the first instant of the UTC calendar month containing `d`.
   */
  public static getMonthBucketStartUtc(d: Date): Date {
    return dayjs.utc(d).startOf('month').toDate();
  }

  /**
   * Returns the first instant of the UTC calendar quarter containing `d`.
   */
  public static getQuarterBucketStartUtc(d: Date): Date {
    const base: Dayjs = dayjs.utc(d);
    const quarterStartMonth: number = Math.floor(base.month() / 3) * 3;
    return base.month(quarterStartMonth).startOf('month').toDate();
  }

  /**
   * Returns bucket start for the given bucket type (UTC).
   */
  public static getBucketStartUtc(d: Date, bucket: ReportBucket): Date {
    if (bucket === ReportBucket.QUARTER) {
      return ReportPeriodBucketHelper.getQuarterBucketStartUtc(d);
    }
    return ReportPeriodBucketHelper.getMonthBucketStartUtc(d);
  }

  /**
   * Exclusive end instant of the bucket (first instant after the bucket, UTC).
   */
  public static getBucketEndExclusiveUtc(
    bucketStart: Date,
    bucket: ReportBucket,
  ): Date {
    const base: Dayjs = dayjs.utc(bucketStart).startOf('month');
    if (bucket === ReportBucket.QUARTER) {
      return base.add(3, 'month').startOf('month').toDate();
    }
    return base.add(1, 'month').startOf('month').toDate();
  }
}
