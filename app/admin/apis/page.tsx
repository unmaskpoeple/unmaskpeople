"use client";

import React, { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { useToast } from "@/components/ui/toast";
import {
  Cpu,
  Plus,
  Play,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Layers,
  KeyRound,
  RefreshCw,
  X,
  Loader2,
  AlertTriangle,
  Zap,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

export default function AdminApisPage() {
  const { toast } = useToast();

  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);


  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState("POST");
  const [authType, setAuthType] = useState("NONE");
  const [authKeyName, setAuthKeyName] = useState("");
  const [secret, setSecret] = useState("");
  const [headers, setHeaders] = useState("");
  const [requestTemplate, setRequestTemplate] = useState("");
  const [phoneParameter, setPhoneParameter] = useState("phone");
  const [cost, setCost] = useState("3.50");
  const [timeout, setTimeoutVal] = useState("10000");
  const [isActive, setIsActive] = useState(true);
  const [successField, setSuccessField] = useState("status");
  const [successValues, setSuccessValues] = useState("success,true,200,OK,valid");
  const [messageField, setMessageField] = useState("message");
  const [resultField, setResultField] = useState("data");

  // Test API Modal
  const [testModalApi, setTestModalApi] = useState<any>(null);
  const [testPhone, setTestPhone] = useState("+919876543210");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchApis = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/apis");
      if (res.ok) {
        const data = await res.json();
        setApis(data.apis || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const openCreateModal = () => {
    setEditingApi(null);
    setName("");
    setDescription("");
    setEndpoint("");
    setMethod("POST");
    setAuthType("NONE");
    setAuthKeyName("");
    setSecret("");
    setShowSecret(false);
    setHeaders("");
    setRequestTemplate(JSON.stringify({ phone: "{{phone}}", country: "{{countryCode}}" }, null, 2));
    setPhoneParameter("phone");
    setCost("3.50");
    setTimeoutVal("10000");
    setIsActive(true);
    setSuccessField("status");
    setSuccessValues("success,true,200,OK,valid");
    setMessageField("message");
    setResultField("data");
    setModalOpen(true);
  };

  const openEditModal = (api: any) => {
    setEditingApi(api);
    setName(api.name);
    setDescription(api.description || "");
    setEndpoint(api.endpoint);
    setMethod(api.method);
    setAuthType(api.authType);
    setAuthKeyName(api.authKeyName || "");
    setSecret(""); // Leave blank so existing secret is preserved without exposing it on screen
    setShowSecret(false);
    setHeaders(api.headers || "");
    setRequestTemplate(api.requestTemplate || "");
    setPhoneParameter(api.phoneParameter || "phone");
    setCost(String(api.cost));
    setTimeoutVal(String(api.timeout));
    setIsActive(api.isActive);
    setSuccessField(api.successField || "status");
    setSuccessValues(api.successValues || "success,true,200,OK,valid");
    setMessageField(api.messageField || "message");
    setResultField(api.resultField || "data");
    setModalOpen(true);
  };


  const handleSaveApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !endpoint) {
      toast.error("Validation Error", "Name and Endpoint URL are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        description,
        endpoint,
        method,
        authType,
        authKeyName,
        secret,
        headers,
        requestTemplate,
        phoneParameter,
        cost: Number(cost),
        timeout: Number(timeout),
        isActive,
        successField,
        successValues,
        messageField,
        resultField,
      };

      const url = editingApi ? `/api/admin/apis/${editingApi.id}` : "/api/admin/apis";
      const httpMethod = editingApi ? "PUT" : "POST";

      const res = await fetch(url, {
        method: httpMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save configuration");

      toast.success("API Saved", data.message);
      setModalOpen(false);
      fetchApis();
    } catch (err: any) {
      toast.error("Save Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApi = async (apiId: string) => {
    if (!confirm("Are you sure you want to delete this API configuration?")) return;
    try {
      const res = await fetch(`/api/admin/apis/${apiId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete configuration");
      toast.success("Deleted", "API configuration removed.");
      fetchApis();
    } catch (err: any) {
      toast.error("Delete Failed", err.message);
    }
  };

  const handleOpenTestModal = (api: any) => {
    setTestModalApi(api);
    setTestResult(null);
    setTestPhone("+919876543210");
  };

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalApi) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/apis/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testModalApi,
          testPhone,
        }),
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        toast.success("Test Passed", `Status: ${data.httpStatus} in ${data.latencyMs}ms`);
      } else {
        toast.warning("Test Flagged Error", data.message || "Failed response mapping check");
      }
      fetchApis(); // Updates health latency on screen
    } catch (err: any) {
      toast.error("Test Request Failed", err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Telecom Provider API Configuration"
        subtitle="Manage external carrier lookup, HLR, and fraud intelligence endpoints without changing application code"
      />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span>Configured External API Engines</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports Bearer tokens, custom headers, query params, template interpolation, and dynamic JSON schema mapping.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New API Engine</span>
          </button>
        </div>

        {/* API Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apis.map((api) => (
            <div
              key={api.id}
              className={`rounded-3xl bg-slate-900/90 border p-6 shadow-xl flex flex-col justify-between transition-all ${
                api.isActive ? "border-slate-800 hover:border-violet-500/50" : "border-slate-800/40 opacity-70"
              }`}
            >
              <div className="space-y-4">
                {/* Header with Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white tracking-tight">
                        {api.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          api.isActive
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {api.isActive ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                    {api.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{api.description}</p>
                    )}
                  </div>

                  <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-violet-400 font-bold">
                    ₹{Number(api.cost ?? 3.5).toFixed(2)}/req
                  </span>
                </div>

                {/* Technical Endpoint Specs */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="px-1.5 py-0.5 rounded bg-violet-950 text-violet-400 font-bold text-[10px]">
                      {api.method}
                    </span>
                    <span className="truncate text-slate-400" title={api.endpoint}>
                      {api.endpoint}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                    <div>
                      <span className="text-slate-500 block">Auth Type:</span>
                      <span className="text-slate-300 font-semibold">{api.authType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Encrypted Secret:</span>
                      {api.hasSecret || api.encryptedSecret ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-mono text-[11px] font-semibold">
                          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>••••••••••••••••</span>
                          <span className="text-[10px] text-emerald-500/80 font-sans font-normal">(Encrypted)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-sans">None (Public)</span>
                      )}
                    </div>

                  </div>
                </div>

                {/* Health Monitoring Telemetry */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      Health:{" "}
                      <strong className={api.lastTestStatus === "HEALTHY" ? "text-emerald-400" : "text-amber-400"}>
                        {api.lastTestStatus || "Untested"}
                      </strong>
                      {api.lastTestLatencyMs ? ` (${api.lastTestLatencyMs}ms)` : ""}
                    </span>
                  </div>
                  <span>Total queries: <strong>{api._count?.requests ?? 0}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenTestModal(api)}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-950/60 text-violet-300 border border-violet-800/40 hover:bg-violet-900/60 font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 text-violet-400 fill-violet-400" />
                  <span>Test API</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(api)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit configuration"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteApi(api.id)}
                    className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition-colors"
                    title="Delete configuration"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal 1: Create / Edit API Configuration */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingApi ? "Edit API Engine Configuration" : "Add New External Provider API"}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure endpoint parameters, secrets, headers, and dynamic schema mappings
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApi} className="space-y-4 text-xs">
              {/* Row 1: Name & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">API Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. NumVerify Global HLR"
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">HTTP Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Endpoint */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Endpoint URL</label>
                <input
                  type="url"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.provider.com/v1/validate"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              {/* Row 3: Authentication Type, Key Name, Secret */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Auth Type</label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  >
                    <option value="NONE">None / Public</option>
                    <option value="BEARER_TOKEN">Bearer Token</option>
                    <option value="API_KEY_HEADER">API Key in Header</option>
                    <option value="API_KEY_QUERY">API Key in Query Param</option>
                    <option value="CUSTOM_HEADER">Custom Header</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Header / Param Name</label>
                  <input
                    type="text"
                    value={authKeyName}
                    onChange={(e) => setAuthKeyName(e.target.value)}
                    placeholder="e.g. X-Api-Key / Authorization"
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">Secret / Token</label>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Masked & AES-256</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder={
                        editingApi?.hasSecret
                          ? "•••••••••••••••• (Leave blank to keep existing secret)"
                          : "Enter provider API key, token, or secret"
                      }
                      className="w-full p-2.5 pr-10 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
                      title={showSecret ? "Hide Secret" : "Show Secret"}
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Row 4: Pricing, Timeout, Active */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fee per Lookup (₹)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Timeout (ms)</label>
                  <input
                    type="number"
                    value={timeout}
                    onChange={(e) => setTimeoutVal(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={isActive ? "true" : "false"}
                    onChange={(e) => setIsActive(e.target.value === "true")}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                  >
                    <option value="true">Active & Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Dynamic Response Mapping */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-violet-400 block text-xs">
                  Dynamic JSON Response Mapping (Handles Different API Structures)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Success Field</label>
                    <input
                      type="text"
                      value={successField}
                      onChange={(e) => setSuccessField(e.target.value)}
                      placeholder="e.g. status or code"
                      className="w-full p-2 rounded-lg border border-slate-800 bg-slate-900 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Success Tokens</label>
                    <input
                      type="text"
                      value={successValues}
                      onChange={(e) => setSuccessValues(e.target.value)}
                      placeholder="success,true,200,OK"
                      className="w-full p-2 rounded-lg border border-slate-800 bg-slate-900 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Message Field</label>
                    <input
                      type="text"
                      value={messageField}
                      onChange={(e) => setMessageField(e.target.value)}
                      placeholder="message or reason"
                      className="w-full p-2 rounded-lg border border-slate-800 bg-slate-900 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Result Data Field</label>
                    <input
                      type="text"
                      value={resultField}
                      onChange={(e) => setResultField(e.target.value)}
                      placeholder="data or result"
                      className="w-full p-2 rounded-lg border border-slate-800 bg-slate-900 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Request Template */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Request Body Template (Use {`{{phone}}`} and {`{{countryCode}}`})
                </label>
                <textarea
                  rows={3}
                  value={requestTemplate}
                  onChange={(e) => setRequestTemplate(e.target.value)}
                  placeholder={`{\n  "phone": "{{phone}}",\n  "country": "{{countryCode}}"\n}`}
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Test API Interactive Tool */}
      {testModalApi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 space-y-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-violet-400" />
                  <span>Test API: {testModalApi.name}</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{testModalApi.endpoint}</p>
              </div>
              <button onClick={() => setTestModalApi(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Test Telephone Number (E.164 format)
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+919876543210"
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={testing}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Request...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Dispatch Test Request</span>
                  </>
                )}
              </button>
            </form>

            {/* Test Results Display */}
            {testResult && (
              <div className="space-y-3 pt-3 border-t border-slate-800 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        testResult.success ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    <span className="font-bold text-white">
                      HTTP {testResult.httpStatus}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        testResult.success
                          ? "bg-emerald-950 text-emerald-400"
                          : "bg-rose-950 text-rose-400"
                      }`}
                    >
                      {testResult.success ? "VALIDATION PASSED" : "FAILED / ERROR"}
                    </span>
                  </div>
                  <span className="font-mono text-slate-400">{testResult.latencyMs}ms latency</span>
                </div>

                {testResult.message && (
                  <p className="text-xs text-slate-300">
                    <span className="text-slate-500 mr-1 font-semibold">Message:</span>
                    {testResult.message}
                  </p>
                )}

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono max-h-56 overflow-y-auto">
                  <span className="text-slate-500 block mb-1 text-[10px] uppercase font-bold">
                    Sanitized Response Payload
                  </span>
                  <pre className="text-indigo-300 text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(testResult.rawResponse || testResult.sanitizedResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
