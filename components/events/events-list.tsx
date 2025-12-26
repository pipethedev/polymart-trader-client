'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvents } from '@/lib/hooks/use-events';
import { useUIStore } from '@/lib/store/ui-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleButton } from '@/components/ui/toggle-button';
import { Search, X } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { useDebounce } from '@/lib/hooks/use-debounce';

export function EventsList() {
  const { setSelectedEventId, eventsPage, setEventsPage } = useUIStore();
    
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );

  const { data, isLoading, error } = useEvents({
    page: eventsPage,
    pageSize: 20,
    search: debouncedSearch || undefined,
    active: activeFilter,
  });

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
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
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

  const events = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setEventsPage(1);
            }}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setEventsPage(1);
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
            setEventsPage(1);
          }}
        />
      </div>

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
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight flex-1">
                    {event.title}
                  </CardTitle>
                  <Badge variant={event.active ? 'success' : 'error'} className="shrink-0">
                    {event.active ? 'Active' : 'Inactive'}
                  </Badge>
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
              onClick={() => setEventsPage(Math.max(1, eventsPage - 1))}
              disabled={eventsPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() =>
                setEventsPage(Math.min(meta.totalPages, eventsPage + 1))
              }
              disabled={eventsPage === meta.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

