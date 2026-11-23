import { apiClient } from './client';
import { GeneratedMedia } from '../types';

export const studioApi = {
  getAsset: async (id: string): Promise<{ asset: GeneratedMedia; history: GeneratedMedia[] }> => {
    const res = await apiClient.get(`/studio/asset/${id}`);
    return res.data;
  },
  createVariation: async (data: {
    mediaId: string;
    revisedPrompt?: string;
    stylePreset?: string;
    aspectRatio?: string;
    seed?: number;
  }): Promise<{ success: boolean; media: GeneratedMedia; remainingCredits: number }> => {
    const res = await apiClient.post('/studio/variations', data);
    return res.data;
  },
};
