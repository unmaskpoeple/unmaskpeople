"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCw,
  Search,
  Filter,
  ArrowLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { ActiveOtpCard, ActiveOtpOrder } from "@/components/active-otp-card";

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState<ActiveOtpOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/otp/orders?status=${filterStatus}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, filterStatus]);

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
      variant: "success",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.phone.toLowerCase().includes(q) ||
      o.serviceName.toLowerCase().includes(q) ||
      o.countryName.toLowerCase().includes(q) ||
      (o.smsCode && o.smsCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My OTP Orders
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Real-time activation history, received verification codes, and refund status.
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "all", label: "All Orders" },
              { id: "active", label: "Active Pending" },
              { id: "received", label: "Received Codes" },
              { id: "canceled", label: "Refunded / Expired" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === tab.id
                    ? "bg-slate-800 text-cyan-400 border border-cyan-500/40"
                    : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by phone, service, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Orders List */}
        {!user ? (
          <div className="text-center py-20 rounded-3xl bg-slate-900/40 border border-slate-800 p-8 space-y-4">
            <h3 className="text-base font-bold text-white">Sign In to View Orders</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You must be logged in to view your active numbers and historical SMS codes.
            </p>
            <Link
              href="/login?redirect=/orders"
              className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-md shadow-cyan-500/20"
            >
              Sign In Now
            </Link>
          </div>
        ) : loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading your activation orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-slate-900/40 border border-slate-800 p-8 space-y-3">
            <Clock className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Orders Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't purchased any virtual numbers in this category yet.
            </p>
            <Link
              href="/"
              className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold shadow-md shadow-cyan-500/20"
            >
              Get Your First Number
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* If any are PENDING, display full active card */}
            {filteredOrders
              .filter((o) => o.status === "PENDING")
              .map((ord) => (
                <ActiveOtpCard
                  key={ord.id}
                  order={ord}
                  onOrderUpdated={(upd) => {
                    setOrders((prev) =>
                      prev.map((item) => (item.id === upd.id ? upd : item))
                    );
                  }}
                  onOrderDismiss={(id) => {
                    setOrders((prev) =>
                      prev.filter((o) => o.id !== id && String(o.fiveSimId) !== String(id))
                    );
                  }}
                />
              ))}

            {/* Non-pending orders list in clean table view */}
            <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#030712] border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Service & Country</th>
                      <th className="py-3.5 px-4 font-bold">Phone Number</th>
                      <th className="py-3.5 px-4 font-bold">Received Code</th>
                      <th className="py-3.5 px-4 font-bold">Cost</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrders
                      .filter((o) => o.status !== "PENDING")
                      .map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-4 px-4">
                            <div className="font-bold text-white">{ord.serviceName}</div>
                            <div className="text-[11px] text-slate-400 capitalize">
                              {ord.countryName} ({ord.operator})
                            </div>
                          </td>

                          <td className="py-4 px-4 font-mono font-medium text-slate-200">
                            <div className="flex items-center gap-2">
                              <span>{ord.phone}</span>
                              <button
                                onClick={() => handleCopy(ord.phone, `phone_${ord.id}`, "Phone Number")}
                                className="text-slate-500 hover:text-cyan-400"
                                title="Copy Number"
                              >
                                {copiedId === `phone_${ord.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {ord.smsCode ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/50">
                                <span className="font-mono font-black text-emerald-400 text-sm tracking-wider">
                                  {ord.smsCode}
                                </span>
                                <button
                                  onClick={() => handleCopy(ord.smsCode!, `code_${ord.id}`, "Code")}
                                  className="text-emerald-400 hover:text-emerald-300"
                                  title="Copy Code"
                                >
                                  {copiedId === `code_${ord.id}` ? (
                                    <Check className="w-3.5 h-3.5" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          <td className="py-4 px-4 font-bold text-cyan-400">
                            ₹{ord.cost.toFixed(2)}
                          </td>

                          <td className="py-4 px-4">
                            {ord.status === "RECEIVED" || ord.status === "FINISHED" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Delivered</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800">
                                <AlertCircle className="w-3 h-3" />
                                <span>Refunded</span>
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-[11px] text-slate-400">
                            {new Date(ord.createdAt).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
