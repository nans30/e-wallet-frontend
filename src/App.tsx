import React, { useState } from 'react';
import { useWallet, useTransactions, useTopUp, useTransfer } from './hooks/useWallet';
import { api } from './services/api';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Send, 
  PlusCircle, 
  LogOut, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Form states for login/register
  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('alice@fintech.test');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authError, setAuthError] = useState<string | null>(null);

  // Modal / Action states
  const [actionTab, setActionTab] = useState<'TRANSFER' | 'TOPUP'>('TRANSFER');
  const [recipientEmail, setRecipientEmail] = useState('bob@fintech.test');
  const [transferAmount, setTransferAmount] = useState<number>(50000);
  const [transferDesc, setTransferDesc] = useState('Bayar tagihan kopi');

  const [topUpAmount, setTopUpAmount] = useState<number>(100000);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // React Query Hooks
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWallet();
  const { data: txData, isLoading: txLoading, refetch: refetchTx } = useTransactions();
  const topUpMutation = useTopUp();
  const transferMutation = useTransfer();

  // Helper Formatter
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const endpoint = isRegister ? '/register' : '/login';
      const payload = isRegister 
        ? { name: authName, email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword };

      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Gagal melakukan autentikasi');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    try {
      const res = await transferMutation.mutateAsync({
        recipient_email: recipientEmail,
        amount: Number(transferAmount),
        description: transferDesc,
      });
      setActionMessage({ type: 'success', text: res.message || 'Transfer berhasil!' });
      setTransferDesc('');
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Transfer gagal diproses' });
    }
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    try {
      const res = await topUpMutation.mutateAsync({
        amount: Number(topUpAmount),
        description: 'Top-up saldo mandiri',
      });
      setActionMessage({ type: 'success', text: res.message || 'Top up berhasil!' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Top up gagal diproses' });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">FinTech Ledger</h1>
              <p className="text-xs text-slate-400">Double-Entry Core Banking System</p>
            </div>
          </div>

          <div className="flex rounded-xl bg-slate-800 p-1 mb-6">
            <button
              onClick={() => { setIsRegister(false); setAuthError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                !isRegister ? 'bg-emerald-500 text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setAuthError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                isRegister ? 'bg-emerald-500 text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="alice@fintech.test"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              {isRegister ? 'Daftar & Klaim Saldo Awal' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-xs text-slate-500 text-center">
            <p className="font-semibold text-slate-400 mb-1">Demo Akun Tersedia:</p>
            <p>1. alice@fintech.test / password123</p>
            <p>2. bob@fintech.test / password123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">FinTech Payment Ledger</h1>
              <p className="text-xs text-slate-400">Pessimistic Locking & Idempotent API</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white">{user?.name}</div>
              <div className="text-xs text-slate-400">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-xl transition cursor-pointer border border-slate-700"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Wallet Balance & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Wallet Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 text-white shadow-xl shadow-emerald-950/40 relative overflow-hidden">
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                <WalletIcon className="w-48 h-48" />
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100/80">Available Balance</span>
                <button
                  onClick={() => { refetchWallet(); refetchTx(); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer"
                  title="Refresh Balance"
                >
                  <RefreshCw className={`w-4 h-4 ${walletLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="text-3xl font-extrabold tracking-tight mb-2">
                {walletLoading ? 'Memuat...' : formatIDR(wallet?.balance ?? 0)}
              </div>

              <div className="text-xs text-emerald-100/70 font-mono">
                Wallet ID: #WLT-{wallet?.id ? String(wallet.id).padStart(4, '0') : '----'} • IDR
              </div>
            </div>

            {/* Actions: Transfer & TopUp Tabs */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex rounded-xl bg-slate-800 p-1 mb-6">
                <button
                  onClick={() => { setActionTab('TRANSFER'); setActionMessage(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    actionTab === 'TRANSFER' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" /> Transfer
                </button>
                <button
                  onClick={() => { setActionTab('TOPUP'); setActionMessage(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    actionTab === 'TOPUP' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Top Up
                </button>
              </div>

              {actionMessage && (
                <div
                  className={`mb-4 p-3 border text-xs rounded-xl flex items-center gap-2 ${
                    actionMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {actionTab === 'TRANSFER' ? (
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Penerima</label>
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="bob@fintech.test"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nominal (Rp)</label>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      required
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Catatan (Opsional)</label>
                    <input
                      type="text"
                      value={transferDesc}
                      onChange={(e) => setTransferDesc(e.target.value)}
                      placeholder="Bayar split bill"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={transferMutation.isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 text-sm shadow-md"
                  >
                    {transferMutation.isPending ? 'Memproses Transaksi...' : 'Kirim Transfer Sekarang'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleTopUpSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nominal Top Up (Rp)</label>
                    <input
                      type="number"
                      min={10000}
                      step={10000}
                      required
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="flex gap-2">
                    {[50000, 100000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopUpAmount(amt)}
                        className="flex-1 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition"
                      >
                        +{amt / 1000}k
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={topUpMutation.isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition duration-200 cursor-pointer disabled:opacity-50 text-sm shadow-md"
                  >
                    {topUpMutation.isPending ? 'Memproses Saldo...' : 'Konfirmasi Top Up'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Ledger Mutations & Audit Log */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Mutasi Rekening & Ledger</h2>
                  <p className="text-xs text-slate-400">Setiap mutasi dicatat dengan audit trail saldo sebelum & sesudah</p>
                </div>
                <span className="text-xs bg-slate-800 text-emerald-400 px-3 py-1 rounded-full border border-slate-700 font-mono">
                  Double-Entry Ledger
                </span>
              </div>

              {txLoading ? (
                <div className="py-12 text-center text-slate-500 text-sm">Memuat riwayat ledger...</div>
              ) : txData?.data.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">Belum ada mutasi transaksi pada wallet ini.</div>
              ) : (
                <div className="space-y-3">
                  {txData?.data.map((item) => {
                    const isCredit = item.entry_type === 'CREDIT';
                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl border mt-0.5 ${
                              isCredit
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>

                          <div>
                            <div className="text-sm font-semibold text-white">
                              {item.transaction.description || item.transaction.type}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(item.created_at).toLocaleString('id-ID')}</span>
                              <span>•</span>
                              <span className="text-slate-500">Ref: {item.transaction.reference_id}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right pl-11 sm:pl-0">
                          <div className={`text-base font-bold font-mono ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isCredit ? '+' : '-'}{formatIDR(item.amount)}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            Saldo: {formatIDR(item.balance_before)} → <span className="text-slate-300">{formatIDR(item.balance_after)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
