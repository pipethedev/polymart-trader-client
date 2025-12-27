import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import type { GetEventsParams } from '../api/events';

export const useEvents = (params?: Omit<GetEventsParams, 'page' | 'pageSize'>) => {
  return useInfiniteQuery({
    queryKey: ['events', params],
    queryFn: ({ pageParam = 1 }) => 
      eventsApi.getEvents({ ...params, page: pageParam, pageSize: 21 }),
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.currentPage < lastPage.meta.totalPages) {
        return lastPage.meta.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
};

export const useEvent = (id: number | null) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => (id ? eventsApi.getEvent(id) : null),
    enabled: !!id,
  });
};

export const useEventMarkets = (eventId: number | null) => {
  return useQuery({
    queryKey: ['event-markets', eventId],
    queryFn: () => (eventId ? eventsApi.getEventMarkets(eventId) : null),
    enabled: !!eventId,
  });
};

export const useSyncEvents = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (limit?: number) => eventsApi.syncEvents(limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

