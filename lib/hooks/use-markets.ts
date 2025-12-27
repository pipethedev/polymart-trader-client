import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { marketsApi } from '../api/markets';
import type { GetMarketsParams } from '../api/markets';

export const useMarkets = (params?: Omit<GetMarketsParams, 'page' | 'pageSize'>) => {
  return useInfiniteQuery({
    queryKey: ['markets', params],
    queryFn: ({ pageParam = 1 }) => 
      marketsApi.getMarkets({ ...params, page: pageParam, pageSize: 21 }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useMarket = (id: number | null) => {
  return useQuery({
    queryKey: ['market', id],
    queryFn: () => (id ? marketsApi.getMarket(id) : null),
    enabled: !!id,
  });
};

