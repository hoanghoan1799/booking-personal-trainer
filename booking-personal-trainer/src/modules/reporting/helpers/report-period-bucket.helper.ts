import { ReportBucket } from '../enums/report-bucket.enum';

/**
 * UTC calendar bucketing for revenue reports.
 */
export class ReportPeriodBucketHelper {
  /**
   * Returns the first instant of the calendar month containing `d` (UTC).
   */
  public static getMonthBucketStartUtc(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  }

  /**
   * Returns the first instant of the calendar quarter containing `d` (UTC).
   */
  public static getQuarterBucketStartUtc(d: Date): Date {
    const month: number = d.getUTCMonth();
    const quarterStartMonth: number = Math.floor(month / 3) * 3;
    return new Date(Date.UTC(d.getUTCFullYear(), quarterStartMonth, 1));
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
   * Exclusive end instant of the bucket (first instant after the bucket).
   */
  public static getBucketEndExclusiveUtc(
    bucketStart: Date,
    bucket: ReportBucket,
  ): Date {
    const y: number = bucketStart.getUTCFullYear();
    const m: number = bucketStart.getUTCMonth();
    if (bucket === ReportBucket.QUARTER) {
      return new Date(Date.UTC(y, m + 3, 1));
    }
    return new Date(Date.UTC(y, m + 1, 1));
  }
}
