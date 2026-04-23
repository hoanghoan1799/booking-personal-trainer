import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsString, MinLength } from 'class-validator';

import { ReportingDtoSwagger } from '../constants/reporting-swagger-dto.constants';

export class RevenueBucketRowDto {
  @ApiProperty(ReportingDtoSwagger.RevenueBucketRow.ApiProperty.BucketStart)
  @IsString()
  @MinLength(10)
  bucketStart!: string;

  @ApiProperty(ReportingDtoSwagger.RevenueBucketRow.ApiProperty.BucketEnd)
  @IsString()
  @MinLength(10)
  bucketEnd!: string;

  @ApiProperty()
  @IsString()
  currency!: string;

  @ApiProperty(ReportingDtoSwagger.RevenueBucketRow.ApiProperty.GmvNetCents)
  @IsInt()
  gmvNetCents!: number;

  @ApiProperty()
  @IsInt()
  platformFeeNetCents!: number;

  @ApiProperty()
  @IsInt()
  trainerShareNetCents!: number;

  @ApiProperty(ReportingDtoSwagger.RevenueBucketRow.ApiProperty.IsEstimated)
  @IsBoolean()
  isEstimated!: boolean;
}
