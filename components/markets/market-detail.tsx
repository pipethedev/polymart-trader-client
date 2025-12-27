'use client';

import Image from 'next/image';
import { useMarket } from '@/lib/hooks/use-markets';
import { useUIStore } from '@/lib/store/ui-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { formatDateFull } from '@/lib/utils/date';
import { formatVolume } from '@/lib/utils/format';

export function MarketDetail() {
  const { selectedMarketId, setSelectedMarketId, setCreateOrderDialogOpen } = useUIStore();
  const { data: market, isLoading } = useMarket(selectedMarketId);

  if (!selectedMarketId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
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

  if (!market) {
    return <div className="p-4">Market not found</div>;
  }

  const yesPrice = parseFloat(market.outcomeYesPrice);
  const noPrice = parseFloat(market.outcomeNoPrice);
  const yesPercent = (yesPrice * 100).toFixed(1);
  const noPercent = (noPrice * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => setSelectedMarketId(null)}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Markets
      </Button>

      <Card className="rounded-none overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-3">
            {market.image && (
              <div className="relative shrink-0 w-12 h-12 rounded-full overflow-hidden">
                <Image
                  src={market.image}
                  alt={market.question}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div className="flex items-start justify-between flex-1 min-w-0">
              <CardTitle className="text-2xl leading-tight pr-4 flex-1">
                {market.question}
              </CardTitle>
              <Badge
                variant={
                  market.closed
                    ? 'error'
                    : market.active
                      ? 'success'
                      : 'error'
                }
                className="shrink-0"
              >
                {market.closed
                  ? 'Closed'
                  : market.active
                    ? 'Active'
                    : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Display - Polymarket style */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setCreateOrderDialogOpen(true, {
                  marketId: market.id,
                  outcome: 'YES',
                  side: 'BUY',
                  type: 'LIMIT',
                  price: yesPrice.toFixed(4),
                });
              }}
              className="p-8 rounded-none bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors text-left cursor-pointer"
            >
              <div className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
                YES
              </div>
              <div className="text-6xl font-bold text-white mb-3 leading-none">
                {yesPercent}%
              </div>
              <div className="text-lg font-mono text-white/90 font-medium">
                ${yesPrice.toFixed(4)}
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateOrderDialogOpen(true, {
                  marketId: market.id,
                  outcome: 'NO',
                  side: 'BUY',
                  type: 'LIMIT',
                  price: noPrice.toFixed(4),
                });
              }}
              className="p-8 rounded-none bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors text-left cursor-pointer"
            >
              <div className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
                NO
              </div>
              <div className="text-6xl font-bold text-white mb-3 leading-none">
                {noPercent}%
              </div>
              <div className="text-lg font-mono text-white/90 font-medium">
                ${noPrice.toFixed(4)}
              </div>
            </button>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            {market.volume && (
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Volume
                </div>
                <div className="text-lg font-semibold">
                  {formatVolume(market.volume)}
                </div>
              </div>
            )}
            {market.liquidity && (
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Liquidity
                </div>
                <div className="text-lg font-semibold">
                  {formatVolume(market.liquidity)}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Created
              </div>
              <div className="text-sm">{formatDateFull(market.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Updated
              </div>
              <div className="text-sm">{formatDateFull(market.updatedAt)}</div>
            </div>
          </div>

          {market.description && (
            <div className="pt-4 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </div>
              <div className="text-sm leading-relaxed">{String(market.description)}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

