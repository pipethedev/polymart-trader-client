import { useQuery } from '@tanstack/react-query';
import { marketsApi } from '../api/markets';
import type { GetMarketsParams } from '../api/markets';

export const useMarkets = (params?: GetMarketsParams) => {
  return useQuery({
    queryKey: ['markets', params],
    queryFn: () => marketsApi.getMarkets(params),
  });
};

export const useMarket = (id: number | null) => {
  return useQuery({
    queryKey: ['market', id],
    queryFn: () => (id ? marketsApi.getMarket(id) : null),
    enabled: !!id,
  });
};

