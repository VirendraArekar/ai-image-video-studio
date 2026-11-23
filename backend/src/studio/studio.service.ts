import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { GenerationOrchestratorService } from '../ai/generation-orchestrator.service';

export interface CreateVariationDto {
  mediaId: string;
  revisedPrompt?: string;
  stylePreset?: string;
  aspectRatio?: '1:1' | '4:5' | '3:2' | '16:9' | '9:16';
  seed?: number;
}

@Injectable()
export class StudioService {
  constructor(
    private prisma: PrismaService,
    private orchestrator: GenerationOrchestratorService,
  ) {}

  async getStudioAsset(mediaId: string) {
    const media = await this.prisma.generatedMedia.findUnique({
      where: { id: mediaId },
      include: {
        job: {
          include: {
            parameters: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException(`Asset ${mediaId} not found in Creative Studio`);
    }

    // Find related variations or history in the same session
    const relatedHistory = await this.prisma.generatedMedia.findMany({
      where: {
        userId: media.userId,
        mediaType: media.mediaType,
        id: { not: mediaId },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: { parameters: true },
        },
      },
    });

    return {
      asset: media,
      history: relatedHistory,
    };
  }

  async createVariation(userId: string, dto: CreateVariationDto) {
    const original = await this.prisma.generatedMedia.findUnique({
      where: { id: dto.mediaId },
      include: {
        job: {
          include: { parameters: true },
        },
      },
    });

    if (!original) {
      throw new NotFoundException('Original asset not found');
    }

    const prompt = dto.revisedPrompt || original.job?.prompt || 'Variation';
    const modelId = original.job?.modelId || 'qwen-2.5-image-turbo';
    const aspectRatio = dto.aspectRatio || (original.job?.parameters?.aspectRatio as any) || '1:1';

    if (original.mediaType === 'IMAGE') {
      let refBase64: string | undefined;
      if (original.storagePath && fs.existsSync(original.storagePath)) {
        try {
          refBase64 = fs.readFileSync(original.storagePath).toString('base64');
        } catch (_) {}
      }

      return this.orchestrator.generateImage(userId, {
        prompt,
        modelId,
        aspectRatio,
        stylePreset: dto.stylePreset,
        referenceImageBase64: refBase64,
        referenceImageMime: original.mimeType || 'image/jpeg',
        editAction: refBase64 ? 'EDIT' : undefined,
        seed: dto.seed || Math.floor(Math.random() * 1000000),
      });
    } else {
      return this.orchestrator.generateVideo(userId, {
        prompt,
        modelId,
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
        duration: (original.durationSeconds as number) || 10,
        resolution: (original.job?.parameters?.resolution as any) || '720p',
      });
    }
  }
}
