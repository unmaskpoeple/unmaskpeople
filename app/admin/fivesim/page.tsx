"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Zap,
  TrendingUp,
  DollarSign,
  Radio,
  Sliders,
  RotateCw,
  Save,
  Check,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Lock,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";

export default function AdminCarrierPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Form states
  const [markupPercent, setMarkupPercent] = useState<number>(40);
  const [minPriceUsd, setMinPriceUsd] = useState<number>(0.15);
  const [exchangeRateInr, setExchangeRateInr] = useState<number>(86.5);
  const [saving, setSaving] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/carrier");
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.pricing) {
          setMarkupPercent(json.pricing.markupPercent);
          setMinPriceUsd(json.pricing.minPriceUsd);
          setExchangeRateInr(json.pricing.exchangeRateInr);
        }
      } else {
        toast({
          title: "Admin Access Denied",
          description: json.error || "You do not have permission to view this page.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      console.error("Error loading admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markupPercent: Number(markupPercent),
          minPriceUsd: Number(minPriceUsd),
          exchangeRateInr: Number(exchangeRateInr),
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        toast({
          title: "Pricing Settings Saved",
          description: "Profit markup and currency conversions updated globally.",
          variant: "success",
        });
      } else {
        toast({
          title: "Failed to Save",
          description: resData.error,
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Panel</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Shield className="w-7 h-7 text-cyan-400" />
              <span>Carrier & Pricing Control Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Live carrier balance telemetry, profit markup rules, and automated fulfillment monitoring.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync Live Status</span>
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Connecting to Carrier Gateway...</p>
          </div>
        ) : !data ? (
          <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 p-8 space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Administrator Access Required</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You must be logged in as an administrator to manage carrier gateway connections.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. CARRIER GATEWAY TELEMETRY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Carrier Account Balance */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-cyan-500/40 shadow-lg shadow-cyan-500/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Carrier Reserve Balance</span>
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="text-3xl font-black text-white">
                  ${data.profile?.balance?.toFixed(2) ?? "0.00"} USD
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  ● Gateway Link Active
                </div>
              </div>

              {/* Carrier Reliability Rating */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Carrier Reliability</span>
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-black text-cyan-400">
                  {data.profile?.rating ?? 100}%
                </div>
                <div className="text-[11px] text-slate-400">
                  Carrier Node Ref: #{data.profile?.id || "Active"}
                </div>
              </div>

              {/* System Total Orders */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total System Orders</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-black text-white">
                  {data.stats?.totalOrders ?? 0}
                </div>
                <div className="text-[11px] text-slate-400">
                  Completed: <strong className="text-emerald-400">{data.stats?.completedOrders ?? 0}</strong> • Active: {data.stats?.pendingOrders ?? 0}
                </div>
              </div>

              {/* Total Revenue */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Customer Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-emerald-400">
                  ₹{Number(data.stats?.revenueInr ?? 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Wholesale Cost: ${Number(data.stats?.costCarrierUsd ?? 0).toFixed(2)} USD
                </div>
              </div>
            </div>

            {/* 2. PROFIT MARKUP & PRICING RULES FORM */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    <span>Profit Markup & Exchange Rates</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Control your profit margin on every OTP sold. Prices automatically adjust across the store in real time.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSavePricing} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Markup Percentage */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    Profit Markup Percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="5"
                      min="0"
                      max="500"
                      value={markupPercent}
                      onChange={(e) => setMarkupPercent(Number(e.target.value))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    E.g. 40% markup means a $0.20 base cost will sell for $0.28.
                  </p>
                </div>

                {/* Minimum Price Floor */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    Minimum Price Floor ($ USD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={minPriceUsd}
                      onChange={(e) => setMinPriceUsd(Number(e.target.value))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      USD
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Guarantees minimum charge even for $0.01 micro-services.
                  </p>
                </div>

                {/* Exchange Rate USD to INR */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    USD to INR Exchange Rate
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="50"
                      value={exchangeRateInr}
                      onChange={(e) => setExchangeRateInr(Number(e.target.value))}
                      className="w-full bg-[#030712] border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₹ / $
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Current benchmark: ₹86.5 per $1 USD.
                  </p>
                </div>

                <div className="sm:col-span-3 pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? "Saving..." : "Save Pricing Rules"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
