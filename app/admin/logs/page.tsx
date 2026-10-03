"use client";

import React, { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import {
  Activity,
  Filter,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  ShieldAlert,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = async (p = page, st = statusFilter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?page=${p}&limit=15&status=${st}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, statusFilter);
  }, [page, statusFilter]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Live OTP Orders & SMS Traffic Logs"
        subtitle="End-to-end carrier order fulfillment, received verification codes, subscriber charges, and compliance IP telemetry"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Order Filter:
            </span>
            {["ALL", "RECEIVED", "PENDING", "REFUNDED"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Total OTP Orders: <strong className="text-white">{totalCount}</strong></span>
            <button
              onClick={() => fetchLogs()}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Service & Country</th>
                  <th className="py-3.5 px-4">Virtual Number</th>
                  <th className="py-3.5 px-4">Subscriber</th>
                  <th className="py-3.5 px-4">Cost (₹)</th>
                  <th className="py-3.5 px-4">Received Code</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        #{log.orderId || log.id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{log.serviceName}</div>
                        <div className="text-[10px] text-slate-500 capitalize">
                          {log.countryName} ({log.operator})
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{log.phone}</span>
                          {log.phone && (
                            <button
                              onClick={() => handleCopy(log.phone, `phone_${log.id}`)}
                              className="text-slate-500 hover:text-cyan-400"
                              title="Copy"
                            >
                              {copiedId === `phone_${log.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {log.user?.name || "Subscriber"}
                        <span className="block text-[10px] text-slate-500 truncate max-w-[140px] font-mono">
                          {log.user?.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                        ₹{Number(log.cost || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        {log.smsCode ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40">
                            <span className="font-mono font-black text-emerald-400 text-xs">
                              {log.smsCode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Waiting...</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === "RECEIVED" || log.status === "FINISHED"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                              : log.status === "PENDING"
                              ? "bg-amber-950 text-amber-400 border border-amber-800/50"
                              : "bg-rose-950 text-rose-400 border border-rose-800/50"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      {loading ? "Loading operational OTP logs..." : "No orders found matching this filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 disabled:opacity-40 hover:bg-slate-800 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 disabled:opacity-40 hover:bg-slate-800 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>OTP Order Telemetry</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedLog.id} (Gateway #{selectedLog.orderId})</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold block">Phone Allocated</span>
                <span className="text-white font-mono font-bold">{selectedLog.phone}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold block">Service & Country</span>
                <span className="text-white font-bold">{selectedLog.serviceName} ({selectedLog.countryName})</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold block">Retail Charge (INR)</span>
                <span className="text-emerald-400 font-mono font-bold">₹{Number(selectedLog.cost || 0).toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold block">Wholesale Cost (USD)</span>
                <span className="text-cyan-400 font-mono font-bold">${Number(selectedLog.costFiveSim || 0).toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold block">Subscriber</span>
                <span className="text-white font-medium">{selectedLog.user?.email || "Unknown"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold block">Client IP (AUP Log)</span>
                <span className="text-slate-300 font-mono">{selectedLog.ipAddress || "127.0.0.1"}</span>
              </div>
            </div>

            {selectedLog.smsText ? (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400">Raw Incoming SMS Message</span>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono">
                  {selectedLog.smsText}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
