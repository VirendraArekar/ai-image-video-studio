import { apiClient } from './client';
import { GeneratedMedia } from '../types';

export const galleryApi = {
  getGallery: async (params?: {
    mediaType?: string;
    isFavourite?: boolean;
    search?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: GeneratedMedia[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const res = await apiClient.get('/gallery', { params });
    return res.data;
  },
  getMyGallery: async (params?: {
    mediaType?: string;
    isFavourite?: boolean;
    search?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: GeneratedMedia[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const res = await apiClient.get('/gallery/my-creations', { params });
    return res.data;
  },
  getById: async (id: string): Promise<GeneratedMedia> => {
    const res = await apiClient.get(`/gallery/${id}`);
    return res.data;
  },
  toggleFavourite: async (id: string): Promise<{ isFavourite: boolean }> => {
    const res = await apiClient.post(`/gallery/${id}/favourite`);
    return res.data;
  },
  recordDownload: async (id: string) => {
    const res = await apiClient.post(`/gallery/${id}/download`);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await apiClient.delete(`/gallery/${id}`);
    return res.data;
  },
};
