'use client';

import { useOrder, useCancelOrder } from '@/lib/hooks/use-orders';
import { useUIStore } from '@/lib/store/ui-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateFull } from '@/lib/utils/date';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary',
  QUEUED: 'secondary',
  PROCESSING: 'default',
  FILLED: 'default',
  PARTIALLY_FILLED: 'default',
  CANCELLED: 'secondary',
  FAILED: 'destructive',
};

export function OrderDetail() {
  const { selectedOrderId, setSelectedOrderId } = useUIStore();
  const { data: order, isLoading } = useOrder(selectedOrderId);
  const cancelOrderMutation = useCancelOrder();

  if (!selectedOrderId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Card className="rounded-none dark:border-0">
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return <div className="p-4">Order not found</div>;
  }

  const canCancel = ['PENDING', 'QUEUED'].includes(order.status);

  const handleCancel = async () => {
    try {
      await cancelOrderMutation.mutateAsync(order.id);
      toast.success('Order cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setSelectedOrderId(null)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>

      {order.status === 'FAILED' && (
        <div className="bg-red-50 border border-red-500 rounded-none p-4 mb-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-600 shrink-0" />
            <div className="flex-1">
              <div className="text-lg font-bold text-red-900 mb-1">
                Order Failed
              </div>
              {order.failureReason && (
                <div className="text-sm text-red-700">
                  {typeof order.failureReason === 'string'
                    ? order.failureReason
                    : JSON.stringify(order.failureReason)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Card className={`rounded-none `}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Order #{order.id}</CardTitle>
            <Badge
              variant={statusColors[order.status] || 'secondary'}
              className={
                order.status === 'FAILED'
                  ? 'bg-red-600 text-white text-base px-4 py-2 font-bold'
                  : ''
              }
            >
              {order.status === 'FAILED' && <AlertCircle className="mr-2 h-4 w-4" />}
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Market ID
              </div>
              <div>{order.marketId}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Side
              </div>
              <Badge variant={order.side === 'BUY' ? 'default' : 'secondary'}>
                {order.side}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Type
              </div>
              <div>{order.type}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Outcome
              </div>
              <Badge variant="outline">{order.outcome}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Quantity
              </div>
              <div className="font-mono">{parseFloat(order.quantity).toFixed(4)}</div>
            </div>
            {order.price && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Price
                </div>
                <div className="font-mono">
                  {typeof order.price === 'string'
                    ? parseFloat(order.price).toFixed(4)
                    : JSON.stringify(order.price)}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Filled Quantity
              </div>
              <div className="font-mono">
                {parseFloat(order.filledQuantity).toFixed(4)}
              </div>
            </div>
            {order.averageFillPrice && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Average Fill Price
                </div>
                <div className="font-mono">
                  {typeof order.averageFillPrice === 'string'
                    ? parseFloat(order.averageFillPrice).toFixed(4)
                    : JSON.stringify(order.averageFillPrice)}
                </div>
              </div>
            )}
            {order.externalOrderId && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  External Order ID
                </div>
                <div className="font-mono text-xs">
                  {typeof order.externalOrderId === 'string'
                    ? order.externalOrderId
                    : JSON.stringify(order.externalOrderId)}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Created At
              </div>
              <div>{formatDateFull(order.createdAt)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Updated At
              </div>
              <div>{formatDateFull(order.updatedAt)}</div>
            </div>
          </div>

          {order.failureReason && order.status !== 'FAILED' && (
            <div className="bg-red-50 border border-red-200 rounded-none p-3">
              <div className="text-sm font-semibold text-red-900 mb-1">
                Failure Reason
              </div>
              <div className="text-sm text-red-700">
                {typeof order.failureReason === 'string'
                  ? order.failureReason
                  : JSON.stringify(order.failureReason)}
              </div>
            </div>
          )}

          {canCancel && (
            <div className="pt-4">
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelOrderMutation.isPending}
              >
                {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

