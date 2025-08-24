import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/common/prisma.service';
import { ValidationService } from 'src/common/validation.service';
import {
  LoginUserRequest,
  RegisterUserRequest,
  UpdateUserRequest,
  UserResponse,
} from 'src/model/user.model';
import { Logger } from 'winston';
import { UserValidation } from './user.validation';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from '../../generated/prisma';

@Injectable()
export class UserService {
  constructor(
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async register(req: RegisterUserRequest): Promise<UserResponse> {
    this.logger.debug(`Register new user ${JSON.stringify(req)}`);
    const registerRequest = this.validationService.validate(
      UserValidation.REGISTER,
      req,
    ) as RegisterUserRequest;

    const totalUserWithSameUsername = await this.prismaService.user.count({
      where: {
        username: registerRequest.username,
      },
    });

    if (totalUserWithSameUsername != 0) {
      throw new HttpException(
        'Username already exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

    const user = await this.prismaService.user.create({
      data: registerRequest,
    });

    return {
      username: user.username,
      name: user.name,
      id: user.id,
    };
  }

  async login(req: LoginUserRequest): Promise<UserResponse> {
    this.logger.debug(`UserService.login ${JSON.stringify(req)}`);
    const loginRequest = this.validationService.validate(
      UserValidation.LOGIN,
      req,
    ) as LoginUserRequest;

    let user = await this.prismaService.user.findUnique({
      where: {
        username: loginRequest.username,
      },
    });

    if (!user) {
      throw new HttpException(
        'Username or password is invalid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginRequest.password,
      user.password,
    );

    if (!isPasswordValid)
      throw new HttpException(
        'Username or password is invalid',
        HttpStatus.UNAUTHORIZED,
      );

    user = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        token: randomUUID(),
      },
    });

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      token: user.token as string,
    };
  }

  get(user: User): UserResponse {
    return {
      username: user.username,
      name: user.name,
      id: user.id,
    };
  }

  async update(user: User, req: UpdateUserRequest): Promise<UserResponse> {
    this.logger.debug(
      `UserService.update ${JSON.stringify(user)} ${JSON.stringify(req)}`,
    );

    const updateRequest = this.validationService.validate(
      UserValidation.UPDATE,
      req,
    ) as UpdateUserRequest;

    if (updateRequest.name) user.name = updateRequest.name;

    if (updateRequest.password)
      user.password = await bcrypt.hash(updateRequest.password, 10);

    const res = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        name: user.name,
        password: user.password,
      },
    });

    return {
      username: res.username,
      name: res.name,
      id: res.id,
    };
  }

  async logout(user: User): Promise<UserResponse> {
    const res = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        token: null,
      },
    });

    return {
      username: res.username,
      name: res.name,
      id: res.id,
    };
  }
}
