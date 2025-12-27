export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
}

export interface Event {
  id: number;
  externalId: string;
  title: string;
  description?: any;
  slug?: any;
  image?: string | null;
  startDate?: any;
  endDate?: any;
  active: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  marketCount?: number;
  markets?: any[];
}

export interface EventListResponse {
  data: Event[];
  meta: PaginationMeta;
}

export interface Market {
  id: number;
  externalId: string;
  conditionId?: any;
  eventId: number;
  question: string;
  description?: any;
  image?: string | null;
  outcomeYesPrice: string;
  outcomeNoPrice: string;
  volume?: any;
  liquidity?: any;
  active: boolean;
  closed: boolean;
  createdAt: string;
  updatedAt: string;
  tokens?: Token[];
  eventTitle?: string;
  event?: any;
}

export interface Token {
  id: number;
  tokenId: string;
  outcome: 'YES' | 'NO';
  price: string;
}

export interface MarketListResponse {
  data: Market[];
  meta: PaginationMeta;
}

export interface CreateOrderDto {
  marketId: number;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  outcome: 'YES' | 'NO';
  quantity: string;
  price?: string;
  metadata?: any;
  walletAddress?: string;
  signature?: string;
  nonce?: string;
}

export interface Order {
  id: number;
  idempotencyKey: string;
  marketId: number;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  outcome: 'YES' | 'NO';
  quantity: string;
  price?: any;
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'FAILED';
  filledQuantity: string;
  averageFillPrice?: any;
  externalOrderId?: any;
  failureReason?: any;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  data: Order[];
  meta: PaginationMeta;
}

export interface SyncResponse {
  jobId: string;
  message: string;
}

