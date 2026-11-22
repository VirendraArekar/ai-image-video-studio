import { Injectable, Logger } from '@nestjs/common';
import { ModelMetadata } from './interfaces/model.interface';

@Injectable()
export class ModelRegistryService {
  private readonly logger = new Logger(ModelRegistryService.name);

  private readonly legacyAliases: Record<string, string> = {
    'gemini-nano-banana-2.1': 'qwen-2.5-image-turbo',
    'gemini-3-pro-image': 'qwen-2.5-max-image',
    'gemini-3.1-flash-lite-image': 'qwen-2.5-image-turbo',
    'imagen-3.0-generate-002': 'wanx-2.1-t2i-plus',
    'gemini-omni-1.2-flash': 'qwen-wan2.1-video-turbo',
    'veo-2.0-generate-001': 'qwen-wan2.1-video-plus',
  };

  private readonly models: Map<string, ModelMetadata> = new Map([
    [
      'qwen-2.5-image-turbo',
      {
        id: 'qwen-2.5-image-turbo',
        name: 'Qwen 2.5 Image Turbo (WanX 2.1)',
        provider: 'Qwen / WanX',
        type: 'IMAGE',
        description: 'Flagship high-efficiency uncensored visual synthesis and conversational editing powered by Qwen 2.5 & WanX.',
        baseCreditCost: 1,
        isEnabled: true,
        capabilities: {
          textToMedia: true,
          imageToMedia: true,
          mediaEditing: true,
          inPainting: true,
          outPainting: true,
          aspectRatios: ['1:1', '4:5', '3:2', '16:9', '9:16'],
          resolutions: ['1024x1024', '1280x720', '720x1280', '1920x1080'],
        },
      },
    ],
    [
      'qwen-2.5-max-image',
      {
        id: 'qwen-2.5-max-image',
        name: 'Qwen 2.5 Max Image Ultra',
        provider: 'Qwen',
        type: 'IMAGE',
        description: 'Ultra-high-fidelity flagship visual synthesis model for cinematic, fashion, glamour, and high-detail production art.',
        baseCreditCost: 2,
        isEnabled: true,
        capabilities: {
          textToMedia: true,
          imageToMedia: true,
          mediaEditing: true,
          inPainting: true,
          outPainting: true,
          aspectRatios: ['1:1', '4:5', '3:2', '16:9', '9:16'],
          resolutions: ['1024x1024', '1536x1536', '1920x1080', '2048x2048'],
        },
      },
    ],
    [
      'wanx-2.1-t2i-plus',
      {
        id: 'wanx-2.1-t2i-plus',
        name: 'Alibaba WanX 2.1 Plus',
        provider: 'WanX',
        type: 'IMAGE',
        description: 'State-of-the-art photorealistic synthesis with high detail, crisp lighting, and unrestricted artistic aesthetics.',
        baseCreditCost: 2,
        isEnabled: true,
        capabilities: {
          textToMedia: true,
          imageToMedia: false,
          mediaEditing: false,
          inPainting: false,
          outPainting: false,
          aspectRatios: ['1:1', '3:4', '4:3', '16:9', '9:16'],
          resolutions: ['1024x1024'],
        },
      },
    ],
    [
      'qwen-2.5-vl-ultra',
      {
        id: 'qwen-2.5-vl-ultra',
        name: 'Qwen 2.5 VL Ultra Vision & Edit',
        provider: 'Qwen',
        type: 'IMAGE',
        description: 'Multi-modal vision synthesis with advanced spatial reasoning, instruction following, and conversational editing.',
        baseCreditCost: 1,
        isEnabled: true,
        capabilities: {
          textToMedia: true,
          imageToMedia: true,
          mediaEditing: true,
          inPainting: true,
          outPainting: true,
          aspectRatios: ['1:1', '16:9', '9:16'],
          resolutions: ['1024x1024'],
        },
      },
    ],
    [
      'qwen-wan2.1-video-turbo',
      {
        id: 'qwen-wan2.1-video-turbo',
        name: 'Qwen Wan 2.1 Video Turbo',
        provider: 'Qwen / WanX',
        type: 'VIDEO',
        description: 'High-performance video generation (3s–15s), image-to-video, first/last frame keyframe interpolation, and dynamic camera motion.',
        baseCreditCost: 10,
        isEnabled: true,
        capabilities: {
          textToMedia: true,
          imageToMedia: true,
          mediaEditing: true,
          inPainting: false,
          outPainting: false,
          videoExtension: true,
          firstAndLastFrame: true,
          aspectRatios: ['16:9', '9:16'],
          resolutions: ['360p', '720p', '1080p', '4k'],
          durations: [3, 5, 8, 10, 12, 15],
        },
      },
    ],
    [
      'qwen-wan2.1-video-plus',
      {
        id: 'qwen-wan2.1-video-plus',
        name: 'Qwen Wan 2.1 Video Plus',
        provider: 'Qwen / WanX',
        type: 'VIDEO',
        description: 'Cinematic, physics-aware video synthesis model with fluid character motion, dynamic lighting, and expressive camera work.',
        baseCreditCost: 20,
        isEnabled: true,
        capabilities: {
          textToMedia: true,
          imageToMedia: true,
          mediaEditing: false,
          inPainting: false,
          outPainting: false,
          videoExtension: true,
          firstAndLastFrame: true,
          aspectRatios: ['16:9', '9:16'],
          resolutions: ['720p', '1080p'],
          durations: [5, 10],
        },
      },
    ],
    [
      'qwen-omni-motion',
      {
        id: 'qwen-omni-motion',
        name: 'Qwen Omni Motion 2.5',
        provider: 'Qwen',
        type: 'VIDEO',
        description: 'Fast responsive video synthesis optimized for rapid concepting and multi-second social media clips.',
        baseCreditCost: 10,
        isEnabled: true,
        capabilities: {
          textToMedia: true,
          imageToMedia: true,
          mediaEditing: false,
          inPainting: false,
          outPainting: false,
          videoExtension: false,
          firstAndLastFrame: false,
          aspectRatios: ['16:9', '9:16'],
          resolutions: ['720p'],
          durations: [3, 5],
        },
      },
    ],
  ]);

  getAllModels(): ModelMetadata[] {
    return Array.from(this.models.values());
  }

  getImageModels(): ModelMetadata[] {
    return this.getAllModels().filter((m) => m.type === 'IMAGE' && m.isEnabled);
  }

  getVideoModels(): ModelMetadata[] {
    return this.getAllModels().filter((m) => m.type === 'VIDEO' && m.isEnabled);
  }

  getModel(modelId: string): ModelMetadata {
    // Check legacy aliases
    const targetId = this.legacyAliases[modelId] || modelId;
    const model = this.models.get(targetId);
    if (!model) {
      // Default fallback
      return this.models.get('qwen-2.5-image-turbo')!;
    }
    return model;
  }

  calculateImageCreditCost(modelId: string, sampleCount: number = 1): number {
    const model = this.getModel(modelId);
    return model.baseCreditCost * Math.max(1, sampleCount);
  }

  calculateVideoCreditCost(
    modelId: string,
    duration: number = 10,
    resolution: string = '720p',
  ): number {
    const model = this.getModel(modelId);
    let cost = model.baseCreditCost;

    // Duration scaling
    if (duration > 10) {
      cost = Math.round(cost * 1.5);
    } else if (duration <= 5) {
      cost = Math.max(5, Math.round(cost * 0.7));
    }

    // Resolution scaling
    if (resolution === '1080p') {
      cost += 5;
    } else if (resolution === '4k') {
      cost += 15;
    }

    return cost;
  }
}
