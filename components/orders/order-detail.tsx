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
import { isValid, parseISO } from 'date-fns';
import { normalizeError } from '@/lib/utils/error-normalizer';

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
      const normalized = normalizeError(error);
      toast.error(normalized.message);
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
        <div className="bg-red-900/20 border-none dark:border-2 dark:border-red-400 rounded-none p-4 mb-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                {order.failureReason
                  ? normalizeError(order.failureReason).title || 'Order Failed'
                  : 'Order Failed'}
              </div>
              {order.failureReason && (() => {
                const normalized = normalizeError(order.failureReason);
                return (
                  <div className="space-y-2">
                    <div className="text-sm text-red-900 dark:text-red-300 font-medium">
                      {normalized.message}
                    </div>
                    {normalized.details && (
                      <div className="text-sm text-red-800 dark:text-red-400 mt-2 p-3 bg-white dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded">
                        {normalized.details}
                      </div>
                    )}
                    {normalized.action && (
                      <div className="text-sm text-red-800 dark:text-red-400 font-semibold mt-2">
                        {normalized.action}
                      </div>
                    )}
                  </div>
                );
              })()}
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
            <div className="col-span-2">
              <div className="text-sm font-medium text-muted-foreground">
                Market
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">#{order.marketId}</span>
                {order.marketTitle && (
                  <>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-foreground">{order.marketTitle}</span>
                  </>
                )}
              </div>
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
              <div className="font-mono">
                {order.quantity ? parseFloat(order.quantity).toFixed(4) : 'N/A'}
              </div>
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
            {order.updatedAt && (() => {
              const updatedDate = typeof order.updatedAt === 'string' 
                ? parseISO(order.updatedAt) 
                : new Date(order.updatedAt);
              return isValid(updatedDate) ? (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Updated At
                  </div>
                  <div>{formatDateFull(order.updatedAt)}</div>
                </div>
              ) : null;
            })()}
          </div>

          {order.failureReason && order.status !== 'FAILED' && (() => {
            const normalized = normalizeError(order.failureReason);
            return (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-none p-3">
                <div className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                  {normalized.title || 'Failure Reason'}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  {normalized.message}
                </div>
                {normalized.details && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                    {normalized.details}
                  </div>
                )}
              </div>
            );
          })()}

          {canCancel && (
            <div className="pt-4">
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelOrderMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
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

