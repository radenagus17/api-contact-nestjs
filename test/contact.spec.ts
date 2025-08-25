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
import { ContactResponse } from 'src/model/contact.model';

describe('ContactController', () => {
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
  });

  describe('POST /api/contacts', () => {
    beforeEach(async () => {
      await testService.deleteUser();

      await testService.createUser();
    });

    it('should be rejected create if request is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/contacts',
        headers: {
          Authorization: 'test',
        },
        payload: {
          name: '',
          email: '',
          phone: '',
        },
      });

      const responseData: WebResponse<ContactResponse> = JSON.parse(
        response.body,
      ) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(400);
      expect(responseData?.errors).toBeDefined();
    });

    it('should be able to create new contact', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/contacts',
        headers: {
          Authorization: 'test',
        },
        payload: {
          email: 'test@example.com',
          phone: '9999',
          name: 'test',
        },
      });

      const responseData: WebResponse<ContactResponse> = JSON.parse(
        response.body,
      ) as object;

      logger.info(responseData);

      expect(response.statusCode).toBe(201);
      expect(responseData?.data?.name).toBe('test');
      expect(responseData?.data?.email).toBe('test@example.com');
      expect(responseData?.data?.phone).toBe('9999');
      expect(responseData?.data?.userId).toBeDefined();
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
