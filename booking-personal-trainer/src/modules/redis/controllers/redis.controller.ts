import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// Commons
import { Public } from '../../../common/decorators/public.decorator';

// Services
import { RedisService } from '../services/redis.service';
import type { RedisHealthResponse } from '../types/redis-health-response.type';
import { RedisSwagger } from '../constants/redis-swagger.constants';

@ApiTags('Redis')
@Controller('redis')
export class RedisController {
  public constructor(private readonly redisService: RedisService) {}

  @Public()
  @Get('health')
  @ApiOperation(RedisSwagger.Controller.ApiOperation.Health)
  @ApiResponse(RedisSwagger.Controller.ApiResponse.HealthOk)
  public async getHealth(): Promise<RedisHealthResponse> {
    return await this.redisService.checkHealth();
  }
}
