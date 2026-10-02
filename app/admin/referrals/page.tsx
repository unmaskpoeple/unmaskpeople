"use client";

import React, { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { useToast } from "@/components/ui/toast";
import {
  Share2,
  Users,
  Gift,
  CheckCircle2,
  Clock,
  Save,
  Loader2,
  RefreshCw,
  Search,
  Sliders,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function AdminReferralsPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [creditingId, setCreditingId] = useState<string | null>(null);

  // Form settings state
  const [welcomeBonus, setWelcomeBonus] = useState("15");
  const [referralBonus, setReferralBonus] = useState("9");
  const [requiredSearches, setRequiredSearches] = useState("2");
  const [referralEnabled, setReferralEnabled] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/referrals");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.settings) {
          setWelcomeBonus(String(json.settings.welcome_bonus ?? 15));
          setReferralBonus(String(json.settings.referral_bonus ?? 9));
          setRequiredSearches(String(json.settings.referral_required_searches ?? 2));
          setReferralEnabled(json.settings.referral_enabled !== false);
        }
      }
    } catch (err: any) {
      toast.error("Failed to load", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcome_bonus: Number(welcomeBonus),
          referral_bonus: Number(referralBonus),
          referral_required_searches: Number(requiredSearches),
          referral_enabled: referralEnabled,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update settings");

      toast.success("Settings Saved", "Referral and welcome bonus settings updated successfully.");
      fetchReferrals();
    } catch (err: any) {
      toast.error("Save Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleManualCredit = async (referralId: string) => {
    setCreditingId(referralId);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to credit referral");

      toast.success("Bonus Credited", json.message);
      fetchReferrals();
    } catch (err: any) {
      toast.error("Credit Error", err.message);
    } finally {
      setCreditingId(null);
    }
  };

  const referralsList = data?.referrals || [];
  const filteredReferrals = referralsList.filter((r: any) => {
    const q = searchQuery.toLowerCase();
    return (
      r.referrerName?.toLowerCase().includes(q) ||
      r.referrerEmail?.toLowerCase().includes(q) ||
      r.referredUserName?.toLowerCase().includes(q) ||
      r.referredUserEmail?.toLowerCase().includes(q) ||
      r.referralCode?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Referral & Earn Management"
        subtitle="Configure welcome credits, referral bonuses, unlock criteria, and audit conversion ledgers"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Referrals
              </span>
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">
                {data?.stats?.totalReferrals ?? 0}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">New signups via invite links</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Bonuses Paid
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">
                ₹{Number(data?.stats?.totalBonusPaid ?? 0).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-emerald-400 mt-2 font-semibold">Credited to referrer wallets</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pending Searches
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">
                {data?.stats?.pendingCount ?? 0}
              </span>
            </div>
            <p className="text-xs text-amber-400 mt-2 font-medium">Awaiting 2 successful lookups</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Conversion Rate
              </span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">
                {data?.stats?.conversionRate ?? 0}%
              </span>
            </div>
            <p className="text-xs text-cyan-400 mt-2 font-medium">
              {data?.stats?.completedCount ?? 0} successfully rewarded
            </p>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-violet-950/80 border border-violet-800/60 text-violet-400 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Referral & Welcome Bonus Settings</h2>
                <p className="text-xs text-slate-400">
                  Configure signup reward amounts and unlock requirements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Program Active</span>
              <input
                type="checkbox"
                checked={referralEnabled}
                onChange={(e) => setReferralEnabled(e.target.checked)}
                className="w-5 h-5 rounded accent-violet-600 cursor-pointer"
              />
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider">
                New User Welcome Credit (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={welcomeBonus}
                  onChange={(e) => setWelcomeBonus(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono font-bold focus:border-violet-500 outline-none"
                  placeholder="15.00"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Credited to wallet immediately upon user signup (User requirement: ₹15)
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider">
                Referrer Reward (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={referralBonus}
                  onChange={(e) => setReferralBonus(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono font-bold focus:border-violet-500 outline-none"
                  placeholder="9.00"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Credited to referrer after friend completes required searches (User requirement: ₹9)
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider">
                Required Successful Searches
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={requiredSearches}
                onChange={(e) => setRequiredSearches(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono font-bold focus:border-violet-500 outline-none"
                placeholder="2"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Friend must complete 2 successful searches (failed searches excluded)
              </p>
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Referral Rules</span>
              </button>
            </div>
          </form>
        </div>

        {/* All Referrals Table */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base">Referral Tracking Ledger</h3>
              <p className="text-xs text-slate-400">
                Track each referred subscriber's successful search progress and payout status
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or code..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs outline-none focus:border-violet-500 w-60"
                />
              </div>

              <button
                onClick={fetchReferrals}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                title="Refresh table"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Referred Friend</th>
                  <th className="py-3 px-4 text-center">Search Progress</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Reward (₹)</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredReferrals.length > 0 ? (
                  filteredReferrals.map((ref: any) => {
                    const isCompleted = ref.status === "COMPLETED";
                    const progressPercent = Math.min(
                      100,
                      Math.round((ref.successfulSearchCount / (ref.requiredSearches || 2)) * 100)
                    );

                    return (
                      <tr key={ref.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-white">{ref.referrerName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{ref.referrerEmail}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-violet-400 bg-violet-950/50 border border-violet-800/40 px-2 py-0.5 rounded-md">
                            {ref.referralCode}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-white">{ref.referredUserName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{ref.referredUserEmail}</p>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono text-xs font-bold text-slate-200">
                              {ref.successfulSearchCount} / {ref.requiredSearches || 2} Lookups
                            </span>
                            <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full ${
                                  isCompleted ? "bg-emerald-500" : "bg-cyan-500"
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Rewarded</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2.5 py-1 rounded-full">
                              <Clock className="w-3 h-3" />
                              <span>Pending ({ref.requiredSearches - ref.successfulSearchCount} left)</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          ₹{Number(ref.rewardAmount ?? 9).toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!isCompleted ? (
                            <button
                              type="button"
                              disabled={creditingId === ref.id}
                              onClick={() => handleManualCredit(ref.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-colors disabled:opacity-50"
                            >
                              {creditingId === ref.id ? "Crediting..." : "Force Credit ₹9"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">Paid</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                      {searchQuery ? "No referrals match your search." : "No referrals recorded yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
