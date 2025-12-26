'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarkets } from '@/lib/hooks/use-markets';
import { useUIStore } from '@/lib/store/ui-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ToggleButton } from '@/components/ui/toggle-button';
import { formatVolume } from '@/lib/utils/format';
import { useDebounce } from '@/lib/hooks/use-debounce';

export function MarketsList() {
  const { selectedMarketId, setSelectedMarketId, marketsPage, setMarketsPage } =
    useUIStore();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );

  const { data, isLoading, error } = useMarkets({
    page: marketsPage,
    pageSize: 20,
    search: debouncedSearch || undefined,
    active: activeFilter,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-full" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
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
        Error loading markets: {error.message}
      </div>
    );
  }

  const markets = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMarketsPage(1);
            }}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setMarketsPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <ToggleButton
          value={activeFilter}
          onValueChange={(value) => {
            setActiveFilter(value);
            setMarketsPage(1);
          }}
        />
      </div>

      {markets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No markets found
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {markets.map((market, index) => {
              const yesPrice = parseFloat(market.outcomeYesPrice);
              const noPrice = parseFloat(market.outcomeNoPrice);
              const yesPercent = (yesPrice * 100).toFixed(1);
              const noPercent = (noPrice * 100).toFixed(1);

              return (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                >
                  <Card
                    className="rounded-none cursor-pointer hover:border-foreground/30 transition-all hover:shadow-sm"
                    onClick={() => setSelectedMarketId(market.id)}
                  >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 flex-1 text-foreground">
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
                      className="shrink-0 text-[10px] px-1.5 py-0.5"
                    >
                      {market.closed
                        ? 'Closed'
                        : market.active
                          ? 'Active'
                          : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5 rounded-none bg-green-500 hover:bg-green-600 transition-colors">
                      <div className="text-xs font-semibold text-white uppercase tracking-wide mb-1.5">
                        YES
                      </div>
                      <div className="text-2xl font-bold text-white leading-none">
                        {yesPercent}%
                      </div>
                    </div>
                    <div className="p-3.5 rounded-none bg-red-500 hover:bg-red-600 transition-colors">
                      <div className="text-xs font-semibold text-white uppercase tracking-wide mb-1.5">
                        NO
                      </div>
                      <div className="text-2xl font-bold text-white leading-none">
                        {noPercent}%
                      </div>
                    </div>
                  </div>
                  {market.volume && (
                    <div className="flex items-center justify-end text-[11px] text-muted-foreground pt-2.5 border-t border-border/50">
                      <span className="font-medium">
                        Vol: {formatVolume(market.volume)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
                </motion.div>
              );
            })}
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
              onClick={() => setMarketsPage(Math.max(1, marketsPage - 1))}
              disabled={marketsPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() =>
                setMarketsPage(Math.min(meta.totalPages, marketsPage + 1))
              }
              disabled={marketsPage === meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

