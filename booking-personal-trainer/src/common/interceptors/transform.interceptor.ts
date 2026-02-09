import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

// DTOs
import { BaseResponse } from '../dtos/base-response.dto';

export type ClassConstructor<T> = new (...args: any[]) => T;

@Injectable()
export class SerializeInterceptor<T> implements NestInterceptor {
  constructor(private dto: ClassConstructor<T>) {}

  intercept(
    _context: ExecutionContext,
    handler: CallHandler,
  ): Observable<BaseResponse<T | T[]>> {
    return handler.handle().pipe(
      map((res: BaseResponse<T | T[]>) => {
        if (!res || !res.data) return res;

        return {
          ...res,
          data: plainToInstance(this.dto, res.data, {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          }),
        };
      }),
    );
  }
}
