import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { LedgerItem } from '../types';

interface VirtualLedgerListProps {
  items: LedgerItem[];
  isLoading?: boolean;
}

export const VirtualLedgerList: React.FC<VirtualLedgerListProps> = ({ items, isLoading }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-stone-400 font-serif tracking-widest text-xs uppercase animate-pulse">
        Memuat Catatan Mutasi Buku Besar...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center text-stone-400 font-serif italic text-sm border border-dashed border-stone-200">
        Belum ada catatan mutasi ledger pada akun ini.
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[460px] overflow-auto divide-y divide-stone-100 border border-stone-200 bg-white"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          const isCredit = item.entry_type === 'CREDIT';

          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="p-4 flex items-center justify-between hover:bg-stone-50/80 transition-colors border-b border-stone-100/80"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-9 h-9 flex items-center justify-center text-xs font-serif uppercase tracking-widest border ${
                    isCredit
                      ? 'border-amber-700/30 text-amber-900 bg-amber-50/50'
                      : 'border-stone-400 text-stone-700 bg-stone-50'
                  }`}
                >
                  {isCredit ? 'CR' : 'DB'}
                </div>

                <div>
                  <div className="text-sm font-serif font-medium text-stone-900 tracking-wide">
                    {item.transaction.description || item.transaction.type}
                  </div>
                  <div className="text-[11px] text-stone-400 tracking-wider uppercase mt-0.5">
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • <span className="font-mono text-stone-300">REF: {item.transaction.reference_id}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`text-sm font-serif font-bold tracking-tight ${
                    isCredit ? 'text-amber-800' : 'text-stone-900'
                  }`}
                >
                  {isCredit ? '+' : '-'}{formatIDR(item.amount)}
                </div>
                <div className="text-[10px] text-stone-400 tracking-wider uppercase font-mono mt-0.5">
                  {formatIDR(item.balance_before)} → {formatIDR(item.balance_after)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
