import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ContactService } from './contact.service';
import { AuthGuard } from 'src/common/auth.guard';
import { Auth } from 'src/common/auth.decorator';
import { ContactRequest, ContactResponse } from 'src/model/contact.model';
import { WebResponse } from 'src/model/web.model';
import * as Prisma from '../../generated/prisma';

@Controller('/api/contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Auth() user: Prisma.User,
    @Body() request: ContactRequest,
  ): Promise<WebResponse<ContactResponse>> {
    const contact = await this.contactService.create(user, request);

    return {
      data: contact,
    };
  }
}
