import { apiClient } from './client';
import { PromptTemplate } from '../types';

export const promptsApi = {
  getCategories: async (): Promise<string[]> => {
    const res = await apiClient.get('/prompts/categories');
    return res.data;
  },
  getPrompts: async (params?: { category?: string; search?: string }): Promise<PromptTemplate[]> => {
    const res = await apiClient.get('/prompts', { params });
    return res.data;
  },
  createPrompt: async (data: {
    title: string;
    prompt: string;
    negativePrompt?: string;
    category: string;
    tags?: string[];
  }): Promise<PromptTemplate> => {
    const res = await apiClient.post('/prompts', data);
    return res.data;
  },
  usePrompt: async (id: string): Promise<PromptTemplate> => {
    const res = await apiClient.post(`/prompts/${id}/use`);
    return res.data;
  },
  deletePrompt: async (id: string) => {
    const res = await apiClient.delete(`/prompts/${id}`);
    return res.data;
  },
};
