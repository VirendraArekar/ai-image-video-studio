import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ImagesModule } from './images/images.module';
import { VideosModule } from './videos/videos.module';
import { StudioModule } from './studio/studio.module';
import { GalleryModule } from './gallery/gallery.module';
import { PromptsModule } from './prompts/prompts.module';
import { CreditsModule } from './credits/credits.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120, // 120 requests per minute
      },
    ]),
    PrismaModule,
    StorageModule,
    AiModule,
    AuthModule,
    ImagesModule,
    VideosModule,
    StudioModule,
    GalleryModule,
    PromptsModule,
    CreditsModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
