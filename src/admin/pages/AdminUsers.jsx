import React, { useEffect, useState, useCallback } from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight, Shield, ShieldX, Eye, Ban, UserCheck, UserX, X } from 'lucide-react';
import adminApi from '../api/adminApi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (roleFilter) params.role = roleFilter;
      const res = await adminApi.get('/users', { params });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = async () => {
    if (!search.trim()) return fetchUsers();
    setLoading(true);
    try {
      const res = await adminApi.get('/users/search', { params: { q: search } });
      setUsers(res.data.data);
      setPagination({ page: 1, pages: 1, total: res.data.count });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const viewUser = async (userId) => {
    setDetailLoading(true);
    try {
      const res = await adminApi.get(`/users/${userId}`);
      setSelectedUser(res.data.data);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const handleAction = async (userId, action) => {
    try {
      await adminApi.put(`/users/${userId}/${action}`);
      fetchUsers(pagination.page);
      if (selectedUser?._id === userId) viewUser(userId);
    } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
  };

  return (
    <div>
      <h1 className="text-xl font-extrabold text-white mb-1">User Management</h1>
      <p className="text-xs text-gray-500 mb-6">Search, view, and manage all platform users</p>

      {/* Search & filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name, email, mobile, username, or ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/30"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm text-gray-300 outline-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">All Roles</option>
          <option value="CLIENT">Client</option>
          <option value="FREELANCER">Freelancer</option>
        </select>
        <button onClick={handleSearch}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          Search
        </button>
      </div>

      {/* Users table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    {['User', 'Email', 'Role', 'KYC', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={u.profilePic || u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                            className="w-8 h-8 rounded-lg object-cover" style={{ background: 'rgba(99,102,241,0.1)' }} />
                          <div>
                            <p className="text-xs font-semibold text-gray-200">{u.name}</p>
                            <p className="text-[10px] text-gray-500">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role === 'CLIENT' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3">
                        {u.kycVerified || u.kyc?.aadharVerified
                          ? <Shield className="w-4 h-4 text-emerald-400" />
                          : <ShieldX className="w-4 h-4 text-red-400" />}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.isAvailable !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>{u.isAvailable !== false ? 'Active' : 'Suspended'}</span>
                      </td>
                      <td className="px-5 py-3 text-[10px] text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => viewUser(u._id)} title="View" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-indigo-400"><Eye className="w-3.5 h-3.5" /></button>
                          {u.isAvailable !== false
                            ? <button onClick={() => handleAction(u._id, 'suspend')} title="Suspend" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-yellow-400"><UserX className="w-3.5 h-3.5" /></button>
                            : <button onClick={() => handleAction(u._id, 'activate')} title="Activate" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-emerald-400"><UserCheck className="w-3.5 h-3.5" /></button>}
                          <button onClick={() => handleAction(u._id, 'block')} title="Block" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400"><Ban className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-gray-500">{pagination.total} users · Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-1.5">
                <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#12121e', borderColor: 'rgba(255,255,255,0.08)' }}>
            {detailLoading ? <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" /> : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">User Profile</h2>
                  <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
                </div>

                {/* Basic info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    ['Name', selectedUser.name], ['Email', selectedUser.email],
                    ['Username', `@${selectedUser.username}`], ['Mobile', selectedUser.mobileNumber || '—'],
                    ['Role', selectedUser.role], ['KYC', selectedUser.kycVerified ? '✅ Verified' : '❌ Not Verified'],
                    ['Joined', new Date(selectedUser.createdAt).toLocaleDateString()],
                    ['Status', selectedUser.isAvailable !== false ? '🟢 Active' : '🔴 Suspended'],
                  ].map(([k, v]) => (
                    <div key={k} className="px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{k}</p>
                      <p className="text-xs font-semibold text-gray-200 mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>

                {/* KYC details */}
                {selectedUser.kyc && (
                  <div className="mb-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">KYC Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Aadhaar:</span> <span className="text-gray-300">{selectedUser.kyc.aadharVerified ? '✅ Verified' : '❌ Pending'}</span></div>
                      <div><span className="text-gray-500">PAN:</span> <span className="text-gray-300">{selectedUser.kyc.panVerified ? '✅ Verified' : '❌ Pending'}</span></div>
                      <div><span className="text-gray-500">Status:</span> <span className="text-gray-300">{selectedUser.kyc.status || 'N/A'}</span></div>
                    </div>
                  </div>
                )}

                {/* Wallet/Earnings */}
                {selectedUser.earnings && (
                  <div className="mb-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Earnings</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">All Time:</span> <span className="text-emerald-400 font-bold">₹{selectedUser.earnings.allTimeIncome || 0}</span></div>
                      <div><span className="text-gray-500">Completed Jobs:</span> <span className="text-gray-300">{selectedUser.earnings.completedJobs || 0}</span></div>
                    </div>
                  </div>
                )}

                {/* Recent jobs */}
                {selectedUser.jobs?.length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Recent Jobs ({selectedUser.jobs.length})</h3>
                    <div className="space-y-2">
                      {selectedUser.jobs.slice(0, 5).map((j) => (
                        <div key={j._id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300 truncate max-w-[60%]">{j.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            j.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400'
                            : j.status === 'cancelled' ? 'bg-red-500/10 text-red-400'
                            : 'bg-blue-500/10 text-blue-400'
                          }`}>{j.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
