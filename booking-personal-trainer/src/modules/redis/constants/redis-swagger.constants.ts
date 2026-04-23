import { HttpStatus } from '@nestjs/common';
import type { ApiResponseOptions } from '@nestjs/swagger';

export const RedisSwagger = {
  Controller: {
    ApiOperation: {
      Health: {
        summary: 'Redis health check',
        description: 'Verifies Redis connectivity via PING and SET/GET probe.',
      },
    },
    ApiResponse: {
      HealthOk: {
        status: HttpStatus.OK,
        description: 'Redis health status',
      },
    } satisfies Record<string, ApiResponseOptions>,
  },
} as const;
