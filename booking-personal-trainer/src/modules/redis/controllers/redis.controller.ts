import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// Commons
import { Public } from '../../../common/decorators/public.decorator';

// Services
import { RedisService } from '../services/redis.service';
import type { RedisHealthResponse } from '../types/redis-health-response.type';

@ApiTags('Redis')
@Controller('redis')
export class RedisController {
  public constructor(private readonly redisService: RedisService) {}

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Redis health check',
    description: 'Verifies Redis connectivity via PING and SET/GET probe.',
  })
  @ApiResponse({
    status: 200,
    description: 'Redis health status',
  })
  public async getHealth(): Promise<RedisHealthResponse> {
    return await this.redisService.checkHealth();
  }
}
