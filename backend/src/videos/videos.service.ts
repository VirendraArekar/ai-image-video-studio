import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModelRegistryService } from '../ai/model-registry.service';
import { GenerationOrchestratorService } from '../ai/generation-orchestrator.service';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { EstimateVideoCostDto } from './dto/estimate-video-cost.dto';
import { JobStatus, JobType } from '@prisma/client';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    private prisma: PrismaService,
    private modelRegistry: ModelRegistryService,
    private orchestrator: GenerationOrchestratorService,
  ) {}

  estimateCost(dto: EstimateVideoCostDto) {
    const modelId = dto.modelId || 'qwen-wan2.1-video-turbo';
    const duration = dto.duration || 10;
    const resolution = dto.resolution || '720p';
    const estimatedCredits = this.modelRegistry.calculateVideoCreditCost(
      modelId,
      duration,
      resolution,
    );
    return {
      modelId,
      duration,
      resolution,
      estimatedCredits,
    };
  }

  getAvailableModels() {
    return this.modelRegistry.getVideoModels();
  }

  async startVideoGeneration(userId: string, dto: GenerateVideoDto) {
    const modelId = dto.modelId || 'qwen-wan2.1-video-turbo';
    const duration = dto.duration || 10;
    const resolution = dto.resolution || '720p';
    const creditCost = this.modelRegistry.calculateVideoCreditCost(modelId, duration, resolution);

    // Check balance
    const wallet = await this.prisma.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balance < creditCost) {
      throw new BadRequestException(
        `Insufficient credits for video generation. Required: ${creditCost}, Current balance: ${wallet?.balance || 0}`,
      );
    }

    // Determine Job Type
    let jobType: JobType = JobType.VIDEO_TEXT_TO_VIDEO;
    if (dto.firstFrameBase64 && dto.lastFrameBase64) {
      jobType = JobType.VIDEO_KEYFRAME;
    } else if (dto.firstFrameBase64) {
      jobType = JobType.VIDEO_IMAGE_TO_VIDEO;
    }

    // Atomically reserve credits and create Initial Pending Job
    const [job] = await this.prisma.$transaction(async (tx) => {
      const newBalance = wallet.balance - creditCost;
      await tx.creditWallet.update({
        where: { userId },
        data: {
          balance: newBalance,
          lifetimeSpent: { increment: creditCost },
        },
      });

      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -creditCost,
          balanceAfter: newBalance,
          type: 'VIDEO_GENERATION',
          description: `Queued ${duration}s ${resolution} video using ${modelId}`,
          metadata: { modelId, duration, resolution, prompt: dto.prompt },
        },
      });

      const newJob = await tx.generationJob.create({
        data: {
          userId,
          type: jobType,
          status: JobStatus.PENDING,
          modelId,
          prompt: dto.prompt,
          creditCost,
          progress: 5,
          parameters: {
            create: {
              resolution,
              aspectRatio: dto.aspectRatio || '16:9',
              rawRequest: dto as any,
            },
          },
        },
        include: { parameters: true },
      });

      return [newJob];
    });

    // Launch asynchronous generation task without blocking the HTTP request
    this.processAsyncVideoJob(job.id, userId, dto).catch((err) => {
      this.logger.error(`Background video job ${job.id} caught unexpected error: ${err.message}`);
    });

    return {
      success: true,
      jobId: job.id,
      status: JobStatus.PENDING,
      creditCost,
      message: 'Video generation job queued. Track status at /api/videos/jobs/' + job.id,
    };
  }

  private async processAsyncVideoJob(jobId: string, userId: string, dto: GenerateVideoDto) {
    let progressTimer: NodeJS.Timeout | null = null;
    try {
      this.logger.log(`Starting background processing for video job: ${jobId}`);

      // Progress update: 15%
      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: { status: JobStatus.PROCESSING, progress: 15, startedAt: new Date() },
      });

      // Simulate step progress update for responsive UX
      progressTimer = setInterval(async () => {
        try {
          const current = await this.prisma.generationJob.findUnique({ where: { id: jobId } });
          if (current && current.status === JobStatus.PROCESSING && current.progress < 85) {
            await this.prisma.generationJob.update({
              where: { id: jobId },
              data: { progress: current.progress + 15 },
            });
          }
        } catch (_) {}
      }, 2500);

      // Invoke Orchestrator to generate video and store it using the existing reserved job
      await this.orchestrator.generateVideo(userId, {
        prompt: dto.prompt,
        modelId: dto.modelId || 'qwen-wan2.1-video-turbo',
        duration: dto.duration || 10,
        resolution: dto.resolution || '720p',
        aspectRatio: dto.aspectRatio || '16:9',
        firstFrameBase64: dto.firstFrameBase64,
        firstFrameMime: dto.firstFrameMime,
        lastFrameBase64: dto.lastFrameBase64,
        lastFrameMime: dto.lastFrameMime,
        referenceImageBase64: dto.referenceImageBase64,
        referenceImageMime: dto.referenceImageMime,
        previousInteractionId: dto.previousInteractionId,
        includeAudio: dto.includeAudio ?? true,
        existingJobId: jobId,
      });

      if (progressTimer) clearInterval(progressTimer);
      this.logger.log(`Async video job ${jobId} completed successfully`);
    } catch (err: any) {
      if (progressTimer) clearInterval(progressTimer);
      this.logger.error(`Async video generation error for job ${jobId}: ${err.message}`);

      // Auto-refund reserved credits
      try {
        const job = await this.prisma.generationJob.findUnique({ where: { id: jobId } });
        if (job) {
          const wallet = await this.prisma.creditWallet.findUnique({ where: { userId } });
          if (wallet) {
            await this.prisma.$transaction([
              this.prisma.creditWallet.update({
                where: { userId },
                data: {
                  balance: { increment: job.creditCost },
                  lifetimeSpent: { decrement: job.creditCost },
                },
              }),
              this.prisma.creditTransaction.create({
                data: {
                  walletId: wallet.id,
                  amount: job.creditCost,
                  balanceAfter: wallet.balance + job.creditCost,
                  type: 'REFUND',
                  description: `Refund for failed video generation job ${jobId}`,
                  referenceId: jobId,
                },
              }),
              this.prisma.generationJob.update({
                where: { id: jobId },
                data: {
                  status: JobStatus.FAILED,
                  errorMessage: err.message,
                  completedAt: new Date(),
                },
              }),
            ]);
          }
        }
      } catch (refundErr: any) {
        this.logger.error(`Failed to refund failed job ${jobId}: ${refundErr.message}`);
      }
    }
  }

  async getJobStatus(jobId: string) {
    const job = await this.prisma.generationJob.findUnique({
      where: { id: jobId },
      include: {
        generatedMedia: true,
        parameters: true,
      },
    });

    if (!job) {
      throw new NotFoundException(`Generation job ${jobId} not found`);
    }

    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      creditCost: job.creditCost,
      modelId: job.modelId,
      prompt: job.prompt,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      media: job.generatedMedia?.[0] || null,
      parameters: job.parameters,
    };
  }

  async getVideoById(mediaId: string) {
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
      throw new NotFoundException('Video media not found');
    }

    await this.prisma.generatedMedia.update({
      where: { id: mediaId },
      data: { viewsCount: { increment: 1 } },
    });

    return media;
  }
}
