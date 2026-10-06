import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { LedgerItem, PaginatedResponse, Wallet } from '../types';

// Fetch Wallet Balance
export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const { data } = await api.get<{ status: string; data: Wallet }>('/wallet');
      return data.data;
    },
    staleTime: 1000 * 10,
  });
};

// Fetch Transaction Ledgers History
export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await api.get<{ status: string; data: PaginatedResponse<LedgerItem> }>('/transactions');
      return data.data;
    },
    staleTime: 1000 * 10,
  });
};

// TopUp Mutation with Optimistic Update
export const useTopUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
      const idempotencyKey = `TOPUP-${crypto.randomUUID()}`;
      const { data } = await api.post('/wallet/topup', { amount, description }, {
        headers: { 'X-Idempotency-Key': idempotencyKey },
      });
      return data;
    },
    onMutate: async ({ amount }) => {
      await queryClient.cancelQueries({ queryKey: ['wallet'] });
      const previousWallet = queryClient.getQueryData<Wallet>(['wallet']);

      if (previousWallet) {
        queryClient.setQueryData<Wallet>(['wallet'], {
          ...previousWallet,
          balance: previousWallet.balance + amount,
        });
      }

      return { previousWallet };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousWallet) {
        queryClient.setQueryData(['wallet'], context.previousWallet);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

// Transfer Mutation with Optimistic Update
export const useTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient_email, amount, description }: { recipient_email: string; amount: number; description?: string }) => {
      const idempotencyKey = `TX-${crypto.randomUUID()}`;
      const { data } = await api.post('/wallet/transfer', { recipient_email, amount, description }, {
        headers: { 'X-Idempotency-Key': idempotencyKey },
      });
      return data;
    },
    onMutate: async ({ amount }) => {
      await queryClient.cancelQueries({ queryKey: ['wallet'] });
      const previousWallet = queryClient.getQueryData<Wallet>(['wallet']);

      if (previousWallet) {
        queryClient.setQueryData<Wallet>(['wallet'], {
          ...previousWallet,
          balance: Math.max(0, previousWallet.balance - amount),
        });
      }

      return { previousWallet };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousWallet) {
        queryClient.setQueryData(['wallet'], context.previousWallet);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
