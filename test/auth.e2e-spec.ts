import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { applyAppConfigForTest } from './setup-e2e';

describe('Auth E2E', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    applyAppConfigForTest(app);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login -> 200 + accessToken', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({ username: '0378519357', password: 'Nguyendung2k4' }) // đổi theo dữ liệu của bạn
      .expect(201); // LocalAuthGuard thường trả 201, tùy bạn có set @HttpCode(200) hay không
    expect(res.body?.data?.accessToken).toBeDefined();
  });

  it('POST /auth/profile (Bearer) -> 200', async () => {
    const login = await request(server)
      .post('/auth/login')
      .send({ username: '0378519357', password: 'Nguyendung2k4' })
      .expect(201);

    const token = login.body.data.accessToken as string;

    const profile = await request(server)
      .post('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(201); // hoặc 200 nếu bạn set @HttpCode(200)

    expect(profile.body?.data?.id).toBeDefined();
  });

  it('POST /auth/profile without token -> 401', async () => {
    await request(server).post('/auth/profile').expect(401);
  });
});
