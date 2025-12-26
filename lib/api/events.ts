import { apiClient } from './client';
import type { Event, EventListResponse, SyncResponse } from './types';

export interface GetEventsParams {
  active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
}

export const eventsApi = {
  getEvents: async (params?: GetEventsParams): Promise<EventListResponse> => {
    const response = await apiClient.get<EventListResponse>('/events', { params });
    return response.data;
  },

  getEvent: async (id: number): Promise<Event> => {
    const response = await apiClient.get<Event>(`/events/${id}`);
    return response.data;
  },

  getEventMarkets: async (eventId: number): Promise<any[]> => {
    const response = await apiClient.get(`/events/${eventId}/markets`);
    return response.data;
  },

  syncEvents: async (limit?: number): Promise<SyncResponse> => {
    const response = await apiClient.post<SyncResponse>('/events/sync', null, {
      params: limit ? { limit } : undefined,
    });
    return response.data;
  },
};

