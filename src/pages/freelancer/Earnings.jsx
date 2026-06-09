import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Download, PieChart, Loader2 } from 'lucide-react';
import api from '../../services/api';

const Earnings = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['freelancer-revenue'],
    queryFn: () => api.get('/analytics/freelancer-revenue').then((r) => r.data?.data ?? r.data),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/payments/transactions', { params: { limit: 10 } }).then((r) => r.data?.data ?? r.data),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  const totalEarnings = data?.totalEarnings || 0;
  const thisMonth = data?.thisMonth || 0;
  const weeklyData = data?.weeklyData || [];
  const distanceStats = data?.locationStats || [];
  const transactions = txData?.transactions || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 lg:p-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Earnings</h1>
          <p className="text-gray-400 mt-1">Track your income and performance</p>
        </div>
        <button
          onClick={() => {
            const csv = transactions.map((t) => `${t.description},${t.amount},${t.type},${t.createdAt}`).join('\n');
            const blob = new Blob([`Description,Amount,Type,Date\n${csv}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'earnings.csv'; a.click();
          }}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-900 to-gray-800 border border-indigo-500/30 p-6 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-500/20 p-3 rounded-xl"><DollarSign className="w-6 h-6 text-indigo-400" /></div>
                {data?.growthPercent != null && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +{data.growthPercent}%
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Earnings</p>
              <h2 className="text-4xl font-extrabold">₹{totalEarnings.toLocaleString('en-IN')}</h2>
            </div>
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gray-700 p-3 rounded-xl"><PieChart className="w-6 h-6 text-gray-400" /></div>
              </div>
              <p className="text-gray-400 text-sm font-medium mb-1">This Month</p>
              <h2 className="text-4xl font-extrabold">₹{thisMonth.toLocaleString('en-IN')}</h2>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>
            {txLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No transactions yet.</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx._id || tx.id}
                    className="flex justify-between items-center p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50 hover:border-gray-600 transition-colors">
                    <div>
                      <h4 className="font-bold text-white mb-1">{tx.description || 'Payment'}</h4>
                      <p className="text-sm text-gray-400">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN') : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${tx.type === 'CREDIT' ? 'text-emerald-400' : 'text-white'}`}>
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{(tx.amount || 0).toLocaleString('en-IN')}
                      </p>
                      <span className={`text-xs font-medium uppercase ${tx.status === 'completed' ? 'text-gray-500' : 'text-orange-400'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Earnings by Distance */}
        <div className="space-y-8">
          <div className="bg-gray-800 border border-gray-700 rounded-3xl p-6">
            <h3 className="text-lg font-bold mb-6">Earnings by Distance</h3>
            {distanceStats.length > 0 ? (
              <div className="space-y-6">
                {distanceStats.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300 font-medium">{item.label}</span>
                      <span className="text-white font-bold">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: item.value }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Fallback placeholder when no data yet
              <div className="space-y-6">
                {[
                  { label: 'Within 5km', value: '0%', color: 'bg-indigo-500' },
                  { label: '5 – 15km', value: '0%', color: 'bg-blue-500' },
                  { label: '15 – 30km', value: '0%', color: 'bg-purple-500' },
                  { label: '30km+', value: '0%', color: 'bg-gray-600' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300 font-medium">{item.label}</span>
                      <span className="text-white font-bold">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div className={`${item.color} h-2.5 rounded-full`} style={{ width: item.value }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <p className="text-sm text-indigo-300 leading-relaxed">
                <strong className="text-indigo-400">Tip:</strong> Focus on nearby jobs to maximize earnings and response time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;