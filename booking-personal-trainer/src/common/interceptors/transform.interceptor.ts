import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

// DTOs
import { BaseResponseDto } from '../dtos/base-response.dto';

export type ClassConstructor<T> = new (...args: any[]) => T;

@Injectable()
export class SerializeInterceptor<T> implements NestInterceptor {
  constructor(private dto: ClassConstructor<T>) {}

  /**
   * Intercepts the response from the controller and transforms it into an instance of the provided DTO.
   * @param _context The execution context.
   * @param handler The call handler.
   * @returns An observable that emits a transformed response.
   */
  intercept(
    _context: ExecutionContext,
    handler: CallHandler,
  ): Observable<BaseResponseDto<T | T[]>> {
    return handler.handle().pipe(
      map((res: BaseResponseDto<T | T[]>) => {
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
