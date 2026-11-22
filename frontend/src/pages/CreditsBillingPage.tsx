import React, { useState, useEffect } from 'react';
import { creditsApi, UserCreditsResponse } from '../api/credits.api';
import { useDispatch } from 'react-redux';
import { updateBalance } from '../store/slices/authSlice';
import { addToast } from '../store/slices/uiSlice';
import {
  CreditCard,
  Zap,
  Crown,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';

export const CreditsBillingPage: React.FC = () => {
  const dispatch = useDispatch();

  const [data, setData] = useState<UserCreditsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const fetchCredits = () => {
    creditsApi
      .getUserCredits()
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handlePurchasePackage = async (packageId: 'starter' | 'creator' | 'pro') => {
    setPurchasing(true);
    try {
      const res = await creditsApi.purchasePackage({ packageId });
      dispatch(updateBalance(res.newBalance));
      dispatch(
        addToast({
          type: 'success',
          title: 'Purchase Successful!',
          message: `Added ${res.creditsAdded} credits to your account.`,
        }),
      );
      fetchCredits();
    } catch (_) {
      dispatch(addToast({ type: 'error', message: 'Purchase failed. Please try again.' }));
    } finally {
      setPurchasing(false);
    }
  };

  const handleUpgradeSubscription = async (planTier: 'STARTER' | 'CREATOR' | 'PRO_STUDIO') => {
    setPurchasing(true);
    try {
      const res = await creditsApi.upgradeSubscription({ planTier });
      dispatch(addToast({ type: 'success', title: 'Subscribed!', message: res.message }));
      fetchCredits();
    } catch (_) {
      dispatch(addToast({ type: 'error', message: 'Subscription upgrade failed.' }));
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-purple-400" />
          <span>Credits & Billing</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your creative budget, purchase instant credit packages, or upgrade your monthly subscription tier.
        </p>
      </div>

      {/* Credit Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/40 via-slate-900 to-indigo-900/40 border border-purple-500/30 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Available Balance</span>
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-4xl font-extrabold text-white">
            {data?.balance ?? 50}
          </div>
          <div className="mt-3 text-xs text-slate-400">
            {Math.floor((data?.balance ?? 50) / 1)} Images or ~{Math.floor((data?.balance ?? 50) / 10)} Videos
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Lifetime Spent</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-4xl font-extrabold text-white">
            {data?.lifetimeSpent ?? 0}
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Across {data?.stats?.totalGenerations ?? 0} total generations
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Current Subscription</span>
            <Crown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {data?.subscription?.planTier ?? 'FREE'}
          </div>
          <div className="mt-3 text-xs text-emerald-400 font-medium">
            {data?.subscription?.monthlyCredits ?? 50} Monthly credits allowance
          </div>
        </div>
      </div>

      {/* Credit Packs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">One-Time Credit Packages</h2>
          <p className="text-xs text-slate-400">Refill your balance immediately without a recurring commitment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 flex flex-col justify-between transition-all">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter Pack</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">$10</span>
                <span className="text-xs text-slate-400">/ one-time</span>
              </div>
              <div className="text-base font-bold text-purple-300">200 Credits</div>
              <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Up to 200 Nano Banana images</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Up to 20 Omni Flash HD videos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Credits never expire</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handlePurchasePackage('starter')}
              disabled={purchasing}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
            >
              Buy 200 Credits
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900 border-2 border-purple-500 shadow-xl flex flex-col justify-between relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-purple-600 text-[10px] font-bold text-white uppercase tracking-wider">
              Most Popular
            </div>
            <div className="space-y-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Creator Pack</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">$25</span>
                <span className="text-xs text-slate-400">/ one-time</span>
              </div>
              <div className="text-base font-bold text-purple-300">600 Credits</div>
              <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Up to 600 Nano Banana images</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Up to 60 Omni Flash HD videos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>4K video resolution generation</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handlePurchasePackage('creator')}
              disabled={purchasing}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all"
            >
              Buy 600 Credits
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 flex flex-col justify-between transition-all">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Studio Pro Pack</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">$50</span>
                <span className="text-xs text-slate-400">/ one-time</span>
              </div>
              <div className="text-base font-bold text-purple-300">1,500 Credits</div>
              <ul className="text-xs text-slate-400 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>1,500 High-Fidelity Generations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Veo 2.0 & Omni Flash 4K access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Maximum concurrency & queue priority</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handlePurchasePackage('pro')}
              disabled={purchasing}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
            >
              Buy 1,500 Credits
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">Monthly Memberships</h2>
          <p className="text-xs text-slate-400">Unlock recurring monthly credit grants with deep discounts</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Starter Plan</span>
            <div className="text-3xl font-extrabold text-white">$15 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
            <p className="text-xs text-purple-300 font-medium">300 Credits renewed monthly</p>
            <button
              onClick={() => handleUpgradeSubscription('STARTER')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
            >
              Select Starter
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-purple-500/50 space-y-4">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Creator Plan</span>
            <div className="text-3xl font-extrabold text-white">$39 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
            <p className="text-xs text-purple-300 font-medium">1,000 Credits renewed monthly</p>
            <button
              onClick={() => handleUpgradeSubscription('CREATOR')}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white"
            >
              Select Creator
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pro Studio Plan</span>
            <div className="text-3xl font-extrabold text-white">$99 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
            <p className="text-xs text-purple-300 font-medium">3,000 Credits renewed monthly</p>
            <button
              onClick={() => handleUpgradeSubscription('PRO_STUDIO')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
            >
              Select Pro Studio
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
        <h3 className="text-base font-bold text-white">Recent Transactions</h3>
        {data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {data.recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{tx.description}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{new Date(tx.createdAt).toLocaleString()}</div>
                </div>
                <div className={`font-mono font-bold text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} credits
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 py-4 text-center">No transactions recorded yet</div>
        )}
      </div>
    </div>
  );
};
