'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

interface Transaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

interface CreditState {
  balance: number;
  transactions: Transaction[];
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
  setBalance: (balance: number) => void;
  fetchBalance: (token: string) => Promise<void>;
  fetchTransactions: (token: string, page?: number) => Promise<void>;
  deductCredits: (amount: number) => void;
}

export const useCreditStore = create<CreditState>()((set) => ({
  balance: 0,
  transactions: [],
  totalPages: 1,
  currentPage: 1,
  loading: false,
  error: null,

  setBalance: (balance: number) => set({ balance }),

  fetchBalance: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const res = (await api.credits.balance(token)) as {
        success: boolean;
        data: { creditBalance: number; earningsBalance: number };
      };
      set({ balance: res.data.creditBalance, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch balance',
      });
    }
  },

  fetchTransactions: async (token: string, page = 1) => {
    set({ loading: true, error: null });
    try {
      const res = (await api.credits.transactions(token, page)) as {
        success: boolean;
        data: {
          items: Transaction[];
          totalPages: number;
          page: number;
          total: number;
          pageSize: number;
        };
      };
      set({
        transactions: res.data.items,
        totalPages: res.data.totalPages,
        currentPage: res.data.page,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch transactions',
      });
    }
  },

  deductCredits: (amount: number) => {
    set((state) => ({ balance: state.balance - amount }));
  },
}));
