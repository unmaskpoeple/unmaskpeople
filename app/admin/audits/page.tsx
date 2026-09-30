"use client";

import React, { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import {
  FileCheck2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Lock,
} from "lucide-react";

export default function AdminAuditsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAudits = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audits?page=${p}&limit=15`);
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
    fetchAudits(page);
  }, [page]);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Security & System Audit Trail"
        subtitle="Immutable chronicle of administrative adjustments, API modifications, and authentication events"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white text-sm">
              Compliance & Security Log
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Total Recorded Audits: <strong>{totalCount}</strong></span>
            <button
              onClick={() => fetchAudits()}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Administrator</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target Type</th>
                  <th className="py-3.5 px-4">Details / Metadata</th>
                  <th className="py-3.5 px-4 font-mono text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {logs.length > 0 ? (
                  logs.map((log) => {
                    let parsedMeta: any = null;
                    try {
                      if (log.metadata) parsedMeta = JSON.parse(log.metadata);
                    } catch {}

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3.5 px-4 text-white font-semibold">
                          {log.admin?.name || "System"}
                          <span className="block text-[10px] text-slate-500 font-mono">
                            {log.admin?.email}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-violet-950 text-violet-400 border border-violet-800/40">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 8)}...)` : ""}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] max-w-sm truncate">
                          {parsedMeta ? JSON.stringify(parsedMeta) : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                          {log.ipAddress}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      {loading ? "Loading audit logs..." : "No audit entries recorded yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950">
              <span>Page {page} of {totalPages}</span>
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
    </div>
  );
}
