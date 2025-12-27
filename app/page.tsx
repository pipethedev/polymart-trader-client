'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventsList } from '@/components/events/events-list';
import { EventDetail } from '@/components/events/event-detail';
import { MarketsList } from '@/components/markets/markets-list';
import { MarketDetail } from '@/components/markets/market-detail';
import { OrdersList } from '@/components/orders/orders-list';
import { OrderDetail } from '@/components/orders/order-detail';
import { CreateOrderForm } from '@/components/orders/create-order-form';
import { useUIStore } from '@/lib/store/ui-store';
import { WalletConnectButton } from '@/lib/wallet/wallet-connect';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    selectedEventId,
    selectedMarketId,
    selectedOrderId,
  } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Polymarket Trader</h1>
            <p className="text-muted-foreground text-lg">
              Trade prediction markets
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-4">
            <ThemeToggle />
            <WalletConnectButton />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="markets" className="mt-6">
            {selectedMarketId ? (
              <MarketDetail />
            ) : (
              <MarketsList />
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {selectedEventId ? (
              <EventDetail />
            ) : (
              <EventsList />
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {selectedOrderId ? (
              <OrderDetail />
            ) : (
              <OrdersList />
            )}
          </TabsContent>
        </Tabs>

        <CreateOrderForm />
      </div>
    </div>
  );
}
