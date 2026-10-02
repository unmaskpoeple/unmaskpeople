"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Check,
  Copy,
  QrCode,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdated?: (newBalance: number) => void;
  userEmail?: string;
  userName?: string;
}

const PRESET_AMOUNTS = [50, 100, 250, 500];

export function AddMoneyModal({
  isOpen,
  onClose,
  onBalanceUpdated,
  userEmail,
  userName,
}: AddMoneyModalProps) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"pay" | "history">("pay");
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Dynamic Gateway Details from Server
  const [upiId, setUpiId] = useState<string>("unmaskpeople@upi");
  const [upiPayeeName, setUpiPayeeName] = useState<string>("UnMaskPeople");
  const [upiQrImageUrl, setUpiQrImageUrl] = useState<string>("");
  const [upiMinDeposit, setUpiMinDeposit] = useState<number>(10);
  const [upiInstructions, setUpiInstructions] = useState<string>("");

  // User's deposits history
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const effectiveAmount = isCustom ? Number(customAmount) : selectedAmount;

  // Fetch public settings for UPI configuration
  useEffect(() => {
    if (isOpen) {
      fetch("/api/public-settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.upiId) setUpiId(data.upiId);
          if (data.upiPayeeName) setUpiPayeeName(data.upiPayeeName);
          if (data.upiQrImageUrl) setUpiQrImageUrl(data.upiQrImageUrl);
          if (data.upiMinDeposit) setUpiMinDeposit(data.upiMinDeposit);
          if (data.upiInstructions) setUpiInstructions(data.upiInstructions);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Fetch deposit history when switching to history tab
  const fetchDepositsHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/wallet/upi/deposits");
      if (res.ok) {
        const json = await res.json();
        setDeposits(json.deposits || []);
      }
    } catch {}
    finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history" && isOpen) {
      fetchDepositsHistory();
    }
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  // Construct standard UPI Payment URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    upiPayeeName
  )}&am=${effectiveAmount || 100}&cu=INR&tn=${encodeURIComponent("UnmaskPeople Wallet")}`;

  // QR Code generator URL
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(
    upiUri
  )}`;

  const finalQrUrl = upiQrImageUrl && upiQrImageUrl.trim() ? upiQrImageUrl : dynamicQrUrl;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    toast.success("UPI ID Copied", `${upiId} copied to clipboard.`);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveAmount || effectiveAmount < upiMinDeposit) {
      toast.error("Invalid Amount", `Minimum recharge amount is ₹${upiMinDeposit}.00`);
      return;
    }

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      toast.error("Invalid UTR", "Please enter a valid 12-digit UPI Reference / UTR Number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/upi/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          utr: cleanUtr,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit deposit request");
      }

      if (data.status === "APPROVED") {
        toast.success("Deposit Approved!", data.message || "Wallet credited successfully!");
        if (typeof data.walletBalance === "number" && onBalanceUpdated) {
          onBalanceUpdated(data.walletBalance);
        }
        onClose();
      } else {
        toast.success("Deposit Submitted", "Your UTR has been submitted for verification. Wallet will be credited shortly!");
        setUtrNumber("");
        setActiveTab("history");
        fetchDepositsHistory();
      }
    } catch (err: any) {
      toast.error("Submission Failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Add Money via UPI QR</h3>
              <p className="text-[11px] text-slate-400">Zero Gateway Fees • Direct UPI Transfer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("pay")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "pay"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Pay & Submit UTR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "history"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Deposit History</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === "pay" ? (
            <form onSubmit={handleSubmitDeposit} className="space-y-5">
              {/* Step 1: Select Amount */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Step 1: Choose Amount
                  </label>
                  <span className="text-xs font-bold text-emerald-400">
                    To Pay: ₹{effectiveAmount || 0}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((amt) => {
                    const isSelected = !isCustom && selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt);
                          setIsCustom(false);
                        }}
                        className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/20"
                            : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={upiMinDeposit}
                    max="100000"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setIsCustom(true);
                    }}
                    placeholder={`Or enter custom amount (min ₹${upiMinDeposit})`}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:border-cyan-400 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Step 2: Scan QR or Pay via UPI */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 text-center space-y-3.5">
                <div className="flex items-center justify-between text-left pb-2 border-b border-slate-800/60">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Step 2: Scan QR with Any UPI App
                    </p>
                    <p className="text-[11px] text-slate-400">GPay • PhonePe • Paytm • BHIM • Cred</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                    UPI Instant
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="w-52 h-52 mx-auto p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={finalQrUrl}
                    alt="UPI QR Code"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>

                {/* UPI ID Info & Copy Button */}
                <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                  <div className="text-left overflow-hidden">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Pay to UPI ID</p>
                    <p className="font-mono text-xs font-bold text-white truncate">{upiId}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all shrink-0 ml-2"
                  >
                    {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUpi ? "Copied" : "Copy ID"}</span>
                  </button>
                </div>

                {/* Mobile Direct Pay Link */}
                <a
                  href={upiUri}
                  className="w-full py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all sm:hidden"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Tap to Pay with Installed UPI App</span>
                </a>
              </div>

              {/* Step 3: Enter UTR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Step 3: Enter 12-Digit UTR / Ref Number
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Found in UPI App details</span>
                </div>
                <input
                  type="text"
                  required
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                  placeholder="e.g. 428190123456"
                  maxLength={25}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm font-mono tracking-wider focus:border-cyan-400 outline-none"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  After paying via GPay/PhonePe/Paytm, open the transaction details, find the 12-digit
                  <strong> "UPI Ref No"</strong> or <strong>"UTR"</strong>, and enter it above to verify.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !effectiveAmount || !utrNumber.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying UTR...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Submit Payment of ₹{effectiveAmount || 0}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Deposit History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Recent UPI Deposits</p>
                <button
                  type="button"
                  onClick={fetchDepositsHistory}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                  <p className="text-xs">Loading deposits...</p>
                </div>
              ) : deposits.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl p-6">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-300">No deposits found yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">Submit your first UPI UTR in the Pay tab above.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {deposits.map((dep, idx) => {
                    const isApproved = dep.status === "APPROVED";
                    const isRejected = dep.status === "REJECTED";
                    return (
                      <div
                        key={dep.id || idx}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-sm">
                              ₹{Number(dep.amount).toFixed(2)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isApproved
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : isRejected
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {dep.status || "PENDING"}
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                            UTR: <span className="text-slate-200 font-bold">{dep.utr}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {dep.createdAt ? new Date(dep.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
