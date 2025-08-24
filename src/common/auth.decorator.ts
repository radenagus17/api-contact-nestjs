import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '../../generated/prisma'; // Change to type import
import { FastifyRequest } from 'fastify';

export const Auth = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    // Remove Promise wrapper if not needed
    const request: FastifyRequest['raw'] & { user: User } = context
      .switchToHttp()
      .getRequest();
    const user = request.user;
    if (user) {
      return user;
    }
  },
);
