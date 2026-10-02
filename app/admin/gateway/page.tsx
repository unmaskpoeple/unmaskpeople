"use client";

import React, { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { useToast } from "@/components/ui/toast";
import {
  QrCode,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Zap,
  Smartphone,
  AlertCircle,
  User,
  Settings as SettingsIcon,
  ListOrdered,
} from "lucide-react";

export default function AdminGatewayPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"settings" | "deposits">("settings");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UPI Settings
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [upiId, setUpiId] = useState("");
  const [upiPayeeName, setUpiPayeeName] = useState("");
  const [upiQrImageUrl, setUpiQrImageUrl] = useState("");
  const [upiAutoApprove, setUpiAutoApprove] = useState(false);
  const [upiMinDeposit, setUpiMinDeposit] = useState(10);
  const [upiInstructions, setUpiInstructions] = useState("");

  // Deposits List
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const fetchGatewayConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gateway");
      if (res.ok) {
        const json = await res.json();
        setUpiEnabled(json.upi_enabled);
        setUpiId(json.upi_id || "");
        setUpiPayeeName(json.upi_payee_name || "");
        setUpiQrImageUrl(json.upi_qr_image_url || "");
        setUpiAutoApprove(json.upi_auto_approve === true);
        setUpiMinDeposit(json.upi_min_deposit || 10);
        setUpiInstructions(json.upi_instructions || "");
      }
    } catch (err: any) {
      toast.error("Failed to load gateway config", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const res = await fetch("/api/admin/deposits");
      if (res.ok) {
        const json = await res.json();
        setDeposits(json.deposits || []);
      }
    } catch (err: any) {
      toast.error("Failed to load deposits", err.message);
    } finally {
      setLoadingDeposits(false);
    }
  };

  useEffect(() => {
    fetchGatewayConfig();
    fetchDeposits();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/gateway", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upi_enabled: upiEnabled,
          upi_id: upiId.trim(),
          upi_payee_name: upiPayeeName.trim(),
          upi_qr_image_url: upiQrImageUrl.trim(),
          upi_auto_approve: upiAutoApprove,
          upi_min_deposit: Number(upiMinDeposit),
          upi_instructions: upiInstructions.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update gateway settings");

      toast.success("Gateway Saved", "Manual UPI configuration updated successfully!");
      fetchGatewayConfig();
    } catch (err: any) {
      toast.error("Save Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveDeposit = async (id: string, amount: number, utr: string) => {
    if (!confirm(`Are you sure you want to approve this deposit of ₹${amount} (UTR: ${utr}) and credit the user's wallet?`)) {
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/deposits/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve deposit");

      toast.success("Deposit Approved", data.message || `₹${amount} credited to user wallet!`);
      fetchDeposits();
    } catch (err: any) {
      toast.error("Approval Failed", err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDeposit = async (id: string, utr: string) => {
    const reason = prompt("Enter rejection reason (optional):", "Invalid or unverified UTR number");
    if (reason === null) return; // user cancelled prompt

    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/deposits/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject deposit");

      toast.info("Deposit Rejected", data.message || "Deposit marked as rejected.");
      fetchDeposits();
    } catch (err: any) {
      toast.error("Rejection Failed", err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    toast.success("Copied", `UTR ${utr} copied to clipboard`);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // Preview QR Code
  const previewUri = `upi://pay?pa=${encodeURIComponent(upiId || "yourname@upi")}&pn=${encodeURIComponent(
    upiPayeeName || "UnMaskPeople"
  )}&am=100&cu=INR&tn=Wallet%20Topup`;
  const dynamicPreviewQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
    previewUri
  )}`;
  const finalPreviewQr = upiQrImageUrl && upiQrImageUrl.trim() ? upiQrImageUrl : dynamicPreviewQr;

  const pendingCount = deposits.filter((d) => d.status === "PENDING").length;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="UPI Payment Gateway & Deposits"
        subtitle="Manage your UPI QR code, UPI ID, and approve/verify user UTR submissions to credit wallets"
      />

      <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === "settings"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>UPI Gateway Settings</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("deposits");
              fetchDeposits();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all relative ${
              activeTab === "deposits"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Manual Deposits List</span>
            {pendingCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </button>
        </div>

        {activeTab === "settings" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings Form */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">UPI Gateway Configuration</h3>
                    <p className="text-xs text-slate-400">
                      Users scan this QR or pay to this UPI ID to add funds to their wallet.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                  Zero Processing Fees
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm">Loading gateway settings...</p>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">
                  {/* Enable UPI Gateway Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div>
                      <p className="font-bold text-sm text-white">Enable Manual UPI Gateway</p>
                      <p className="text-xs text-slate-400">
                        Allow users to top up their prepaid wallet using UPI apps and UTR verification
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={upiEnabled}
                        onChange={(e) => setUpiEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* Auto-Approval Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-white">Auto-Credit Wallet on UTR Submission</p>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Optional
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        If enabled, user wallet will be credited instantly when they submit their UTR. If disabled, admin manually clicks Approve.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={upiAutoApprove}
                        onChange={(e) => setUpiAutoApprove(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* UPI ID Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Your UPI ID (VPA) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@okhdfcbank or merchant@upi"
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono text-sm focus:border-emerald-400 outline-none"
                    />
                    <p className="text-[11px] text-slate-400">
                      Money sent by users will go directly to this bank-linked UPI ID.
                    </p>
                  </div>

                  {/* Payee Name Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Payee / Business Name
                    </label>
                    <input
                      type="text"
                      value={upiPayeeName}
                      onChange={(e) => setUpiPayeeName(e.target.value)}
                      placeholder="e.g. UnMaskPeople or Your Full Name"
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:border-emerald-400 outline-none"
                    />
                  </div>

                  {/* Custom QR Image URL (Optional) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Custom QR Code Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={upiQrImageUrl}
                      onChange={(e) => setUpiQrImageUrl(e.target.value)}
                      placeholder="e.g. https://yourdomain.com/my-phonepe-qr.png"
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono text-xs focus:border-emerald-400 outline-none"
                    />
                    <p className="text-[11px] text-slate-400">
                      Leave blank to auto-generate dynamic QR codes with exact amounts.
                    </p>
                  </div>

                  {/* Minimum Deposit Amount */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Minimum Deposit Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={upiMinDeposit}
                      onChange={(e) => setUpiMinDeposit(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm font-mono focus:border-emerald-400 outline-none"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving || !upiId.trim()}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-white font-black text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving UPI Settings...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-white" />
                          <span>Save Gateway Settings</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Live QR Preview Box */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-center">
              <h4 className="font-black text-white text-sm uppercase tracking-wider">Live User Preview</h4>
              <p className="text-xs text-slate-400">This is how your UPI QR Code appears to users when topping up.</p>

              <div className="w-48 h-48 mx-auto p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={finalPreviewQr}
                  alt="UPI QR Preview"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Configured UPI ID</p>
                <p className="font-mono text-xs font-bold text-emerald-400 truncate">
                  {upiId || "No UPI ID set yet"}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Payee: <span className="text-white font-bold">{upiPayeeName || "UnMaskPeople"}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-left text-xs text-indigo-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>How it works:</span>
                </p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  1. User chooses amount & scans your QR code.
                  <br />
                  2. User pays in GPay / PhonePe / Paytm.
                  <br />
                  3. User enters the 12-digit UTR on your site.
                  <br />
                  4. You click <strong>"Approve"</strong> in the Deposits tab to credit their wallet!
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Deposits Management Tab */
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">User Manual UPI Deposits</h3>
                  <p className="text-xs text-slate-400">
                    Verify the 12-digit UTR in your bank/UPI app, then click Approve to credit wallet funds.
                  </p>
                </div>
              </div>
              <button
                onClick={fetchDeposits}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs font-bold transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDeposits ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingDeposits ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400" />
                <p className="text-sm">Loading deposit requests...</p>
              </div>
            ) : deposits.length === 0 ? (
              <div className="py-16 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl p-8">
                <Clock className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <p className="text-base font-bold text-slate-200">No deposit requests yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  When users top up their wallet via UPI and submit their 12-digit UTR, their requests will appear here for verification.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">User</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">UTR / Ref Number</th>
                      <th className="py-3 px-3">Submitted At</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {deposits.map((dep) => {
                      const isPending = dep.status === "PENDING";
                      const isApproved = dep.status === "APPROVED" || dep.status === "SUCCESSFUL";
                      const isRejected = dep.status === "REJECTED" || dep.status === "FAILED";
                      const isProcessing = processingId === dep.id;

                      return (
                        <tr key={dep.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                                {dep.userName ? dep.userName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                              </div>
                              <div>
                                <p className="font-bold text-white text-xs">{dep.userName || "User"}</p>
                                <p className="text-[11px] text-slate-400">{dep.userEmail}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-mono font-black text-emerald-400 text-sm">
                              ₹{Number(dep.amount || 0).toFixed(2)}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-cyan-300 text-xs tracking-wider">
                                {dep.utr}
                              </span>
                              <button
                                onClick={() => handleCopyUtr(dep.utr)}
                                title="Copy UTR"
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              >
                                {copiedUtr === dep.utr ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                            {dep.createdAt ? new Date(dep.createdAt).toLocaleString() : "N/A"}
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isApproved
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : isRejected
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {dep.status || "PENDING"}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleApproveDeposit(dep.id, dep.amount, dep.utr)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Approve</span>
                                </button>

                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleRejectDeposit(dep.id, dep.utr)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">
                                {isApproved ? "Approved" : "Rejected"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
