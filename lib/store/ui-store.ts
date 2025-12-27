import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Tab = 'events' | 'markets' | 'orders';

interface CreateOrderPrefill {
  marketId?: number;
  outcome?: 'YES' | 'NO';
  side?: 'BUY' | 'SELL';
  type?: 'MARKET' | 'LIMIT';
  price?: string;
}

interface EventsFilters {
  search: string;
  activeFilter: boolean | undefined;
  featuredFilter: boolean | undefined;
  showFilters: boolean;
}

interface MarketsFilters {
  search: string;
  activeFilter: boolean | undefined;
  closedFilter: boolean | undefined;
  volumeMin: string;
  volumeMax: string;
  liquidityMin: string;
  liquidityMax: string;
  createdAtMin: Date | undefined;
  createdAtMax: Date | undefined;
  updatedAtMin: Date | undefined;
  updatedAtMax: Date | undefined;
  showFilters: boolean;
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
  eventsFilters: EventsFilters;
  marketsFilters: MarketsFilters;
  theme: 'dark' | 'light';
  setActiveTab: (tab: Tab) => void;
  setSelectedEventId: (id: number | null) => void;
  setSelectedMarketId: (id: number | null) => void;
  setSelectedOrderId: (id: number | null) => void;
  setCreateOrderDialogOpen: (open: boolean, prefill?: CreateOrderPrefill | null) => void;
  setEventsPage: (page: number) => void;
  setMarketsPage: (page: number) => void;
  setOrdersPage: (page: number) => void;
  setEventsFilters: (filters: Partial<EventsFilters>) => void;
  setMarketsFilters: (filters: Partial<MarketsFilters>) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: 'markets',
      selectedEventId: null,
      selectedMarketId: null,
      selectedOrderId: null,
      isCreateOrderDialogOpen: false,
      createOrderPrefill: null,
      eventsPage: 1,
      marketsPage: 1,
      ordersPage: 1,
      theme: 'dark',
      eventsFilters: {
        search: '',
        activeFilter: undefined,
        featuredFilter: undefined,
        showFilters: false,
      },
      marketsFilters: {
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
      },
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
      setEventsFilters: (filters) => 
        set((state) => ({
          eventsFilters: { ...state.eventsFilters, ...filters },
        })),
      setMarketsFilters: (filters) => 
        set((state) => ({
          marketsFilters: { ...state.marketsFilters, ...filters },
        })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'polymarket-trader-ui',
      partialize: (state) => ({ theme: state.theme }),
      skipHydration: true,
    }
  )
);

