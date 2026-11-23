import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePromptDto {
  title: string;
  prompt: string;
  negativePrompt?: string;
  category: string;
  tags?: string[];
  previewImageUrl?: string;
}

@Injectable()
export class PromptsService {
  constructor(private prisma: PrismaService) {}

  async getPrompts(category?: string, search?: string) {
    const where: any = {};

    if (category && category !== 'All') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { prompt: { contains: search } },
      ];
    }

    const templates = await this.prisma.promptTemplate.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
    });

    return templates;
  }

  async getCategories() {
    return [
      'Realistic portraits',
      'Cinematic photography',
      'Fashion photography',
      'Product photography',
      'Architecture',
      'Nature',
      'Fantasy',
      'Anime',
      '3D artwork',
      'Advertising',
      'Social media',
      'Video storytelling',
    ];
  }

  async createPrompt(userId?: string, dto?: CreatePromptDto) {
    if (!dto) throw new Error('Prompt data required');
    return this.prisma.promptTemplate.create({
      data: {
        title: dto.title,
        prompt: dto.prompt,
        negativePrompt: dto.negativePrompt,
        category: dto.category,
        tags: dto.tags || [],
        previewImageUrl: dto.previewImageUrl,
        isSystemDefault: false,
        authorId: userId || null,
      },
    });
  }

  async incrementUsage(id: string) {
    const prompt = await this.prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt template not found');
    }

    return this.prisma.promptTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  async deletePrompt(userId: string, id: string) {
    const prompt = await this.prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt template not found');
    }

    if (prompt.authorId !== userId) {
      throw new NotFoundException('Cannot delete system or other users template');
    }

    await this.prisma.promptTemplate.delete({
      where: { id },
    });

    return { success: true };
  }
}
