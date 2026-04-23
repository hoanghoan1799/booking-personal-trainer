import { HttpStatus } from '@nestjs/common';
import type { ApiResponseOptions } from '@nestjs/swagger';

import { LoyalUserRowDto } from '../dtos/loyal-user-row.dto';
import { RevenueBucketRowDto } from '../dtos/revenue-bucket-row.dto';
import { TrainerKpiRowDto } from '../dtos/trainer-kpi-row.dto';
import { ReportingDtoSwagger } from './reporting-swagger-dto.constants';

export const ReportingSwagger = {
  Controller: {
    AdminReports: {
      ApiOperation: {
        Revenue: {
          summary:
            'Monthly or quarterly revenue (GMV, platform fee, trainer share).',
        },
        TrainerKpi: { summary: 'Trainer KPI leaderboard.' },
        LoyalUsers: { summary: 'Users ranked by booking count (global).' },
      },
      ApiResponse: {
        RevenueOk: {
          status: HttpStatus.OK,
          type: [RevenueBucketRowDto],
        } as ApiResponseOptions,
        TrainerKpiOk: {
          status: HttpStatus.OK,
          type: [TrainerKpiRowDto],
        } as ApiResponseOptions,
        LoyalUsersOk: {
          status: HttpStatus.OK,
          type: [LoyalUserRowDto],
        } as ApiResponseOptions,
      } satisfies Record<string, ApiResponseOptions>,
    },
    TrainerReports: {
      ApiOperation: {
        Revenue: {
          summary:
            'Monthly or quarterly revenue for the authenticated trainer.',
        },
        Kpi: { summary: 'KPI metrics for the authenticated trainer.' },
        LoyalUsers: {
          summary: 'Trainees ranked by booking count for this trainer.',
        },
      },
      ApiResponse: {
        RevenueOk: {
          status: HttpStatus.OK,
          type: [RevenueBucketRowDto],
        } as ApiResponseOptions,
        KpiOk: {
          status: HttpStatus.OK,
          type: [TrainerKpiRowDto],
        } as ApiResponseOptions,
        LoyalUsersOk: {
          status: HttpStatus.OK,
          type: [LoyalUserRowDto],
        } as ApiResponseOptions,
      } satisfies Record<string, ApiResponseOptions>,
    },
  },
  Dto: {
    ...ReportingDtoSwagger,
  },
} as const;
