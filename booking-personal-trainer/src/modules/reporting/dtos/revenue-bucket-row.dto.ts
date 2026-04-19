import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsString, MinLength } from 'class-validator';

export class RevenueBucketRowDto {
  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @IsString()
  @MinLength(10)
  bucketStart!: string;

  @ApiProperty({
    description:
      'Exclusive end of the bucket (first instant after the period).',
    example: '2026-02-01T00:00:00.000Z',
  })
  @IsString()
  @MinLength(10)
  bucketEnd!: string;

  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty({ description: 'Net gross (paid minus refunded) in cents.' })
  @IsInt()
  gmvNetCents!: number;

  @ApiProperty()
  @IsInt()
  platformFeeNetCents!: number;

  @ApiProperty()
  @IsInt()
  trainerShareNetCents!: number;

  @ApiProperty({
    description: 'True when any split in this bucket was estimated from bps.',
  })
  @IsBoolean()
  isEstimated!: boolean;
}
