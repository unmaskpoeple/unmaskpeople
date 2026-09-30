"use client";

import React, { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { useToast } from "@/components/ui/toast";
import {
  BadgeDollarSign,
  Shield,
  Gauge,
  RotateCcw,
  Sparkles,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function AdminPricingPage() {
  const { toast } = useToast();

  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [defaultCost, setDefaultCost] = useState("3.50");
  const [minBalance, setMinBalance] = useState("0.00");
  const [refundOnFailure, setRefundOnFailure] = useState(true);
  const [maxPerMinute, setMaxPerMinute] = useState("20");
  const [maxPerDay, setMaxPerDay] = useState("500");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const s = data.settings;
        setSettings(s);
        setDefaultCost(String(s.default_cost_per_request ?? 3.5));
        setMinBalance(String(s.min_wallet_balance ?? 0.0));
        setRefundOnFailure(s.refund_on_failure ?? true);
        setMaxPerMinute(String(s.max_requests_per_minute ?? 20));
        setMaxPerDay(String(s.max_requests_per_day ?? 500));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_cost_per_request: Number(defaultCost),
          min_wallet_balance: Number(minBalance),
          refund_on_failure: refundOnFailure,
          max_requests_per_minute: Number(maxPerMinute),
          max_requests_per_day: Number(maxPerDay),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update pricing");

      toast.success("Pricing Updated", data.message);
      fetchSettings();
    } catch (err: any) {
      toast.error("Save Failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Pricing Policy & Request Limits"
        subtitle="Configure backend rate limits, cost per lookup, minimum liquidity, and automated refund protocols"
      />

      <main className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Billing Rules */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
                <span>Monetization & Default Query Fees</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Prices are strictly enforced server-side and deducted atomically from subscriber wallets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Default Query Fee (₹ INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={defaultCost}
                  onChange={(e) => setDefaultCost(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono font-bold focus:ring-2 focus:ring-violet-500 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Used if an API engine does not specify an override fee.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Minimum Wallet Balance Required (₹ INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={minBalance}
                  onChange={(e) => setMinBalance(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono font-bold focus:ring-2 focus:ring-violet-500 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Subscribers must maintain at least this balance to query.
                </span>
              </div>
            </div>

            {/* Refund Policy Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Automatic Refund on Provider Lookup Failure</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  When enabled, if a provider returns an error, disconnected status, or timeout, the lookup fee is immediately refunded to the user's wallet.
                </p>
              </div>

              <input
                type="checkbox"
                checked={refundOnFailure}
                onChange={(e) => setRefundOnFailure(e.target.checked)}
                className="w-5 h-5 rounded accent-violet-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Card 2: Abuse Prevention & Rate Limits */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-400" />
                <span>Rate Limiting & Anti-Abuse Controls</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enforces maximum throughput per subscriber to prevent scraping and denial-of-service.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Maximum Requests Per Minute
                </label>
                <input
                  type="number"
                  value={maxPerMinute}
                  onChange={(e) => setMaxPerMinute(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono font-bold focus:ring-2 focus:ring-violet-500 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Sliding 60-second window per user.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Maximum Requests Per Day
                </label>
                <input
                  type="number"
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono font-bold focus:ring-2 focus:ring-violet-500 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Resets daily at UTC midnight.
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Pricing & Policies</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
