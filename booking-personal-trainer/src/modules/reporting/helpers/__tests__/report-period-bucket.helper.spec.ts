import { ReportBucket } from '../../enums/report-bucket.enum';
import { ReportPeriodBucketHelper } from '../report-period-bucket.helper';

describe('ReportPeriodBucketHelper', () => {
  it('getMonthBucketStartUtc returns first day of month UTC', () => {
    const d = new Date('2026-03-15T12:00:00.000Z');
    const actual = ReportPeriodBucketHelper.getMonthBucketStartUtc(d);
    expect(actual.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('getQuarterBucketStartUtc returns Q1 start for January', () => {
    const d = new Date('2026-01-31T00:00:00.000Z');
    const actual = ReportPeriodBucketHelper.getQuarterBucketStartUtc(d);
    expect(actual.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('getQuarterBucketStartUtc returns Q2 start for April', () => {
    const d = new Date('2026-04-10T00:00:00.000Z');
    const actual = ReportPeriodBucketHelper.getBucketStartUtc(
      d,
      ReportBucket.QUARTER,
    );
    expect(actual.toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });

  it('getBucketEndExclusiveUtc returns next month for MONTH', () => {
    const start = new Date('2026-02-01T00:00:00.000Z');
    const actual = ReportPeriodBucketHelper.getBucketEndExclusiveUtc(
      start,
      ReportBucket.MONTH,
    );
    expect(actual.toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('getBucketEndExclusiveUtc adds three months for QUARTER', () => {
    const start = new Date('2026-04-01T00:00:00.000Z');
    const actual = ReportPeriodBucketHelper.getBucketEndExclusiveUtc(
      start,
      ReportBucket.QUARTER,
    );
    expect(actual.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });
});
