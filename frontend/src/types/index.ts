export type Role = 'USER' | 'ADMIN' | 'MODERATOR';
export type MediaType = 'IMAGE' | 'VIDEO';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  wallet?: {
    balance: number;
    lifetimeGranted: number;
    lifetimeSpent: number;
  };
  subscription?: {
    planTier: 'FREE' | 'STARTER' | 'CREATOR' | 'PRO_STUDIO';
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
    monthlyCredits: number;
  };
}

export interface ModelMetadata {
  id: string;
  name: string;
  provider: string;
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

export interface GeneratedMedia {
  id: string;
  userId: string;
  jobId?: string;
  mediaType: MediaType;
  storagePath: string;
  publicUrl: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fileSize?: number;
  thumbnailUrl?: string;
  isFavourite: boolean;
  isPublic: boolean;
  viewsCount: number;
  downloadsCount: number;
  createdAt: string;
  job?: {
    prompt: string;
    negativePrompt?: string;
    modelId: string;
    creditCost: number;
    parameters?: {
      aspectRatio?: string;
      resolution?: string;
      seed?: string;
    };
  };
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  category: string;
  tags?: string[];
  previewImageUrl?: string;
  usageCount: number;
  isSystemDefault: boolean;
  createdAt: string;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  description: string;
  createdAt: string;
}
