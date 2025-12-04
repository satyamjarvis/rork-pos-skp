export interface TilleggsvareVariant {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  type?: 'add' | 'remove' | 'other';
}

export interface Item {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  addOns?: TilleggsvareVariant[];
}

export interface CashBreakdown {
  denomination: number;
  count: number;
  type: 'bill' | 'coin';
}

export interface Transaction {
  id: string;
  items: Item[];
  amount: number;
  received: number;
  change: number;
  cashBreakdown: CashBreakdown[];
  timestamp: number;
  date: string;
  paymentMethod?: string;
  customerName?: string;
}
