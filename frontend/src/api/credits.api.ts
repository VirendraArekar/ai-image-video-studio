import { apiClient } from './client';
import { CreditTransaction } from '../types';

export interface UserCreditsResponse {
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  subscription: {
    planTier: 'FREE' | 'STARTER' | 'CREATOR' | 'PRO_STUDIO';
    status: string;
    monthlyCredits: number;
  };
  stats: {
    totalImages: number;
    totalVideos: number;
    totalGenerations: number;
  };
  recentTransactions: CreditTransaction[];
}

export const creditsApi = {
  getUserCredits: async (): Promise<UserCreditsResponse> => {
    const res = await apiClient.get('/credits');
    return res.data;
  },
  getTransactions: async (params?: { page?: number; limit?: number }) => {
    const res = await apiClient.get('/credits/transactions', { params });
    return res.data;
  },
  purchasePackage: async (data: { packageId: 'starter' | 'creator' | 'pro' }) => {
    const res = await apiClient.post('/credits/packages/purchase', data);
    return res.data;
  },
  upgradeSubscription: async (data: { planTier: 'STARTER' | 'CREATOR' | 'PRO_STUDIO' }) => {
    const res = await apiClient.post('/credits/subscription/upgrade', data);
    return res.data;
  },
};
