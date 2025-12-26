import { create } from 'zustand';

type Tab = 'events' | 'markets' | 'orders';

interface CreateOrderPrefill {
  marketId?: number;
  outcome?: 'YES' | 'NO';
  side?: 'BUY' | 'SELL';
  type?: 'MARKET' | 'LIMIT';
  price?: string;
}

interface UIState {
  activeTab: Tab;
  selectedEventId: number | null;
  selectedMarketId: number | null;
  selectedOrderId: number | null;
  isCreateOrderDialogOpen: boolean;
  createOrderPrefill: CreateOrderPrefill | null;
  eventsPage: number;
  marketsPage: number;
  ordersPage: number;
  setActiveTab: (tab: Tab) => void;
  setSelectedEventId: (id: number | null) => void;
  setSelectedMarketId: (id: number | null) => void;
  setSelectedOrderId: (id: number | null) => void;
  setCreateOrderDialogOpen: (open: boolean, prefill?: CreateOrderPrefill | null) => void;
  setEventsPage: (page: number) => void;
  setMarketsPage: (page: number) => void;
  setOrdersPage: (page: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'markets',
  selectedEventId: null,
  selectedMarketId: null,
  selectedOrderId: null,
  isCreateOrderDialogOpen: false,
  createOrderPrefill: null,
  eventsPage: 1,
  marketsPage: 1,
  ordersPage: 1,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  setSelectedMarketId: (id) => set({ selectedMarketId: id }),
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
  setCreateOrderDialogOpen: (open, prefill = null) => 
    set({ 
      isCreateOrderDialogOpen: open,
      createOrderPrefill: open ? prefill : null,
    }),
  setEventsPage: (page) => set({ eventsPage: page }),
  setMarketsPage: (page) => set({ marketsPage: page }),
  setOrdersPage: (page) => set({ ordersPage: page }),
}));

