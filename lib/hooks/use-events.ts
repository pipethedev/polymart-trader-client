import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../api/events';
import type { GetEventsParams } from '../api/events';

export const useEvents = (params?: GetEventsParams) => {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => eventsApi.getEvents(params),
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

