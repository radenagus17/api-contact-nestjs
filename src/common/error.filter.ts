import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ZodError } from 'zod';
import { FastifyReply } from 'fastify';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(exception: Error | ZodError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.code(status).send({
        errors: exception.getResponse(),
      });
    } else if (exception instanceof ZodError) {
      response.code(400).send({
        errors: 'Validation error',
      });
    } else {
      response.code(500).send({
        errors: exception.message,
      });
    }
  }
}
