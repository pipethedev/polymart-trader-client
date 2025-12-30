import { useAccount, useSignMessage } from 'wagmi';
import type { CreateOrderDto } from '@/lib/api/orders';

export function createOrderMessage(orderParams: CreateOrderDto, nonce: string): string {
  const messageData: Record<string, unknown> = {
    marketId: orderParams.marketId,
    side: orderParams.side,
    type: orderParams.type,
    outcome: orderParams.outcome,
    nonce,
  };

  if (orderParams.amount !== undefined) {
    messageData.amount = typeof orderParams.amount === 'number' ? String(orderParams.amount) : orderParams.amount;
  } else if (orderParams.quantity !== undefined) {
    messageData.quantity = typeof orderParams.quantity === 'number' ? String(orderParams.quantity) : orderParams.quantity;
  }

  if (orderParams.price !== undefined) {
    messageData.price = typeof orderParams.price === 'number' ? String(orderParams.price) : orderParams.price;
  }

  return JSON.stringify(messageData);
}

export function useSignOrderMessage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const signOrderMessage = async (
    orderParams: CreateOrderDto,
    nonce: string,
  ): Promise<{ signature: string; message: string }> => {
    if (!address) {
      throw new Error('No wallet connected');
    }

    const message = createOrderMessage(orderParams, nonce);

    const signature = await signMessageAsync({ message });

    return {
      signature,
      message,
    };
  };

  return { signOrderMessage, address };
}

export function generateNonce(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
