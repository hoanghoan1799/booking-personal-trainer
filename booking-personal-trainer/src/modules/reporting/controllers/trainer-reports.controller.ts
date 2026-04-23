import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../../../common/decorators/role.decorator';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';
import { UserRole } from '../../../common/enums/user/user.enum';

import type { JwtAuthPayload } from '../../auth/types/jwt-auth.type';
import { LoyalUsersQueryDto } from '../dtos/loyal-users-query.dto';
import { LoyalUserRowDto } from '../dtos/loyal-user-row.dto';
import { RevenueBucketRowDto } from '../dtos/revenue-bucket-row.dto';
import { RevenueReportQueryDto } from '../dtos/revenue-report-query.dto';
import { TrainerKpiQueryDto } from '../dtos/trainer-kpi-query.dto';
import { TrainerKpiRowDto } from '../dtos/trainer-kpi-row.dto';
import { LoyalUsersReportService } from '../services/loyal-users-report.service';
import { RevenueReportService } from '../services/revenue-report.service';
import { TrainerKpiReportService } from '../services/trainer-kpi-report.service';
import { ReportingSwagger } from '../constants/reporting-swagger.constants';

@ApiTags('Reporting (Trainer)')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trainer/reports')
export class TrainerReportsController {
  constructor(
    private readonly revenueReportService: RevenueReportService,
    private readonly trainerKpiReportService: TrainerKpiReportService,
    private readonly loyalUsersReportService: LoyalUsersReportService,
  ) {}

  @Roles(UserRole.TRAINER)
  @Get('revenue')
  @ApiOperation(ReportingSwagger.Controller.TrainerReports.ApiOperation.Revenue)
  @ApiResponse(ReportingSwagger.Controller.TrainerReports.ApiResponse.RevenueOk)
  public async getRevenue(
    @CurrentUser() currentUser: JwtAuthPayload,
    @Query() query: RevenueReportQueryDto,
  ): Promise<BaseResponseDto<RevenueBucketRowDto[]>> {
    const data: RevenueBucketRowDto[] =
      await this.revenueReportService.getRevenueBuckets({
        query,
        trainerUserIdFilter: currentUser.id,
      });
    return BaseResponseDto.ok(data);
  }

  @Roles(UserRole.TRAINER)
  @Get('kpi')
  @ApiOperation(ReportingSwagger.Controller.TrainerReports.ApiOperation.Kpi)
  @ApiResponse(ReportingSwagger.Controller.TrainerReports.ApiResponse.KpiOk)
  public async getKpi(
    @CurrentUser() currentUser: JwtAuthPayload,
    @Query() query: TrainerKpiQueryDto,
  ): Promise<BaseResponseDto<TrainerKpiRowDto[]>> {
    const data: TrainerKpiRowDto[] =
      await this.trainerKpiReportService.getTrainerKpiRows({
        query,
        trainerUserIdFilter: currentUser.id,
      });
    return BaseResponseDto.ok(data);
  }

  @Roles(UserRole.TRAINER)
  @Get('loyal-users')
  @ApiOperation(
    ReportingSwagger.Controller.TrainerReports.ApiOperation.LoyalUsers,
  )
  @ApiResponse(
    ReportingSwagger.Controller.TrainerReports.ApiResponse.LoyalUsersOk,
  )
  public async getLoyalUsers(
    @CurrentUser() currentUser: JwtAuthPayload,
    @Query() query: LoyalUsersQueryDto,
  ): Promise<BaseResponseDto<LoyalUserRowDto[]>> {
    const data: LoyalUserRowDto[] =
      await this.loyalUsersReportService.getLoyalUsers({
        query,
        trainerUserIdFilter: currentUser.id,
      });
    return BaseResponseDto.ok(data);
  }
}
