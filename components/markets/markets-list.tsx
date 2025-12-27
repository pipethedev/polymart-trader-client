'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useMarkets } from '@/lib/hooks/use-markets';
import { useUIStore } from '@/lib/store/ui-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { formatVolume } from '@/lib/utils/format';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { format } from 'date-fns';

export function MarketsList() {
  const { 
    setSelectedMarketId, 
    marketsFilters,
    setMarketsFilters,
  } = useUIStore();
  
  const debouncedSearch = useDebounce(marketsFilters.search, 500);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useMarkets({
    search: debouncedSearch || undefined,
    active: marketsFilters.activeFilter,
    closed: marketsFilters.closedFilter,
    volumeMin: marketsFilters.volumeMin ? parseFloat(marketsFilters.volumeMin) : undefined,
    volumeMax: marketsFilters.volumeMax ? parseFloat(marketsFilters.volumeMax) : undefined,
    liquidityMin: marketsFilters.liquidityMin ? parseFloat(marketsFilters.liquidityMin) : undefined,
    liquidityMax: marketsFilters.liquidityMax ? parseFloat(marketsFilters.liquidityMax) : undefined,
    createdAtMin: marketsFilters.createdAtMin ? format(marketsFilters.createdAtMin, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") : undefined,
    createdAtMax: marketsFilters.createdAtMax ? format(marketsFilters.createdAtMax, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") : undefined,
    updatedAtMin: marketsFilters.updatedAtMin ? format(marketsFilters.updatedAtMin, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") : undefined,
    updatedAtMax: marketsFilters.updatedAtMax ? format(marketsFilters.updatedAtMax, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'") : undefined,
  });

  const allMarkets = data?.pages.flatMap(page => page.data) || [];

  const marketsMap = new Map<number, typeof allMarkets[0]>();

  allMarkets.forEach(market => {
    const existing = marketsMap.get(market.id);
    if (!existing) {
      marketsMap.set(market.id, market);
    } else {
      const existingUpdated = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const currentUpdated = market.updatedAt ? new Date(market.updatedAt).getTime() : 0;
      if (currentUpdated > existingUpdated) {
        marketsMap.set(market.id, market);
      }
    }
  });
  
  const markets = Array.from(marketsMap.values()).sort((a, b) => {
    const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    if (bUpdated !== aUpdated) {
      return bUpdated - aUpdated;
    }
    return b.id - a.id;
  });

  const clearFilters = () => {
    setMarketsFilters({
      search: '',
      activeFilter: undefined,
      closedFilter: undefined,
      volumeMin: '',
      volumeMax: '',
      liquidityMin: '',
      liquidityMax: '',
      createdAtMin: undefined,
      createdAtMax: undefined,
      updatedAtMin: undefined,
      updatedAtMax: undefined,
      showFilters: false,
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px'
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const hasActiveFilters = 
    marketsFilters.search || 
    marketsFilters.activeFilter !== undefined || 
    marketsFilters.closedFilter !== undefined ||
    marketsFilters.volumeMin ||
    marketsFilters.volumeMax ||
    marketsFilters.liquidityMin ||
    marketsFilters.liquidityMax ||
    marketsFilters.createdAtMin ||
    marketsFilters.createdAtMax ||
    marketsFilters.updatedAtMin ||
    marketsFilters.updatedAtMax;

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
            <Card key={i} className="dark:border-0">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={marketsFilters.search}
            onChange={(e) => {
              setMarketsFilters({ search: e.target.value });
;
            }}
            className="pl-9 pr-9"
          />
          {marketsFilters.search && (
            <button
              type="button"
              onClick={() => {
                setMarketsFilters({ search: '' });
;
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setMarketsFilters({ showFilters: !marketsFilters.showFilters })}
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

      {marketsFilters.showFilters && (
        <Card className="rounded-none">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Closed Status</Label>
                <Select
                  value={marketsFilters.closedFilter === undefined ? 'all' : marketsFilters.closedFilter ? 'closed' : 'open'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setMarketsFilters({ closedFilter: undefined });
                    } else {
                      setMarketsFilters({ closedFilter: value === 'closed' });
                    }
;
                  }}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Volume Min</Label>
                <Input
                  type="number"
                  placeholder="Min volume"
                  value={marketsFilters.volumeMin}
                  onChange={(e) => {
                    setMarketsFilters({ volumeMin: e.target.value });
;
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Volume Max</Label>
                <Input
                  type="number"
                  placeholder="Max volume"
                  value={marketsFilters.volumeMax}
                  onChange={(e) => {
                    setMarketsFilters({ volumeMax: e.target.value });
;
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Liquidity Min</Label>
                <Input
                  type="number"
                  placeholder="Min liquidity"
                  value={marketsFilters.liquidityMin}
                  onChange={(e) => {
                    setMarketsFilters({ liquidityMin: e.target.value });
;
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Liquidity Max</Label>
                <Input
                  type="number"
                  placeholder="Max liquidity"
                  value={marketsFilters.liquidityMax}
                  onChange={(e) => {
                    setMarketsFilters({ liquidityMax: e.target.value });
;
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Created From</Label>
                <DatePicker
                  date={marketsFilters.createdAtMin}
                  onDateChange={(date) => {
                    setMarketsFilters({ createdAtMin: date });
;
                  }}
                  placeholder="Select start date"
                />
              </div>

              <div className="space-y-2">
                <Label>Created To</Label>
                <DatePicker
                  date={marketsFilters.createdAtMax}
                  onDateChange={(date) => {
                    setMarketsFilters({ createdAtMax: date });
;
                  }}
                  placeholder="Select end date"
                />
              </div>

              <div className="space-y-2">
                <Label>Updated From</Label>
                <DatePicker
                  date={marketsFilters.updatedAtMin}
                  onDateChange={(date) => {
                    setMarketsFilters({ updatedAtMin: date });
;
                  }}
                  placeholder="Select start date"
                />
              </div>

              <div className="space-y-2">
                <Label>Updated To</Label>
                <DatePicker
                  date={marketsFilters.updatedAtMax}
                  onDateChange={(date) => {
                    setMarketsFilters({ updatedAtMax: date });
;
                  }}
                  placeholder="Select end date"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {markets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No markets found
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => {
            const yesPrice = parseFloat(market.outcomeYesPrice);
            const noPrice = parseFloat(market.outcomeNoPrice);
            const yesPercent = (yesPrice * 100).toFixed(1);
            const noPercent = (noPrice * 100).toFixed(1);

            return (
              <motion.div
                key={market.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                layoutId={`market-${market.id}`}
              >
                  <Card
                    className="rounded-none cursor-pointer hover:border-foreground/30 transition-all hover:shadow-sm"
                    onClick={() => setSelectedMarketId(market.id)}
                  >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3 mb-3">
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
                    <div className="flex items-start justify-between gap-3 flex-1 min-w-0">
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
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5 rounded-none bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors">
                      <div className="text-xs font-semibold text-white uppercase tracking-wide mb-1.5">
                        YES
                      </div>
                      <div className="text-2xl font-bold text-white leading-none">
                        {yesPercent}%
                      </div>
                    </div>
                    <div className="p-3.5 rounded-none bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors">
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
        </div>
      )}

      {/* Infinite scroll trigger and loading indicator */}
      <div ref={loadMoreRef} className="py-8 flex flex-col items-center justify-center gap-4">
        {isFetchingNextPage && (
          <>
            <div className="flex items-center gap-2 text-sm text-foreground dark:text-gray-300">
              <div className="h-4 w-4 border-2 border-foreground dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
              <span>Loading more markets...</span>
            </div>
            {/* Show skeleton loaders while fetching */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={`loading-${i}`} className="rounded-none dark:border-0">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
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
          </>
        )}
      </div>
    </div>
  );
}

