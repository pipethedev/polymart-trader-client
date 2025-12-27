'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders, useCancelOrder } from '@/lib/hooks/use-orders';
import { useUIStore } from '@/lib/store/ui-store';
import type { Order } from '@/lib/api/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils/date';
import { Package, AlertCircle, Filter } from 'lucide-react';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PENDING: 'secondary',
  QUEUED: 'secondary',
  PROCESSING: 'default',
  FILLED: 'default',
  PARTIALLY_FILLED: 'default',
  CANCELLED: 'secondary',
  FAILED: 'destructive',
};

export function OrdersList() {
  const {
    setSelectedOrderId,
    ordersPage,
    setOrdersPage,
    setCreateOrderDialogOpen,
  } = useUIStore();
  const [marketIdFilter, setMarketIdFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sideFilter, setSideFilter] = useState<string>('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useOrders({
    page: ordersPage,
    pageSize: 21,
    marketId: marketIdFilter ? parseInt(marketIdFilter) : undefined,
    status: (statusFilter || undefined) as Order['status'] | undefined,
    side: (sideFilter || undefined) as 'BUY' | 'SELL' | undefined,
    outcome: (outcomeFilter || undefined) as 'YES' | 'NO' | undefined,
  });

  const hasActiveFilters = marketIdFilter || statusFilter || sideFilter || outcomeFilter;

  const clearFilters = () => {
    setMarketIdFilter('');
    setStatusFilter('');
    setSideFilter('');
    setOutcomeFilter('');
    setOrdersPage(1);
  };

  const cancelOrderMutation = useCancelOrder();

  const handleCancel = async (id: number) => {
    try {
      await cancelOrderMutation.mutateAsync(id);
      toast.success('Order cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel order');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="rounded-none">
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        Error loading orders: {error.message}
      </div>
    );
  }

  const orders = data?.data || [];
  const meta = data?.meta;

  const canCancel = (status: string) => {
    return ['PENDING', 'QUEUED'].includes(status);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="cursor-pointer"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="cursor-pointer"
            >
              Clear
            </Button>
          )}
        </div>
        <Button onClick={() => setCreateOrderDialogOpen(true)}>
          Create Order
        </Button>
      </div>

      {showFilters && (
        <Card className="rounded-none">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Market ID</Label>
                <Input
                  type="number"
                  placeholder="Market ID"
                  value={marketIdFilter}
                  onChange={(e) => {
                    setMarketIdFilter(e.target.value);
                    setOrdersPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter || 'all'}
                  onValueChange={(value) => {
                    setStatusFilter(value === 'all' ? '' : value);
                    setOrdersPage(1);
                  }}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="QUEUED">QUEUED</SelectItem>
                    <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                    <SelectItem value="FILLED">FILLED</SelectItem>
                    <SelectItem value="PARTIALLY_FILLED">PARTIALLY_FILLED</SelectItem>
                    <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                    <SelectItem value="FAILED">FAILED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Side</Label>
                <Select
                  value={sideFilter || 'all'}
                  onValueChange={(value) => {
                    setSideFilter(value === 'all' ? '' : value);
                    setOrdersPage(1);
                  }}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="All Sides" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sides</SelectItem>
                    <SelectItem value="BUY">BUY</SelectItem>
                    <SelectItem value="SELL">SELL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select
                  value={outcomeFilter || 'all'}
                  onValueChange={(value) => {
                    setOutcomeFilter(value === 'all' ? '' : value);
                    setOrdersPage(1);
                  }}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="All Outcomes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    <SelectItem value="YES">YES</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px] flex-col gap-4">
          <Package className="w-16 h-16 text-muted-foreground/40 animate-pulse group-hover:text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <Card
                  className={`cursor-pointer hover:border-foreground/50 transition-colors rounded-none ${
                    order.status === 'FAILED'
                      ? 'border-2 border-red-500 bg-red-50/30'
                      : ''
                  }`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant={order.side === 'BUY' ? 'success' : 'error'}>
                            {order.side}
                          </Badge>
                          <Badge variant="outline">{order.outcome}</Badge>
                          <Badge
                            variant={statusColors[order.status] || 'secondary'}
                            className={
                              order.status === 'FAILED'
                                ? 'bg-red-600 text-white font-bold text-sm px-3 py-1'
                                : ''
                            }
                          >
                            {order.status === 'FAILED' && (
                              <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {order.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {order.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">Market:</span>
                          <span className="font-medium">#{order.marketId}</span>
                          <span className="text-muted-foreground">Qty:</span>
                          <span className="font-mono font-semibold">
                            {parseFloat(order.quantity).toFixed(4)}
                          </span>
                          {order.price && (
                            <>
                              <span className="text-muted-foreground">Price:</span>
                              <span className="font-mono">
                                {typeof order.price === 'string'
                                  ? parseFloat(order.price).toFixed(4)
                                  : JSON.stringify(order.price)}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        {canCancel(order.status) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(order.id)}
                            disabled={cancelOrderMutation.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {meta.currentPage} of {meta.totalPages} ({meta.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
              disabled={ordersPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() =>
                setOrdersPage(Math.min(meta.totalPages, ordersPage + 1))
              }
              disabled={ordersPage === meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

