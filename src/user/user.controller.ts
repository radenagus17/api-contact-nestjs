import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { WebResponse } from 'src/model/web.model';
import {
  LoginUserRequest,
  RegisterUserRequest,
  UpdateUserRequest,
  UserResponse,
} from 'src/model/user.model';
import { Auth } from 'src/common/auth.decorator';
import * as Prisma from '../../generated/prisma';
import { AuthGuard } from 'src/common/auth.guard';

@Controller('/api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(200)
  async register(
    @Body() req: RegisterUserRequest,
  ): Promise<WebResponse<UserResponse>> {
    const res = await this.userService.register(req);

    return {
      data: res,
    };
  }

  @Post('/login')
  @HttpCode(200)
  async login(
    @Body() req: LoginUserRequest,
  ): Promise<WebResponse<UserResponse>> {
    const res = await this.userService.login(req);

    return {
      data: res,
    };
  }

  @Get('/current')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  get(@Auth() user: Prisma.User): WebResponse<UserResponse> {
    const res = this.userService.get(user);

    return {
      data: res,
    };
  }

  @Patch('/current')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async update(
    @Auth() user: Prisma.User,
    @Body() request: UpdateUserRequest,
  ): Promise<WebResponse<UserResponse>> {
    const res = await this.userService.update(user, request);

    return {
      data: res,
    };
  }

  @Delete('/current')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async logout(@Auth() user: Prisma.User): Promise<WebResponse<boolean>> {
    await this.userService.logout(user);

    return {
      data: true,
    };
  }
}
