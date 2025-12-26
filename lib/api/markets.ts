import { apiClient } from './client';
import type { Market, MarketListResponse } from './types';

export interface GetMarketsParams {
  eventId?: number;
  active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}

export const marketsApi = {
  getMarkets: async (params?: GetMarketsParams): Promise<MarketListResponse> => {
    const response = await apiClient.get<MarketListResponse>('/markets', { params });
    return response.data;
  },

  getMarket: async (id: number): Promise<Market> => {
    const response = await apiClient.get<Market>(`/markets/${id}`);
    return response.data;
  },
};

