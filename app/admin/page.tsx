"use client";

import React, { useEffect, useState } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import {
  Users,
  Wallet,
  Activity,
  BadgeDollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
  Cpu,
  Layers,
  AlertTriangle,
  ArrowRight,
  QrCode,
  FileCheck2,
  Settings,
  LogIn,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import Link from "next/link";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/overview", {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        setErrorMsg(json.error || `HTTP ${res.status}: Failed to load administrative overview`);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Network error loading administrative overview. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = data?.stats;

  const formatCurrency = (val: any) => {
    const n = Number(val);
    return isNaN(n) ? "0.00" : n.toFixed(2);
  };

  const formatTime = (dateStr: any) => {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "Just now" : d.toLocaleTimeString();
    } catch {
      return "Just now";
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Administrative Command Center"
        subtitle="Global telemetry, aggregate subscriber liquidity, revenue analytics, and system health"
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Error Notification Banner if Overview Fetch Failed */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-200 shadow-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm text-white">Administrative Telemetry Alert</p>
                <p className="text-rose-300">{errorMsg}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={fetchOverview}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-700/50 text-white font-semibold transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              {errorMsg.toLowerCase().includes("auth") || errorMsg.toLowerCase().includes("forbidden") ? (
                <Link
                  href="/admin/login"
                  className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-violet-600/30"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Admin Login</span>
                </Link>
              ) : null}
            </div>
          </div>
        )}

        {/* Quick Navigation Action Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          <Link
            href="/admin/gateway"
            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-200 block truncate">UPI Deposits</span>
              <span className="text-[10px] text-slate-400">Verify UTRs</span>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-200 block truncate">Subscribers</span>
              <span className="text-[10px] text-slate-400">Adjust balances</span>
            </div>
          </Link>

          <Link
            href="/admin/logs"
            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-200 block truncate">Traffic Logs</span>
              <span className="text-[10px] text-slate-400">Live Lookups</span>
            </div>
          </Link>

          <Link
            href="/admin/apis"
            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-200 block truncate">API Providers</span>
              <span className="text-[10px] text-slate-400">Configure & test</span>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-900 transition-all flex items-center gap-2.5 group col-span-2 sm:col-span-4 lg:col-span-1"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Settings className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-200 block truncate">Platform Policy</span>
              <span className="text-[10px] text-slate-400">Pricing & maintenance</span>
            </div>
          </Link>
        </div>

        {/* Metric Cards Row 1: Users, Revenue & Liquidity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Revenue */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total API Revenue
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <BadgeDollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">
                ₹{formatCurrency(stats?.totalRevenue)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Earned from lookups</span>
              <span className="text-emerald-400 font-semibold">Active Ledger</span>
            </div>
          </div>

          {/* Total Deposits */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Deposits
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">
                ₹{formatCurrency(stats?.totalDeposits)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Recharge transactions</span>
              <span className="text-indigo-400 font-semibold">Verified webhook</span>
            </div>
          </div>

          {/* User Count */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Subscribers
              </span>
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">
                {stats?.totalUsers ?? (loading ? "..." : 0)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>{stats?.activeUsers ?? 0} Active</span>
              <span className="text-violet-400 font-semibold">Registered accounts</span>
            </div>
          </div>

          {/* Total Query Volume */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total API Requests
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-white">
                {stats?.totalRequests ?? (loading ? "..." : 0)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span className="text-emerald-400 font-bold">{stats?.successRate ?? 100}% Success</span>
              <span>{stats?.failedRequests ?? 0} Fail/Refund</span>
            </div>
          </div>
        </div>

        {/* Charts Section: Requests & Revenue Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Requests & Success Rate */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base">API Request Volume (7 Days)</h3>
                <p className="text-xs text-slate-400">Comparison of total vs successful telephone lookups</p>
              </div>
              <button
                onClick={fetchOverview}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="h-64 w-full">
              {isMounted && data?.chartData && data.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminReqGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="adminSuccessGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#334155",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Area
                      type="monotone"
                      name="Total Queries"
                      dataKey="requests"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#adminReqGradient)"
                    />
                    <Area
                      type="monotone"
                      name="Successful"
                      dataKey="successful"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#adminSuccessGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  {loading ? "Loading telemetry trends..." : "No search trend data available yet."}
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Revenue & Deposits Trends */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Financial Liquidity & Revenue (₹)</h3>
                <p className="text-xs text-slate-400">Total deposits vs daily revenue charges</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
                ₹{formatCurrency(stats?.totalWalletBalance)} in circulation
              </span>
            </div>

            <div className="h-64 w-full">
              {isMounted && data?.chartData && data.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#334155",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar name="Deposits (₹)" dataKey="deposits" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar name="Revenue (₹)" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  {loading ? "Loading financial trends..." : "No financial ledger data available yet."}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operational Feeds: Live API Logs & Security Audits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent API Requests */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Latest Operational API Traffic</h3>
              <Link
                href="/admin/logs"
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
              >
                <span>View all logs</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {data?.recentRequests && data.recentRequests.length > 0 ? (
                data.recentRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">
                          {req.maskedPhone}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            req.status === "SUCCESSFUL"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        By {req.user?.name || "Subscriber"} • {req.apiConfig?.name || "Core Telecom API"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-white">
                        {req.isRefunded ? "₹0.00" : `₹${formatCurrency(req.amountCharged)}`}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {req.latencyMs ? `${req.latencyMs}ms` : "-"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {loading ? "Loading operational requests..." : "No requests logged yet."}
                </div>
              )}
            </div>
          </div>

          {/* Recent Security Audits */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Administrative Audit Trail</h3>
              <Link
                href="/admin/audits"
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
              >
                <span>View complete audits</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {data?.recentAudits && data.recentAudits.length > 0 ? (
                data.recentAudits.map((aud: any) => (
                  <div
                    key={aud.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-violet-400">
                        {aud.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatTime(aud.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Operator: <strong className="text-slate-300">{aud.admin?.name || "System"}</strong> • Target: {aud.targetType} ({aud.targetId || "Global"})
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {loading ? "Loading audit trail..." : "No audit logs recorded yet."}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
