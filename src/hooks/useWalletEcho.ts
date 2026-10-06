import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useQueryClient } from '@tanstack/react-query';
import type { Wallet } from '../types';

// Assign global pusher for Laravel Echo compatibility
(window as any).Pusher = Pusher;

export const useWalletEcho = (userId?: number, authToken?: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !authToken) return;

    const echo = new Echo({
      broadcaster: 'reverb',
      key: 'fintech-key',
      wsHost: window.location.hostname,
      wsPort: 8080,
      wssPort: 8080,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: 'http://localhost:8000/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
      },
    });

    const channel = echo.private(`user.${userId}`);

    channel.listen('.wallet.updated', (eventData: { balance: number; currency: string }) => {
      // Update cache saldo seketika dari WebSocket broadcast
      queryClient.setQueryData<Wallet>(['wallet'], (old) => {
        if (!old) return old;
        return { ...old, balance: eventData.balance };
      });
      // Invalidate mutasi ledger
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    });

    return () => {
      channel.stopListening('.wallet.updated');
      echo.leave(`user.${userId}`);
      echo.disconnect();
    };
  }, [userId, authToken, queryClient]);
};
