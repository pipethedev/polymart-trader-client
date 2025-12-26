import { apiClient } from './client';
import type { Order, OrderListResponse, CreateOrderDto } from './types';

export type { CreateOrderDto };

export interface GetOrdersParams {
  marketId?: number;
  status?: Order['status'];
  side?: 'BUY' | 'SELL';
  outcome?: 'YES' | 'NO';
  page?: number;
  pageSize?: number;
  limit?: number;
}

export const ordersApi = {
  getOrders: async (params?: GetOrdersParams): Promise<OrderListResponse> => {
    const response = await apiClient.get<OrderListResponse>('/orders', { params });
    return response.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (order: CreateOrderDto, idempotencyKey: string): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', order, {
      headers: {
        'x-idempotency-key': idempotencyKey,
      },
    });
    return response.data;
  },

  cancelOrder: async (id: number): Promise<Order> => {
    const response = await apiClient.delete<Order>(`/orders/${id}`);
    return response.data;
  },
};

