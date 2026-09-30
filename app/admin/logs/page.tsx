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
} from "lucide-react";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedLog, setSelectedLog] = useState<any>(null);

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

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Live Operational API Traffic Logs"
        subtitle="End-to-end request logging, HTTP telemetry, provider latencies, and sanitized responses"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status Filter:
            </span>
            {["ALL", "SUCCESSFUL", "FAILED", "REFUNDED"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Total Requests: <strong>{totalCount}</strong></span>
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
                  <th className="py-3.5 px-4">Request ID</th>
                  <th className="py-3.5 px-4">Target (Masked)</th>
                  <th className="py-3.5 px-4">Caller Account</th>
                  <th className="py-3.5 px-4">API Engine</th>
                  <th className="py-3.5 px-4">HTTP Status</th>
                  <th className="py-3.5 px-4">Latency</th>
                  <th className="py-3.5 px-4">Result</th>
                  <th className="py-3.5 px-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {log.id.slice(0, 10)}...
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {log.maskedPhone}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {log.user?.name || "Subscriber"}
                        <span className="block text-[10px] text-slate-500 truncate max-w-[140px] font-mono">
                          {log.user?.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {log.apiConfig?.name || "Global Telecom"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span
                          className={
                            log.httpStatus === 200
                              ? "text-emerald-400"
                              : log.httpStatus >= 500
                              ? "text-rose-400"
                              : "text-amber-400"
                          }
                        >
                          {log.httpStatus || "-"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {log.latencyMs ? `${log.latencyMs}ms` : "-"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === "SUCCESSFUL"
                              ? "bg-emerald-950 text-emerald-400"
                              : log.status === "REFUNDED"
                              ? "bg-amber-950 text-amber-400"
                              : "bg-rose-950 text-rose-400"
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
                          <span>Payload</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                      {loading ? "Loading operational logs..." : "No logs found matching this filter."}
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
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-4 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Operational Request Payload</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap">
                {selectedLog.rawResponse
                  ? typeof selectedLog.rawResponse === "string"
                    ? JSON.stringify(JSON.parse(selectedLog.rawResponse), null, 2)
                    : JSON.stringify(selectedLog.rawResponse, null, 2)
                  : "No raw payload stored."}
              </pre>
            </div>

            <div className="flex justify-end">
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
