import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AI Studio API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.service).toContain('AI Studio');
        expect(res.body.uptime).toBeDefined();
      });
  });

  it('/api/images/models (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/images/models')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((m: any) => m.id === 'gemini-nano-banana-2.1')).toBe(true);
      });
  });

  it('/api/videos/models (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/videos/models')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((m: any) => m.id === 'gemini-omni-1.2-flash')).toBe(true);
      });
  });

  it('/api/prompts/categories (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/prompts/categories')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toContain('Realistic portraits');
        expect(res.body).toContain('Cinematic photography');
      });
  });

  it('/api/images/enhance-prompt (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/images/enhance-prompt')
      .send({ prompt: 'cyberpunk warrior', targetType: 'IMAGE', styleHint: 'Cyberpunk' })
      .expect(200)
      .expect((res) => {
        expect(res.body.enhancedPrompt).toBeDefined();
        expect(res.body.negativePrompt).toBeDefined();
      });
  });
});
