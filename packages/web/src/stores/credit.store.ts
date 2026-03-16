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

  fetchBalance: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const data = (await api.credits.balance(token)) as { balance: number };
      set({ balance: data.balance, loading: false });
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
      const data = (await api.credits.transactions(token, page)) as {
        transactions: Transaction[];
        totalPages: number;
        page: number;
      };
      set({
        transactions: data.transactions,
        totalPages: data.totalPages,
        currentPage: data.page,
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
