"use client";

import React, { useState } from "react";
import { Check, Copy, ChevronDown, ChevronRight, Terminal, Layers, ShieldCheck, Clock, Zap } from "lucide-react";
import { useToast } from "./ui/toast";

interface ResponseViewerProps {
  status: "SUCCESSFUL" | "FAILED" | "REFUNDED" | "PROCESSING" | "PENDING";
  phone: string;
  apiUsed?: string;
  latencyMs?: number;
  amountCharged?: number;
  isRefunded?: boolean;
  message?: string;
  data?: Record<string, any>;
  raw?: any;
}

export function ResponseViewer({
  status,
  phone,
  apiUsed,
  latencyMs,
  amountCharged,
  isRefunded,
  message,
  data = {},
  raw,
}: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "json">("summary");
  const [copied, setCopied] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleCopy = () => {
    const jsonStr = JSON.stringify(raw || data, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    toast.success("Copied to clipboard", "API response payload copied successfully.");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleNode = (nodeKey: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const isSuccess = status === "SUCCESSFUL";
  const isFailed = status === "FAILED" || status === "REFUNDED";

  // Render collapsible JSON tree
  const renderJsonTree = (obj: any, path = "root"): React.ReactNode => {
    if (obj === null) return <span className="text-slate-400">null</span>;
    if (typeof obj === "boolean") return <span className="text-amber-400">{obj.toString()}</span>;
    if (typeof obj === "number") return <span className="text-emerald-400">{obj}</span>;
    if (typeof obj === "string") return <span className="text-sky-300">"{obj}"</span>;

    const isArray = Array.isArray(obj);
    const keys = Object.keys(obj);
    const isCollapsed = collapsedNodes[path];

    if (keys.length === 0) return <span>{isArray ? "[]" : "{}"}</span>;

    return (
      <div className="font-mono text-xs">
        <span
          onClick={() => toggleNode(path)}
          className="inline-flex items-center gap-1 cursor-pointer hover:bg-slate-800/60 px-1 py-0.5 rounded text-slate-400 hover:text-slate-200 select-none"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span className="text-slate-500">{isArray ? `Array(${keys.length})` : "Object"}</span>
        </span>

        {!isCollapsed && (
          <div className="pl-4 border-l border-slate-700/60 my-1 space-y-1">
            {keys.map((key) => {
              const currentPath = `${path}.${key}`;
              const value = obj[key];
              return (
                <div key={key} className="leading-relaxed">
                  <span className="text-indigo-300 mr-1.5 font-medium">{key}:</span>
                  {renderJsonTree(value, currentPath)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xl overflow-hidden backdrop-blur-xl transition-all">
      {/* Top Header Card */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isSuccess ? "bg-emerald-500 shadow-glow animate-pulse" : isFailed ? "bg-rose-500" : "bg-amber-500"
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                Status: {status}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  isSuccess
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : isFailed
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                {isRefunded ? "REFUNDED TO WALLET" : isSuccess ? "RESOLVED" : "LOOKUP FAILED"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Target: <span className="text-slate-800 dark:text-slate-200 font-semibold">{phone}</span>
              {apiUsed && <span className="ml-2 text-slate-400">• API: {apiUsed}</span>}
            </p>
          </div>
        </div>

        {/* Quick telemetry badges */}
        <div className="flex items-center gap-3">
          {latencyMs !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{latencyMs}ms</span>
            </div>
          )}

          {amountCharged !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isRefunded ? "₹0.00 (Refunded)" : `₹${amountCharged.toFixed(2)}`}
              </span>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy JSON"}</span>
          </button>
        </div>
      </div>

      {/* Message alert if present */}
      {message && (
        <div
          className={`px-5 py-2.5 text-xs border-b ${
            isSuccess
              ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/5 border-rose-500/15 text-rose-700 dark:text-rose-300"
          }`}
        >
          <span className="font-semibold mr-1.5">{isSuccess ? "Notice:" : "Error:"}</span>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 bg-slate-100/50 dark:bg-slate-900/50">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "summary"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Extracted Insights & Fields</span>
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "json"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Complete Raw JSON Response</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-5">
        {activeTab === "summary" ? (
          <div>
            {Object.keys(data).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {Object.entries(data).map(([k, v]) => (
                  <div
                    key={k}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/30 transition-all"
                  >
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {k}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 break-words">
                      {typeof v === "boolean" ? (v ? "True / Yes" : "False / No") : String(v)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No structured fields were extracted from this response. Check the Raw JSON tab for full details.
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto text-slate-200">
            {renderJsonTree(raw || data)}
          </div>
        )}
      </div>

      {/* Privacy & Security Note */}
      <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>End-to-end sanitized response. API credentials encrypted on server.</span>
        </span>
        <span>ID: {phone.slice(0, 4)}••••</span>
      </div>
    </div>
  );
}
