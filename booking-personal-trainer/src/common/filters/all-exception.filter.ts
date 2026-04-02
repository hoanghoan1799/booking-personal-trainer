import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

// Constants
import { ERROR_MESSAGES } from '../constants/message.constant';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.getStatusCode(exception);
    const error = this.getErrorResponse(exception, status);

    response.status(status).json({
      errors: error,
    });
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorResponse(
    exception: unknown,
    statusCode: number,
  ): Record<string, unknown> {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode,
        error: ERROR_MESSAGES.SYSTEM.INTERNAL_SERVER_ERROR,
        message: ERROR_MESSAGES.SYSTEM.INTERNAL_SERVER_ERROR,
      };
    }
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return {
        statusCode,
        error: exception.name,
        message: response,
      };
    }
    if (typeof response === 'object' && response !== null) {
      return response as Record<string, unknown>;
    }
    return {
      statusCode,
      error: exception.name,
      message: ERROR_MESSAGES.SYSTEM.INTERNAL_SERVER_ERROR,
    };
  }
}
