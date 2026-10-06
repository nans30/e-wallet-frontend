export interface User {
  id: number;
  name: string;
  email: string;
  wallet?: Wallet;
}

export interface Wallet {
  id: number;
  user_id: number;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  reference_id: string;
  user_id: number;
  type: 'TOPUP' | 'TRANSFER' | 'WITHDRAWAL';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  description?: string;
  created_at: string;
  user?: User;
}

export interface LedgerItem {
  id: number;
  transaction_id: number;
  wallet_id: number;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: number;
  balance_before: number;
  balance_after: number;
  created_at: string;
  transaction: Transaction;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}
