'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useEvents } from '@/lib/hooks/use-events';
import { useUIStore } from '@/lib/store/ui-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { useDebounce } from '@/lib/hooks/use-debounce';

export function EventsList() {
  const { 
    setSelectedEventId, 
    eventsFilters,
    setEventsFilters,
  } = useUIStore();
    
  const debouncedSearch = useDebounce(eventsFilters.search, 500);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useEvents({
    search: debouncedSearch || undefined,
    active: eventsFilters.activeFilter,
    featured: eventsFilters.featuredFilter,
  });

  const allEvents = data?.pages.flatMap(page => page.data) || [];

  const eventsMap = new Map<number, typeof allEvents[0]>();
  allEvents.forEach(event => {
    if (!eventsMap.has(event.id)) {
      eventsMap.set(event.id, event);
    }
  });
  
  const events = Array.from(eventsMap.values());

  const hasActiveFilters = 
    eventsFilters.search || 
    eventsFilters.activeFilter !== undefined || 
    eventsFilters.featuredFilter !== undefined;

  const clearFilters = () => {
    setEventsFilters({
      search: '',
      activeFilter: undefined,
      featuredFilter: undefined,
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
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
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-32" />
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
        Error loading events: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={eventsFilters.search}
            onChange={(e) => {
              setEventsFilters({ search: e.target.value });
            }}
            className="pl-9 pr-9"
          />
          {eventsFilters.search && (
            <button
              type="button"
              onClick={() => {
                setEventsFilters({ search: '' });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setEventsFilters({ showFilters: !eventsFilters.showFilters })}
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

      {eventsFilters.showFilters && (
        <Card className="rounded-none">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Active Status</Label>
                <Select
                  value={eventsFilters.activeFilter === undefined ? 'all' : eventsFilters.activeFilter ? 'active' : 'inactive'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setEventsFilters({ activeFilter: undefined });
                    } else {
                      setEventsFilters({ activeFilter: value === 'active' });
                    }
                  }}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Featured Status</Label>
                <Select
                  value={eventsFilters.featuredFilter === undefined ? 'all' : eventsFilters.featuredFilter ? 'featured' : 'not-featured'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setEventsFilters({ featuredFilter: undefined });
                    } else {
                      setEventsFilters({ featuredFilter: value === 'featured' });
                    }
                  }}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="not-featured">Not Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

        {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No events found
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <Card
                  className="rounded-none cursor-pointer hover:border-foreground/50 transition-colors"
                  onClick={() => setSelectedEventId(event.id)}
                >
              <CardHeader>
                <div className="flex items-start gap-3">
                  {event.image && (
                    <div className="relative shrink-0 w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight flex-1">
                      {event.title}
                    </CardTitle>
                    <Badge variant={event.active ? 'success' : 'error'} className="shrink-0">
                      {event.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{event.marketCount || 0} Markets</span>
                  <span>{formatDate(event.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Infinite scroll trigger and loading indicator */}
      <div ref={loadMoreRef} className="py-8 flex flex-col items-center justify-center gap-4">
        {isFetchingNextPage && (
          <>
            <div className="flex items-center gap-2 text-sm text-foreground dark:text-gray-300">
              <div className="h-4 w-4 border-2 border-foreground dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
              <span>Loading more events...</span>
            </div>
            {/* Show skeleton loaders while fetching */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={`loading-${i}`} className="dark:border-0">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-32" />
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

