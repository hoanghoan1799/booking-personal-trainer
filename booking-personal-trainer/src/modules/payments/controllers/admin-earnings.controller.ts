import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../../../common/decorators/role.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';
import { SWAGGER_ACCESS_TOKEN } from '../../../common/constants/api-document.constants';
import { UserRole } from '../../../common/enums/user/user.enum';

import { AdminEarningsQueryDto } from '../dtos/admin-earnings-query.dto';
import { AdminEarningsResponseDto } from '../dtos/admin-earnings-response.dto';
import { AdminEarningsService } from '../services/admin-earnings.service';

@ApiTags('Payments')
@ApiBearerAuth(SWAGGER_ACCESS_TOKEN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments/earnings')
export class AdminEarningsController {
  constructor(private readonly adminEarningsService: AdminEarningsService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Admin earnings dashboard',
    description:
      'Aggregated totals and payers/payees derived from Payments (paid/refunded) grouped by currency.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Earnings snapshot',
    type: AdminEarningsResponseDto,
  })
  async getEarnings(
    @Query() query: AdminEarningsQueryDto,
  ): Promise<BaseResponseDto<AdminEarningsResponseDto>> {
    const result = await this.adminEarningsService.getEarnings(query);
    return BaseResponseDto.ok(result);
  }
}
