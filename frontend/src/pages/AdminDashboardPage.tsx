import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin.api';
import { useDispatch } from 'react-redux';
import { addToast } from '../store/slices/uiSlice';
import {
  ShieldCheck,
  Users,
  Activity,
  Layers,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const dispatch = useDispatch();

  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'audit'>('overview');
  const [loading, setLoading] = useState(true);

  // Credit adjustment modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState<string>('Bonus Grant');

  useEffect(() => {
    Promise.all([
      adminApi.getAnalytics().catch(() => null),
      adminApi.getUsers({ limit: 10 }).catch(() => ({ users: [] })),
      adminApi.getJobs({ limit: 10 }).catch(() => ({ jobs: [] })),
    ])
      .then(([analyticsRes, usersRes, jobsRes]) => {
        if (analyticsRes) setAnalytics(analyticsRes);
        if (usersRes?.users) setUsers(usersRes.users);
        if (jobsRes?.jobs) setJobs(jobsRes.jobs);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await adminApi.adjustCredits(selectedUser.id, {
        amount: Number(adjustAmount),
        reason: adjustReason,
      });
      dispatch(addToast({ type: 'success', message: `Adjusted credits for ${selectedUser.email}` }));
      setSelectedUser(null);
      // Refresh users
      const res = await adminApi.getUsers({ limit: 10 });
      setUsers(res.users);
    } catch (_) {
      dispatch(addToast({ type: 'error', message: 'Credit adjustment failed' }));
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await adminApi.updateUserStatus(user.id, {
        status: newStatus,
        reason: 'Admin toggle action',
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
      );
      dispatch(addToast({ type: 'info', message: `User status changed to ${newStatus}` }));
    } catch (_) {
      dispatch(addToast({ type: 'error', message: 'Failed to update user status' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <span>Administrator Control Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global governance: AI model metrics, user credit management, job queue telemetry, and moderation logs.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Users & Credits', icon: Users },
            { id: 'jobs', label: 'Queue Monitor', icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
              <div className="text-3xl font-extrabold text-white mt-2">
                {analytics?.overview?.totalUsers ?? 1}
              </div>
              <div className="text-xs text-purple-400 mt-1">Active Accounts</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Generations</span>
              <div className="text-3xl font-extrabold text-white mt-2">
                {analytics?.overview?.totalGenerations ?? 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {analytics?.overview?.totalImages ?? 0} Images • {analytics?.overview?.totalVideos ?? 0} Videos
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Credits Consumed</span>
              <div className="text-3xl font-extrabold text-white mt-2">
                {analytics?.overview?.totalCreditsConsumed ?? 0}
              </div>
              <div className="text-xs text-amber-400 mt-1">Burn rate on AI APIs</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Success Rate</span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-2">
                {analytics?.overview?.successRate ?? '100.0%'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {analytics?.overview?.failedJobs ?? 0} Failed jobs recorded
              </div>
            </div>
          </div>

          {/* Model Registry Status */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Active Qwen & WanX Model Adapters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Qwen 2.5 Image Turbo', id: 'qwen-2.5-image-turbo', cost: '1 Credit', status: 'Online' },
                { name: 'Qwen 2.5 Max Image Ultra', id: 'qwen-2.5-max-image', cost: '2 Credits', status: 'Online' },
                { name: 'Alibaba WanX 2.1 Plus', id: 'wanx-2.1-t2i-plus', cost: '2 Credits', status: 'Online' },
                { name: 'Qwen 2.5 VL Ultra', id: 'qwen-2.5-vl-ultra', cost: '1 Credit', status: 'Online' },
                { name: 'Qwen Wan 2.1 Video Turbo', id: 'qwen-wan2.1-video-turbo', cost: '10-25 Credits', status: 'Online' },
                { name: 'Qwen Wan 2.1 Video Plus', id: 'qwen-wan2.1-video-plus', cost: '20-35 Credits', status: 'Online' },
              ].map((m) => (
                <div key={m.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{m.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                      {m.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{m.id}</div>
                  <div className="text-xs text-purple-400 font-medium pt-1">Cost: {m.cost}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Registered Users & Credit Adjustments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Generations</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-slate-500 text-[11px]">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-white">
                      {u.wallet?.balance ?? 0}
                    </td>
                    <td className="p-3 text-slate-400">
                      {u._count?.media ?? 0} created
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-[11px] font-semibold transition-all"
                        >
                          Adjust Credits
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Generation Jobs Telemetry</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-purple-400 text-[11px]">{j.id.slice(0, 8)}...</td>
                    <td className="p-3">{j.user?.email || 'User'}</td>
                    <td className="p-3 font-medium text-slate-300">{j.type}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{j.modelId}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          j.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : j.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="p-3">{j.creditCost} credits</td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {new Date(j.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Credits Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">
              Adjust Credits for {selectedUser.name}
            </h3>
            <p className="text-xs text-slate-400">Current balance: {selectedUser.wallet?.balance} credits</p>

            <form onSubmit={handleAdjustCredits} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Credit Amount (Positive to Grant, Negative to Deduct)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 font-semibold text-xs text-white"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
