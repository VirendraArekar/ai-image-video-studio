import { apiClient } from './client';
import { ModelMetadata, GeneratedMedia } from '../types';

export interface GenerateImagePayload {
  prompt: string;
  negativePrompt?: string;
  modelId?: string;
  aspectRatio?: string;
  stylePreset?: string;
  sampleCount?: number;
  referenceImageBase64?: string;
  referenceImageMime?: string;
  editAction?: 'GENERATE' | 'EDIT' | 'REPLACE_BG' | 'REMOVE_BG' | 'ENHANCE';
  seed?: number;
}

export interface EditImagePayload {
  prompt: string;
  referenceImageBase64: string;
  referenceImageMime?: string;
  editAction?: 'EDIT' | 'REPLACE_BG' | 'REMOVE_BG' | 'ENHANCE';
  modelId?: string;
  aspectRatio?: string;
  stylePreset?: string;
  seed?: number;
}

export const imagesApi = {
  getModels: async (): Promise<ModelMetadata[]> => {
    const res = await apiClient.get('/images/models');
    return res.data;
  },
  enhancePrompt: async (data: { prompt: string; targetType?: 'IMAGE' | 'VIDEO'; styleHint?: string }) => {
    const res = await apiClient.post('/images/enhance-prompt', data);
    return res.data;
  },
  generate: async (data: GenerateImagePayload): Promise<{ success: boolean; media: GeneratedMedia; remainingCredits: number; jobId: string }> => {
    const res = await apiClient.post('/images/generate', data);
    return res.data;
  },
  edit: async (data: EditImagePayload): Promise<{ success: boolean; media: GeneratedMedia; remainingCredits: number; jobId: string }> => {
    const res = await apiClient.post('/images/edit', data);
    return res.data;
  },
  getById: async (id: string): Promise<GeneratedMedia> => {
    const res = await apiClient.get(`/images/${id}`);
    return res.data;
  },
};
