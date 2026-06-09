import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import RazorpayButton from '../../components/RazorpayButton';

const useWalletData = () =>
  useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => api.get('/dashboard/wallet').then((r) => r.data?.data ?? r.data),
    staleTime: 30_000,
  });

const useTransactions = (params = {}) =>
  useQuery({
    queryKey: ['transactions', params],
    queryFn: () =>
      api.get('/payments/transactions', { params }).then((r) => r.data?.data ?? r.data),
  });

const Wallet = () => {
  const qc = useQueryClient();
  const { data: wallet, isLoading: walletLoading } = useWalletData();
  const { data: txData, isLoading: txLoading } = useTransactions({ limit: 10 });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState('500');

  const { mutate: withdraw, isPending: isWithdrawing } = useMutation({
    mutationFn: (data) => api.post('/wallet/withdraw', data),
    onSuccess: () => {
      toast.success('Withdrawal initiated. Arrives in 2-3 business days.');
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Withdrawal failed.'),
  });

  const handleWithdraw = () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0 || amount > balance) return;
    withdraw({ amount });
  };

  if (walletLoading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  const balance = wallet?.balance ?? 0;
  const escrow = wallet?.escrowBalance ?? 0;
  const transactions = txData?.transactions ?? txData ?? [];

  const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-8 text-foreground">Wallet & Payments</h1>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-primary via-indigo-600 to-purple-700 rounded-3xl p-8 shadow-2xl shadow-primary/20 relative overflow-hidden">
            <WalletIcon className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
            <p className="text-indigo-100 font-medium mb-2">Available Balance</p>
            <h2 className="text-5xl font-extrabold text-white mb-6">
              ₹{balance.toLocaleString('en-IN')}
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer backdrop-blur-sm"
              >
                <ArrowDownLeft className="w-4 h-4" /> Withdraw
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-white text-primary font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 hover:bg-indigo-50 transition-colors cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4" /> Add Money
              </button>
            </div>
          </div>

          {/* Escrow Card */}
          <div className="bg-card border border-border rounded-3xl p-8 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <h3 className="text-lg font-bold text-foreground">Funds in Escrow</h3>
            </div>
            <h2 className="text-4xl font-extrabold text-emerald-500">
              ₹{escrow.toLocaleString('en-IN')}
            </h2>
            <p className="text-muted-foreground text-xs mt-3">Protected until job completion.</p>

            {wallet?.todayIncome > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">Today's Income</p>
                <p className="text-lg font-bold text-emerald-500">+₹{wallet.todayIncome.toLocaleString('en-IN')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-lg text-foreground">Transaction History</h3>
            {txLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>

          {transactions.length === 0 && !txLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              <WalletIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No transactions yet. Add money to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {transactions.map((tx) => (
                <div
                  key={tx._id || tx.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${tx.type === 'CREDIT' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {tx.type === 'CREDIT' ? (
                        <ArrowDownRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        {tx.description || (tx.type === 'CREDIT' ? 'Payment Received' : 'Payment Sent')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-sm ${tx.type === 'CREDIT' ? 'text-emerald-500' : 'text-red-400'}`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'}₹{(tx.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Money Modal (Razorpay) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-foreground mb-2">Add Money to Wallet</h3>
            <p className="text-muted-foreground text-sm mb-6">Money is added instantly via Razorpay.</p>

            {/* Quick amount pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAddAmount(String(amt))}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                    addAmount === String(amt)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Custom Amount (₹)</label>
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                min="1"
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary text-lg font-bold"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-border rounded-xl text-muted-foreground hover:border-muted-foreground font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <RazorpayButton
                amount={Number(addAmount) || 500}
                label={`Pay ₹${(Number(addAmount) || 500).toLocaleString('en-IN')}`}
                onSuccess={() => setShowAddModal(false)}
                className="flex-1 bg-primary hover:opacity-90 text-primary-foreground py-3 rounded-xl shadow-md shadow-primary/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-foreground mb-2">Withdraw Funds</h3>
            <p className="text-muted-foreground text-sm mb-6">Arrives in 2-3 business days to your bank account.</p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">Amount (₹)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={balance}
                placeholder={`Max ₹${balance.toLocaleString('en-IN')}`}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:border-primary text-lg font-bold"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3 border border-border rounded-xl text-muted-foreground hover:border-muted-foreground font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) > balance}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;