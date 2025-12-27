'use client';

import Image from 'next/image';
import { useEvent, useEventMarkets } from '@/lib/hooks/use-events';
import { useUIStore } from '@/lib/store/ui-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { formatDateFull } from '@/lib/utils/date';

export function EventDetail() {
  const { selectedEventId, setSelectedEventId } = useUIStore();
  const { data: event, isLoading } = useEvent(selectedEventId);
  const { data: markets } = useEventMarkets(selectedEventId);

  if (!selectedEventId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Card className="dark:border-0">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
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

  if (!event) {
    return <div className="p-4">Event not found</div>;
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => setSelectedEventId(null)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      <Card className="rounded-none">
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
            <CardTitle className="flex-1">{event.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                ID
              </div>
              <div>{event.id}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                External ID
              </div>
              <div className="font-mono text-sm">{event.externalId}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Status
              </div>
              <Badge variant={event.active ? 'success' : 'error'}>
                {event.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Market Count
              </div>
              <div>{event.marketCount || 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Created At
              </div>
              <div>{formatDateFull(event.createdAt)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Updated At
              </div>
              <div>{formatDateFull(event.updatedAt)}</div>
            </div>
          </div>

          {event.description && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </div>
              <div className="text-sm">{String(event.description)}</div>
            </div>
          )}

          {markets && markets.length > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Markets
              </div>
              <div className="space-y-3">
                {markets.map((market: any, index: number) => {
                  const jsonString = typeof market === 'string' ? market : JSON.stringify(market, null, 2);
                  return (
                    <div
                      key={index}
                      className="rounded-none border border-border/60 bg-muted/30 dark:bg-muted/20 overflow-hidden"
                    >
                      <pre className="p-4 m-0 font-mono text-xs leading-relaxed overflow-x-auto">
                        <code className="text-foreground">{jsonString}</code>
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

