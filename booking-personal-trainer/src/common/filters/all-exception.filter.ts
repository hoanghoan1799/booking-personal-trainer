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
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const error =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            message: ERROR_MESSAGES.SYSTEM.INTERNAL_SERVER_ERROR,
            statusCode: status,
          };

    response.status(status).json({
      errors: error,
    });
  }
}
