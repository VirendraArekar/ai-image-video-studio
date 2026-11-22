import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerationOrchestratorService } from '../ai/generation-orchestrator.service';
import { GeminiPromptEnhancerService } from '../ai/gemini-prompt-enhancer.service';
import { ModelRegistryService } from '../ai/model-registry.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { EditImageDto } from './dto/edit-image.dto';
import { EnhancePromptDto } from './dto/enhance-prompt.dto';

@Injectable()
export class ImagesService {
  constructor(
    private prisma: PrismaService,
    private orchestrator: GenerationOrchestratorService,
    private promptEnhancer: GeminiPromptEnhancerService,
    private modelRegistry: ModelRegistryService,
  ) {}

  async generateImage(userId: string, dto: GenerateImageDto) {
    return this.orchestrator.generateImage(userId, {
      prompt: dto.prompt,
      negativePrompt: dto.negativePrompt,
      modelId: dto.modelId || 'qwen-2.5-image-turbo',
      aspectRatio: dto.aspectRatio || '1:1',
      stylePreset: dto.stylePreset,
      sampleCount: dto.sampleCount || 1,
      referenceImageBase64: dto.referenceImageBase64,
      referenceImageMime: dto.referenceImageMime,
      editAction: dto.editAction || (dto.referenceImageBase64 ? 'GENERATE' : undefined),
      seed: dto.seed ?? Math.floor(Math.random() * 10000000),
    });
  }

  async editImage(userId: string, dto: EditImageDto) {
    let rawImage = dto.referenceImageBase64 || dto.referenceImage || dto.image || '';
    if (rawImage.includes(',')) {
      rawImage = rawImage.split(',')[1];
    }

    let action: 'EDIT' | 'REPLACE_BG' | 'REMOVE_BG' | 'ENHANCE' = dto.editAction || 'EDIT';
    if (dto.editType) {
      const lower = dto.editType.toLowerCase();
      if (lower.includes('replace')) action = 'REPLACE_BG';
      else if (lower.includes('remove')) action = 'REMOVE_BG';
      else if (lower.includes('enhance')) action = 'ENHANCE';
    }

    return this.orchestrator.generateImage(userId, {
      prompt: dto.prompt,
      modelId: dto.modelId || 'qwen-2.5-image-turbo',
      aspectRatio: dto.aspectRatio || '1:1',
      referenceImageBase64: rawImage,
      referenceImageMime: dto.referenceImageMime || 'image/png',
      editAction: action,
      stylePreset: dto.stylePreset,
      seed: dto.seed ?? Math.floor(Math.random() * 10000000),
    });
  }

  async enhancePrompt(dto: EnhancePromptDto) {
    return this.promptEnhancer.enhancePrompt(
      dto.prompt,
      dto.targetType || 'IMAGE',
      dto.styleHint,
    );
  }

  async getImageById(mediaId: string) {
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
      throw new NotFoundException('Image not found');
    }

    // Increment view count
    await this.prisma.generatedMedia.update({
      where: { id: mediaId },
      data: { viewsCount: { increment: 1 } },
    });

    return media;
  }

  getAvailableModels() {
    return this.modelRegistry.getImageModels();
  }
}
