import { Inject, Injectable, Logger } from '@nestjs/common';
import { User } from '../../generated/prisma';
import { PrismaService } from 'src/common/prisma.service';
import { ContactValidation } from './contact.validation';
import { ContactRequest, ContactResponse } from 'src/model/contact.model';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ValidationService } from 'src/common/validation.service';

@Injectable()
export class ContactService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prisma: PrismaService,
    private validationService: ValidationService,
  ) {}

  async create(user: User, request: ContactRequest): Promise<ContactResponse> {
    this.logger.debug(
      `ContactService.create ${JSON.stringify(user)} ${JSON.stringify(request)}`,
    );
    const createRequest = this.validationService.validate(
      ContactValidation.CREATE,
      request,
    ) as ContactRequest;

    const contact = await this.prisma.contact.create({
      data: { ...createRequest, userId: user.id },
    });

    return {
      userId: contact.userId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    };
  }
}
