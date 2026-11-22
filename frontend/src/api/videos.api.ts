import { apiClient } from './client';
import { ModelMetadata, GeneratedMedia, JobStatus } from '../types';

export interface GenerateVideoPayload {
  prompt: string;
  modelId?: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: number;
  resolution?: '360p' | '720p' | '1080p' | '4k';
  firstFrameBase64?: string;
  firstFrameMime?: string;
  lastFrameBase64?: string;
  lastFrameMime?: string;
  referenceImageBase64?: string;
  referenceImageMime?: string;
  includeAudio?: boolean;
}

export interface VideoJobStatusResponse {
  id: string;
  status: JobStatus;
  progress: number;
  creditCost: number;
  modelId: string;
  prompt: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  media?: GeneratedMedia;
}

export const videosApi = {
  getModels: async (): Promise<ModelMetadata[]> => {
    const res = await apiClient.get('/videos/models');
    return res.data;
  },
  estimateCost: async (params: { modelId?: string; duration?: number; resolution?: string }) => {
    const res = await apiClient.post('/videos/estimate-cost', params);
    return res.data;
  },
  generate: async (data: GenerateVideoPayload): Promise<{ success: boolean; jobId: string; status: JobStatus; creditCost: number }> => {
    const res = await apiClient.post('/videos/generate', data);
    return res.data;
  },
  getJobStatus: async (jobId: string): Promise<VideoJobStatusResponse> => {
    const res = await apiClient.get(`/videos/jobs/${jobId}`);
    return res.data;
  },
  getById: async (id: string): Promise<GeneratedMedia> => {
    const res = await apiClient.get(`/videos/${id}`);
    return res.data;
  },
};
