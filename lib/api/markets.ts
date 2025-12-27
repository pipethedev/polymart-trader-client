import { apiClient } from './client';
import type { Market, MarketListResponse } from './types';

export interface GetMarketsParams {
  eventId?: number;
  active?: boolean;
  closed?: boolean;
  search?: string;
  volumeMin?: number;
  volumeMax?: number;
  liquidityMin?: number;
  liquidityMax?: number;
  createdAtMin?: string;
  createdAtMax?: string;
  updatedAtMin?: string;
  updatedAtMax?: string;
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

