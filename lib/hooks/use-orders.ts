import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import type { GetOrdersParams, CreateOrderDto } from '../api/orders';

export const useOrders = (params?: GetOrdersParams) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => ordersApi.getOrders(params),
  });
};

export const useOrder = (id: number | null) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => (id ? ordersApi.getOrder(id) : null),
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ order, idempotencyKey }: { order: CreateOrderDto; idempotencyKey: string }) =>
      ordersApi.createOrder(order, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => ordersApi.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

