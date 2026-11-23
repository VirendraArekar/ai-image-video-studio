import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType } from '@prisma/client';

export interface GalleryFilterDto {
  mediaType?: 'IMAGE' | 'VIDEO' | 'ALL';
  isFavourite?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'views' | 'downloads';
  userId?: string;
}

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  async getGallery(filters: GalleryFilterDto) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 12));
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.mediaType && filters.mediaType !== 'ALL') {
      where.mediaType = filters.mediaType as MediaType;
    }

    if (filters.isFavourite !== undefined) {
      where.isFavourite = String(filters.isFavourite) === 'true';
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { job: { prompt: { contains: q } } },
        { storagePath: { contains: q } },
        { job: { modelId: { contains: q } } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filters.sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (filters.sortBy === 'views') {
      orderBy = { viewsCount: 'desc' };
    } else if (filters.sortBy === 'downloads') {
      orderBy = { downloadsCount: 'desc' };
    }

    const [items, total] = await Promise.all([
      this.prisma.generatedMedia.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
      }),
      this.prisma.generatedMedia.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMediaById(id: string) {
    const item = await this.prisma.generatedMedia.findUnique({
      where: { id },
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

    if (!item) {
      throw new NotFoundException(`Media ${id} not found`);
    }

    await this.prisma.generatedMedia.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    return item;
  }

  async toggleFavourite(userId: string, mediaId: string) {
    const media = await this.prisma.generatedMedia.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    const existingFav = await this.prisma.favouriteMedia.findUnique({
      where: {
        userId_mediaId: { userId, mediaId },
      },
    });

    if (existingFav) {
      await this.prisma.favouriteMedia.delete({
        where: { id: existingFav.id },
      });
      await this.prisma.generatedMedia.update({
        where: { id: mediaId },
        data: { isFavourite: false },
      });
      return { isFavourite: false };
    } else {
      await this.prisma.favouriteMedia.create({
        data: { userId, mediaId },
      });
      await this.prisma.generatedMedia.update({
        where: { id: mediaId },
        data: { isFavourite: true },
      });
      return { isFavourite: true };
    }
  }

  async deleteMedia(userId: string, mediaId: string) {
    const media = await this.prisma.generatedMedia.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    // Soft delete
    await this.prisma.generatedMedia.update({
      where: { id: mediaId },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: 'Media deleted successfully' };
  }

  async recordDownload(mediaId: string) {
    await this.prisma.generatedMedia.update({
      where: { id: mediaId },
      data: { downloadsCount: { increment: 1 } },
    });
    return { success: true };
  }
}
