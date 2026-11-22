import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { GeminiImageProvider } from './gemini-image.provider';
import { GeminiVideoProvider } from './gemini-video.provider';
import { ModelRegistryService } from './model-registry.service';
import { ImageGenerationOptions, VideoGenerationOptions } from './interfaces/model.interface';
import { JobType, JobStatus, MediaType } from '@prisma/client';

@Injectable()
export class GenerationOrchestratorService {
  private readonly logger = new Logger(GenerationOrchestratorService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private imageProvider: GeminiImageProvider,
    private videoProvider: GeminiVideoProvider,
    private modelRegistry: ModelRegistryService,
  ) {}

  async generateImage(userId: string, options: ImageGenerationOptions) {
    const startTime = Date.now();
    const modelId = options.modelId || 'qwen-2.5-image-turbo';
    const sampleCount = options.sampleCount || 1;
    const creditCost = this.modelRegistry.calculateImageCreditCost(modelId, sampleCount);

    // 1. Atomically check balance and deduct credits
    const wallet = await this.prisma.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balance < creditCost) {
      throw new BadRequestException(
        `Insufficient generation credits. Required: ${creditCost}, Current balance: ${wallet?.balance || 0}`,
      );
    }

    // Determine Job Type
    let jobType: JobType = JobType.IMAGE_TEXT_TO_IMAGE;
    if (options.referenceImageBase64) {
      jobType = options.editAction && options.editAction !== 'GENERATE'
        ? JobType.IMAGE_EDIT
        : JobType.IMAGE_TO_IMAGE;
    }

    // Deduct credits and create job atomically
    const [job, updatedWallet] = await this.prisma.$transaction(async (tx) => {
      const newBalance = wallet.balance - creditCost;
      const uWallet = await tx.creditWallet.update({
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
          type: 'IMAGE_GENERATION',
          description: `Generated image using ${modelId}`,
          metadata: { modelId, prompt: options.prompt, sampleCount },
        },
      });

      const newJob = await tx.generationJob.create({
        data: {
          userId,
          type: jobType,
          status: JobStatus.PROCESSING,
          modelId,
          prompt: options.prompt,
          negativePrompt: options.negativePrompt,
          creditCost,
          startedAt: new Date(),
          parameters: {
            create: {
              aspectRatio: options.aspectRatio || '1:1',
              sampleCount,
              rawRequest: options as any,
            },
          },
        },
        include: { parameters: true },
      });

      return [newJob, uWallet];
    });

    try {
      // 2. Invoke image provider
      const output = await this.imageProvider.generateImage(options);

      // 3. Save generated image in storage
      const saved = await this.storageService.saveBase64File(
        output.base64Data,
        output.mimeType,
        'images',
      );

      // 4. Save generated media record and finalize job
      const media = await this.prisma.generatedMedia.create({
        data: {
          userId,
          jobId: job.id,
          mediaType: MediaType.IMAGE,
          storagePath: saved.storagePath,
          publicUrl: saved.publicUrl,
          mimeType: output.mimeType,
          fileSize: saved.fileSize,
          width: output.width || 1024,
          height: output.height || 1024,
          isPublic: true,
        },
      });

      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
        },
      });

      // 5. Log API usage
      const latencyMs = Date.now() - startTime;
      await this.prisma.apiUsageLog.create({
        data: {
          userId,
          endpoint: '/api/images/generate',
          modelId,
          tokensInput: options.prompt.length,
          tokensOutput: 1,
          latencyMs,
          statusCode: 200,
        },
      });

      return {
        success: true,
        jobId: job.id,
        media,
        remainingCredits: updatedWallet.balance,
      };
    } catch (err: any) {
      this.logger.error(`Generation failed for job ${job.id}: ${err.message}`);

      // Auto-refund credits on failure
      await this.prisma.$transaction(async (tx) => {
        await tx.creditWallet.update({
          where: { userId },
          data: {
            balance: { increment: creditCost },
            lifetimeSpent: { decrement: creditCost },
          },
        });

        await tx.creditTransaction.create({
          data: {
            walletId: wallet.id,
            amount: creditCost,
            balanceAfter: wallet.balance,
            type: 'REFUND',
            description: `Refund for failed image generation job ${job.id}`,
            referenceId: job.id,
          },
        });

        await tx.generationJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            errorMessage: err.message,
            completedAt: new Date(),
          },
        });
      });

      throw err;
    }
  }

  async generateVideo(userId: string, options: VideoGenerationOptions) {
    const startTime = Date.now();
    const modelId = options.modelId || 'qwen-wan2.1-video-turbo';
    const duration = options.duration || 10;
    const resolution = options.resolution || '720p';
    const creditCost = this.modelRegistry.calculateVideoCreditCost(modelId, duration, resolution);

    const wallet = await this.prisma.creditWallet.findUnique({
      where: { userId },
    });

    let job: any;
    let updatedWallet: any;

    if (options.existingJobId) {
      // Job and credit reservation already handled by caller
      job = await this.prisma.generationJob.findUnique({
        where: { id: options.existingJobId },
        include: { parameters: true },
      });
      updatedWallet = wallet;
    } else {
      if (!wallet || wallet.balance < creditCost) {
        throw new BadRequestException(
          `Insufficient generation credits for video. Required: ${creditCost}, Current balance: ${wallet?.balance || 0}`,
        );
      }

      let jobType: JobType = JobType.VIDEO_TEXT_TO_VIDEO;
      if (options.firstFrameBase64 && options.lastFrameBase64) {
        jobType = JobType.VIDEO_KEYFRAME;
      } else if (options.firstFrameBase64) {
        jobType = JobType.VIDEO_IMAGE_TO_VIDEO;
      } else if (options.extendVideoBase64) {
        jobType = JobType.VIDEO_EXTENSION;
      }

      // Atomically reserve credits & create job
      const [newJob, uWallet] = await this.prisma.$transaction(async (tx) => {
        const newBalance = wallet.balance - creditCost;
        const uw = await tx.creditWallet.update({
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
            description: `Generated ${duration}s ${resolution} video using ${modelId}`,
            metadata: { modelId, duration, resolution, prompt: options.prompt },
          },
        });

        const createdJob = await tx.generationJob.create({
          data: {
            userId,
            type: jobType,
            status: JobStatus.PROCESSING,
            modelId,
            prompt: options.prompt,
            creditCost,
            startedAt: new Date(),
            parameters: {
              create: {
                resolution,
                aspectRatio: options.aspectRatio || '16:9',
                rawRequest: options as any,
              },
            },
          },
          include: { parameters: true },
        });

        return [createdJob, uw];
      });

      job = newJob;
      updatedWallet = uWallet;
    }

    try {
      const output = await this.videoProvider.generateVideo(options);

      const saved = await this.storageService.saveBase64File(
        output.base64Data,
        output.mimeType,
        'videos',
      );

      const media = await this.prisma.generatedMedia.create({
        data: {
          userId,
          jobId: job.id,
          mediaType: MediaType.VIDEO,
          storagePath: saved.storagePath,
          publicUrl: saved.publicUrl,
          mimeType: output.mimeType,
          durationSeconds: duration,
          fileSize: saved.fileSize,
          isPublic: true,
        },
      });

      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.COMPLETED,
          progress: 100,
          completedAt: new Date(),
        },
      });

      const latencyMs = Date.now() - startTime;
      await this.prisma.apiUsageLog.create({
        data: {
          userId,
          endpoint: '/api/videos/generate',
          modelId,
          tokensInput: options.prompt.length,
          tokensOutput: 1,
          latencyMs,
          statusCode: 200,
        },
      });

      return {
        success: true,
        jobId: job.id,
        media,
        remainingCredits: updatedWallet.balance,
      };
    } catch (err: any) {
      this.logger.error(`Video generation failed for job ${job.id}: ${err.message}`);

      // Auto-refund credits
      await this.prisma.$transaction(async (tx) => {
        await tx.creditWallet.update({
          where: { userId },
          data: {
            balance: { increment: creditCost },
            lifetimeSpent: { decrement: creditCost },
          },
        });

        await tx.creditTransaction.create({
          data: {
            walletId: wallet.id,
            amount: creditCost,
            balanceAfter: wallet.balance,
            type: 'REFUND',
            description: `Refund for failed video generation job ${job.id}`,
            referenceId: job.id,
          },
        });

        await tx.generationJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            errorMessage: err.message,
            completedAt: new Date(),
          },
        });
      });

      throw err;
    }
  }
}
