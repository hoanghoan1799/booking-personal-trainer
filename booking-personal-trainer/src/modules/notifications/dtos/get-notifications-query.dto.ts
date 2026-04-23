import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

import { NotificationsSwagger } from '../constants/notifications-swagger.constants';

export class GetNotificationsQueryDto {
  @ApiPropertyOptional(
    NotificationsSwagger.Dto.GetNotificationsQuery.ApiPropertyOptional.Page,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional(
    NotificationsSwagger.Dto.GetNotificationsQuery.ApiPropertyOptional.Limit,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional(
    NotificationsSwagger.Dto.GetNotificationsQuery.ApiPropertyOptional.IsRead,
  )
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
