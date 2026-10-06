import React, { useState } from 'react';
import { useWallet, useTransactions, useTopUp, useTransfer } from './hooks/useWallet';
import { useWalletEcho } from './hooks/useWalletEcho';
import { VirtualLedgerList } from './components/VirtualLedgerList';
import { api } from './services/api';
import { 
  RotateCw, 
  Send, 
  Plus, 
  LogOut, 
  Lock, 
  Check, 
  AlertCircle
} from 'lucide-react';

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isRegister, setIsRegister] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('alice@fintech.test');
  const [authPassword, setAuthPassword] = useState('password123');
  const [authError, setAuthError] = useState<string | null>(null);

  const [actionTab, setActionTab] = useState<'TRANSFER' | 'TOPUP'>('TRANSFER');
  const [recipientEmail, setRecipientEmail] = useState('bob@fintech.test');
  const [transferAmount, setTransferAmount] = useState<number>(150000);
  const [transferDesc, setTransferDesc] = useState('Pembayaran Keanggotaan Privat');

  const [topUpAmount, setTopUpAmount] = useState<number>(500000);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // TanStack React Query Hooks
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWallet();
  const { data: txData, isLoading: txLoading, refetch: refetchTx } = useTransactions();
  const topUpMutation = useTopUp();
  const transferMutation = useTransfer();

  // Real-time WebSocket listener (Reverb / Echo)
  useWalletEcho(user?.id, token);

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
      setAuthError(err.response?.data?.message || 'Akses otorisasi ditolak.');
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await transferMutation.mutateAsync({
        recipient_email: recipientEmail,
        amount: Number(transferAmount),
        description: transferDesc,
      });
      setFeedback({ type: 'success', message: res.message || 'Instruksi transfer berhasil dieksekusi.' });
      setTransferDesc('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Instruksi transfer ditolak oleh sistem.' });
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await topUpMutation.mutateAsync({
        amount: Number(topUpAmount),
        description: 'Penambahan Likuiditas Dompet',
      });
      setFeedback({ type: 'success', message: res.message || 'Likuiditas saldo berhasil ditambahkan.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal menambahkan likuiditas.' });
    }
  };

  // Auth Screen (Luxury Minimal Aesthetic)
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col justify-between p-6 sm:p-12 font-serif selection:bg-amber-100">
        <div className="text-center pt-8">
          <div className="tracking-[0.3em] uppercase text-xs text-amber-800 font-semibold mb-2">Grand Ledger • Haute Finance</div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-stone-900">AURUM &amp; CO.</h1>
          <div className="w-12 h-[1px] bg-amber-800/40 mx-auto mt-4"></div>
        </div>

        <div className="max-w-md w-full mx-auto bg-white border border-stone-200/80 p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          <div className="flex border-b border-stone-200 mb-8 pb-3 justify-center gap-8 text-xs uppercase tracking-widest">
            <button
              onClick={() => { setIsRegister(false); setAuthError(null); }}
              className={`pb-2 transition cursor-pointer ${!isRegister ? 'text-amber-900 border-b-2 border-amber-900 font-semibold' : 'text-stone-400 hover:text-stone-700'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setAuthError(null); }}
              className={`pb-2 transition cursor-pointer ${isRegister ? 'text-amber-900 border-b-2 border-amber-900 font-semibold' : 'text-stone-400 hover:text-stone-700'}`}
            >
              Register Private Account
            </button>
          </div>

          {authError && (
            <div className="mb-6 p-3 bg-stone-50 border border-stone-300 text-stone-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-800 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-6">
            {isRegister && (
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Nama Pemegang Rekening</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="e.g. Lady Victoria"
                  className="w-full bg-[#FCFBF8] border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-amber-800 font-sans"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Alamat Email Terdaftar</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="alice@fintech.test"
                className="w-full bg-[#FCFBF8] border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-amber-800 font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Kunci Otorisasi (Password)</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FCFBF8] border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-amber-800 font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-stone-900 hover:bg-amber-900 text-amber-50 uppercase tracking-[0.2em] text-xs py-4 transition-all duration-300 cursor-pointer shadow"
            >
              {isRegister ? 'Inisialisasi Portofolio' : 'Buka Brankas Digital'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-100 text-[11px] text-stone-400 text-center font-sans">
            Demo Credentials: <span className="text-stone-700 font-medium">alice@fintech.test</span> / <span className="text-stone-700 font-medium">password123</span>
          </div>
        </div>

        <div className="text-center text-[10px] uppercase tracking-[0.25em] text-stone-400 pb-4">
          Secured with Double-Entry Ledger &amp; SHA-256 HMAC Protocols
        </div>
      </div>
    );
  }

  // Dashboard Screen (TWG Tea Inspired Luxury Layout)
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 font-serif selection:bg-amber-100">
      {/* Top Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-20 px-6 sm:px-12 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border border-amber-800/40 flex items-center justify-center text-amber-900 text-xs font-serif font-bold">
              A
            </div>
            <div>
              <div className="text-sm tracking-[0.25em] uppercase font-bold text-stone-900">AURUM &amp; CO.</div>
              <div className="text-[10px] text-amber-800 tracking-widest uppercase">Private Ledger Banking</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-xs uppercase tracking-widest text-stone-900 font-semibold">{user?.name}</div>
              <div className="text-[10px] text-stone-400 font-sans tracking-wide">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 text-stone-500 hover:text-amber-900 hover:bg-stone-50 border border-transparent hover:border-stone-200 transition cursor-pointer"
              title="Keluar dari Sesi"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Luxury Layout */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Asset Overview & Action Suite */}
          <div className="lg:col-span-5 space-y-10">
            {/* Vault Balance Card */}
            <div className="bg-white border border-stone-200 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-amber-800 font-bold block mb-1">
                    Portofolio Likuiditas
                  </span>
                  <span className="text-xs text-stone-400 font-sans">
                    Rekening #{wallet?.id ? String(wallet.id).padStart(5, '0') : '00000'} • IDR
                  </span>
                </div>
                <button
                  onClick={() => { refetchWallet(); refetchTx(); }}
                  className="p-1.5 text-stone-400 hover:text-stone-900 transition cursor-pointer"
                  title="Sinkronisasi Saldo"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${walletLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="text-3xl sm:text-4xl font-light text-stone-900 tracking-tight mb-6">
                {walletLoading ? '...' : formatIDR(wallet?.balance ?? 0)}
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-widest font-sans">
                <span className="flex items-center gap-1.5 text-amber-900">
                  <Lock className="w-3 h-3" /> Pessimistic Locked
                </span>
                <span>Audit Status: Reconciled</span>
              </div>
            </div>

            {/* Actions: Transfer & Top-Up Suite */}
            <div className="bg-white border border-stone-200 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
              <div className="flex border-b border-stone-200 pb-3 mb-6 justify-between text-xs uppercase tracking-widest">
                <button
                  onClick={() => { setActionTab('TRANSFER'); setFeedback(null); }}
                  className={`flex items-center gap-2 pb-2 transition cursor-pointer ${
                    actionTab === 'TRANSFER'
                      ? 'text-amber-900 border-b-2 border-amber-900 font-semibold'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" /> Transfer Dana
                </button>
                <button
                  onClick={() => { setActionTab('TOPUP'); setFeedback(null); }}
                  className={`flex items-center gap-2 pb-2 transition cursor-pointer ${
                    actionTab === 'TOPUP'
                      ? 'text-amber-900 border-b-2 border-amber-900 font-semibold'
                      : 'text-stone-400 hover:text-stone-700'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Saldo
                </button>
              </div>

              {feedback && (
                <div
                  className={`mb-6 p-3 text-xs flex items-center gap-2 border font-sans ${
                    feedback.type === 'success'
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {feedback.type === 'success' ? <Check className="w-4 h-4 text-amber-800" /> : <AlertCircle className="w-4 h-4 text-rose-800" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {actionTab === 'TRANSFER' ? (
                <form onSubmit={handleTransfer} className="space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Penerima Transfer</label>
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="bob@fintech.test"
                      className="w-full bg-[#FCFBF8] border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-800 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Jumlah Transfer (Rp)</label>
                    <input
                      type="number"
                      min={1000}
                      step={1000}
                      required
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(Number(e.target.value))}
                      className="w-full bg-[#FCFBF8] border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-800 font-sans font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Perihal / Keterangan</label>
                    <input
                      type="text"
                      value={transferDesc}
                      onChange={(e) => setTransferDesc(e.target.value)}
                      placeholder="Misal: Pembayaran Jasa"
                      className="w-full bg-[#FCFBF8] border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-800 font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={transferMutation.isPending}
                    className="w-full mt-2 bg-stone-900 hover:bg-amber-900 text-amber-50 uppercase tracking-[0.2em] text-xs py-3.5 transition-all duration-300 cursor-pointer disabled:opacity-50 shadow"
                  >
                    {transferMutation.isPending ? 'Mengunci Ledger & Mentransfer...' : 'Otorisasi Transfer'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleTopUp} className="space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Nominal Top Up (Rp)</label>
                    <input
                      type="number"
                      min={10000}
                      step={10000}
                      required
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(Number(e.target.value))}
                      className="w-full bg-[#FCFBF8] border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:border-amber-800 font-sans font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[100000, 500000, 2000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopUpAmount(amt)}
                        className="py-2 border border-stone-200 hover:border-amber-800 text-[11px] font-sans text-stone-600 hover:text-stone-900 transition"
                      >
                        +{amt / 1000}k
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={topUpMutation.isPending}
                    className="w-full mt-2 bg-stone-900 hover:bg-amber-900 text-amber-50 uppercase tracking-[0.2em] text-xs py-3.5 transition-all duration-300 cursor-pointer disabled:opacity-50 shadow"
                  >
                    {topUpMutation.isPending ? 'Menyetorkan Saldo...' : 'Konfirmasi Setoran'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Virtualized Double-Entry Ledger Book */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-stone-200 p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-stone-200">
                <div>
                  <h2 className="text-lg font-normal tracking-wide text-stone-900 uppercase text-xs tracking-[0.25em] text-amber-800 font-bold">
                    Buku Besar Mutasi Rekening
                  </h2>
                  <p className="text-xs text-stone-400 mt-1">Virtual Scroll Engine • Render 10.000+ Baris Tanpa Lag</p>
                </div>
                <div className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">
                  Double-Entry Ledger
                </div>
              </div>

              {/* Virtualized Component */}
              <VirtualLedgerList
                items={txData?.data || []}
                isLoading={txLoading}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
