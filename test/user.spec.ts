import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './../src/app.module';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TestModule } from './test.module';
import { TestService } from './test.service';
import { WebResponse } from 'src/model/web.model';
import { UserResponse } from 'src/model/user.model';

describe('UserController', () => {
  let app: NestFastifyApplication;
  let logger: Logger;
  let testService: TestService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestModule],
    }).compile();

    // Create Fastify app for testing
    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready(); // Important for Fastify

    logger = app.get(WINSTON_MODULE_PROVIDER);
    testService = app.get(TestService);
    await testService.deleteContact();
  });

  describe('POST /api/users', () => {
    beforeEach(async () => {
      await testService.deleteUser();
    });

    it('should reject registration if request is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          username: '',
          password: '',
          name: '',
        },
      });

      logger.info(JSON.parse(response.body));

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toBeDefined();
    });

    it('should be able to register new user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          username: 'test',
          password: 'test',
          name: 'test',
        },
      });

      const responseData: WebResponse<UserResponse> = JSON.parse(
        response.body,
      ) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(200);
      expect(responseData?.data?.username).toBe('test');
      expect(responseData?.data?.name).toBe('test');
    });

    it('should be rejected if username already exist', async () => {
      await testService.createUser();

      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          username: 'test',
          password: 'test',
          name: 'test',
        },
      });

      const responseData: WebResponse<UserResponse> = JSON.parse(
        response.body,
      ) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(400);
      expect(responseData?.errors).toBeDefined();
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await testService.deleteUser();
      await testService.createUser();
    });

    it('should be rejected login if request is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/login',
        payload: {
          username: '',
          password: '',
        },
      });

      logger.info(JSON.parse(response.body));

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toBeDefined();
    });

    it('should be able to login', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/login',
        payload: {
          username: 'test',
          password: 'test',
        },
      });

      const responseData: WebResponse<UserResponse> = JSON.parse(
        response.body,
      ) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(200);
      expect(responseData?.data?.username).toBe('test');
      expect(responseData?.data?.name).toBe('test');
      expect(responseData?.data?.token).toBeDefined();
    });

    it('should be rejected if username or password invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/login',
        payload: {
          username: 'tost',
          password: 'tost',
        },
      });

      const responseData: WebResponse<UserResponse> = JSON.parse(
        response.body,
      ) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(401);
      expect(responseData?.errors).toBeDefined();
    });
  });

  describe('GET /api/users/current', () => {
    beforeEach(async () => {
      await testService.deleteUser();
      await testService.createUser();
    });

    it('should be rejected if token is invalid', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/current',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      logger.info(JSON.parse(response.body));

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toBeDefined();
    });

    it('should be able to get user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users/current',
        headers: {
          Authorization: `Bearer test`,
        },
      });

      const responseData: WebResponse<UserResponse> = JSON.parse(
        response.body,
      ) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(200);
      expect(responseData?.data?.username).toBe('test');
      expect(responseData?.data?.name).toBe('test');
    });
  });

  describe('PATCH /api/users/current', () => {
    beforeEach(async () => {
      await testService.deleteUser();
      await testService.createUser();
    });

    it('should be rejected if request is invalid', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/users/current',
        headers: {
          Authorization: 'Bearer test',
        },
        body: {
          name: '',
          password: '',
        },
      });

      logger.info(JSON.parse(response.body));

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toBeDefined();
    });

    it('should be able to update current user name', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/users/current',
        headers: {
          Authorization: `Bearer test`,
        },
        body: {
          name: 'tost',
        },
      });

      const responseData: WebResponse<UserResponse> = JSON.parse(
        response.body,
      ) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(200);
      expect(responseData?.data?.username).toBe('test');
      expect(responseData?.data?.name).toBe('tost');
    });

    it('should be able to update current user password', async () => {
      let response = await app.inject({
        method: 'PATCH',
        url: '/api/users/current',
        headers: {
          Authorization: `Bearer test`,
        },
        body: {
          password: 'updated',
        },
      });

      let responseData: WebResponse<UserResponse> = JSON.parse(
        response.body,
      ) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(200);
      expect(responseData?.data?.username).toBe('test');

      response = await app.inject({
        method: 'POST',
        url: '/api/users/login',
        body: {
          username: 'test',
          password: 'updated',
        },
      });

      responseData = JSON.parse(response.body) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(200);
      expect(responseData.data?.token).toBeDefined();
    });
  });

  describe('DELETE /api/users/current', () => {
    beforeEach(async () => {
      await testService.deleteUser();
      await testService.createUser();
    });

    it('should be rejected if token is invalid', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/users/current',
        headers: {
          Authorization: '',
        },
      });

      logger.info(JSON.parse(response.body));

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toBeDefined();
    });

    it('should be able to logout user', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/users/current',
        headers: {
          Authorization: `Bearer test`,
        },
      });

      const responseData: WebResponse<UserResponse> = JSON.parse(
        response.body,
      ) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(200);
      expect(responseData?.data).toBe(true);

      const user = await testService.getUser();
      expect(user?.token).toBeNull();
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
