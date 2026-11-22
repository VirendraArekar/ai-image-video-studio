export type MediaType = 'IMAGE' | 'VIDEO';

export interface ModelMetadata {
  id: string;
  name: string;
  provider: 'Qwen' | 'WanX' | 'Qwen / WanX' | 'Google Gemini' | 'Veo' | 'Imagen' | string;
  type: MediaType;
  description: string;
  baseCreditCost: number;
  isEnabled: boolean;
  capabilities: {
    textToMedia: boolean;
    imageToMedia: boolean;
    mediaEditing: boolean;
    inPainting: boolean;
    outPainting: boolean;
    videoExtension?: boolean;
    firstAndLastFrame?: boolean;
    aspectRatios: string[];
    resolutions: string[];
    durations?: number[];
  };
}

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  modelId: string;
  aspectRatio?: '1:1' | '4:5' | '3:2' | '16:9' | '9:16';
  stylePreset?: string;
  referenceImageBase64?: string;
  referenceImageMime?: string;
  maskImageBase64?: string;
  seed?: number;
  sampleCount?: number;
  editAction?: 'GENERATE' | 'EDIT' | 'REPLACE_BG' | 'REMOVE_BG' | 'OUTPAINT' | 'ENHANCE';
}

export interface VideoGenerationOptions {
  prompt: string;
  modelId: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: number; // 3 to 15 seconds
  resolution?: '360p' | '720p' | '1080p' | '4k';
  firstFrameBase64?: string;
  firstFrameMime?: string;
  lastFrameBase64?: string;
  lastFrameMime?: string;
  referenceImageBase64?: string;
  referenceImageMime?: string;
  referenceVideoBase64?: string;
  referenceVideoMime?: string;
  previousInteractionId?: string;
  extendVideoBase64?: string;
  extendVideoMime?: string;
  includeAudio?: boolean;
  existingJobId?: string;
}

export interface GeneratedOutput {
  base64Data: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}
