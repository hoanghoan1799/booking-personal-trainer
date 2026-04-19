import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../../../common/decorators/role.decorator';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';
import { UserRole } from '../../../common/enums/user/user.enum';

import { LoyalUsersQueryDto } from '../dtos/loyal-users-query.dto';
import { LoyalUserRowDto } from '../dtos/loyal-user-row.dto';
import { RevenueBucketRowDto } from '../dtos/revenue-bucket-row.dto';
import { RevenueReportQueryDto } from '../dtos/revenue-report-query.dto';
import { TrainerKpiQueryDto } from '../dtos/trainer-kpi-query.dto';
import { TrainerKpiRowDto } from '../dtos/trainer-kpi-row.dto';
import { LoyalUsersReportService } from '../services/loyal-users-report.service';
import { RevenueReportService } from '../services/revenue-report.service';
import { TrainerKpiReportService } from '../services/trainer-kpi-report.service';

@ApiTags('Reporting (Admin)')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(
    private readonly revenueReportService: RevenueReportService,
    private readonly trainerKpiReportService: TrainerKpiReportService,
    private readonly loyalUsersReportService: LoyalUsersReportService,
  ) {}

  @Roles(UserRole.ADMIN)
  @Get('revenue')
  @ApiOperation({
    summary: 'Monthly or quarterly revenue (GMV, platform fee, trainer share).',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [RevenueBucketRowDto] })
  public async getRevenue(
    @Query() query: RevenueReportQueryDto,
  ): Promise<BaseResponseDto<RevenueBucketRowDto[]>> {
    const data: RevenueBucketRowDto[] =
      await this.revenueReportService.getRevenueBuckets({
        query,
        trainerUserIdFilter: null,
      });
    return BaseResponseDto.ok(data);
  }

  @Roles(UserRole.ADMIN)
  @Get('trainer-kpi')
  @ApiOperation({ summary: 'Trainer KPI leaderboard.' })
  @ApiResponse({ status: HttpStatus.OK, type: [TrainerKpiRowDto] })
  public async getTrainerKpi(
    @Query() query: TrainerKpiQueryDto,
  ): Promise<BaseResponseDto<TrainerKpiRowDto[]>> {
    const data: TrainerKpiRowDto[] =
      await this.trainerKpiReportService.getTrainerKpiRows({
        query,
        trainerUserIdFilter: null,
      });
    return BaseResponseDto.ok(data);
  }

  @Roles(UserRole.ADMIN)
  @Get('loyal-users')
  @ApiOperation({ summary: 'Users ranked by booking count (global).' })
  @ApiResponse({ status: HttpStatus.OK, type: [LoyalUserRowDto] })
  public async getLoyalUsers(
    @Query() query: LoyalUsersQueryDto,
  ): Promise<BaseResponseDto<LoyalUserRowDto[]>> {
    const data: LoyalUserRowDto[] =
      await this.loyalUsersReportService.getLoyalUsers({
        query,
        trainerUserIdFilter: null,
      });
    return BaseResponseDto.ok(data);
  }
}
