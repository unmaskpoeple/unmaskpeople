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
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Info,
  Sparkles,
  Mail,
  User,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
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
  userEmail: propEmail,
  userName: propName,
}: AddMoneyModalProps) {
  const { user, updateBalanceLocally } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"pay" | "history">("pay");
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [manualEmail, setManualEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [showUtrHelp, setShowUtrHelp] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [successInfo, setSuccessInfo] = useState<{ amount: number; utr: string; message: string } | null>(null);

  // Dynamic Gateway Settings from Server
  const [upiId, setUpiId] = useState<string>("numverge@upi");
  const [upiPayeeName, setUpiPayeeName] = useState<string>("NumVerge OTP");
  const [upiQrImageUrl, setUpiQrImageUrl] = useState<string>("");
  const [upiMinDeposit, setUpiMinDeposit] = useState<number>(10);
  const [upiInstructions, setUpiInstructions] = useState<string>("");

  // User's deposits history
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const effectiveAmount = isCustom ? Number(customAmount) : selectedAmount;
  const activeEmail = user?.email || propEmail || manualEmail.trim();

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSubmitError("");
      setSuccessInfo(null);
      if (user?.email) {
        setManualEmail(user.email);
      } else if (propEmail) {
        setManualEmail(propEmail);
      }

      // Fetch public settings for live UPI configuration
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
  }, [isOpen, user, propEmail]);

  // Fetch deposit history when switching to history tab
  const fetchDepositsHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/wallet/upi/deposits", { credentials: "include" });
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

  // Construct standard NPCI UPI Payment URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    upiPayeeName
  )}&am=${effectiveAmount || 100}&cu=INR&tn=${encodeURIComponent("NumVerge OTP Wallet Topup")}`;

  // High-contrast, scannable QR Code
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(
    upiUri
  )}`;

  const finalQrUrl = upiQrImageUrl && upiQrImageUrl.trim() ? upiQrImageUrl : dynamicQrUrl;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    toast.success("UPI ID Copied", `${upiId} copied to clipboard.`);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handlePasteUtr = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 25);
        setUtrNumber(cleaned);
        toast.info("Pasted from Clipboard", cleaned);
      }
    } catch {
      toast.error("Clipboard Permission", "Please paste manually into the input box.");
    }
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!effectiveAmount || effectiveAmount < upiMinDeposit) {
      const err = `Minimum recharge amount is ₹${upiMinDeposit}.00`;
      setSubmitError(err);
      toast.error("Invalid Amount", err);
      return;
    }

    const cleanUtr = utrNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      const err = "Please enter a valid 12-digit UPI Reference / UTR Number.";
      setSubmitError(err);
      toast.error("Invalid UTR", err);
      return;
    }

    if (!activeEmail || !activeEmail.includes("@")) {
      const err = "Please enter your registered account email so we can credit your balance.";
      setSubmitError(err);
      toast.error("Email Required", err);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/upi/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: effectiveAmount,
          utr: cleanUtr,
          userEmail: activeEmail,
          userName: user?.name || propName || activeEmail.split("@")[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit deposit request");
      }

      if (data.status === "APPROVED") {
        toast.success("Wallet Credited!", data.message || `₹${effectiveAmount.toFixed(2)} added to your wallet!`);
        if (typeof data.walletBalance === "number") {
          updateBalanceLocally(data.walletBalance);
          if (onBalanceUpdated) onBalanceUpdated(data.walletBalance);
        }
        setSuccessInfo({
          amount: effectiveAmount,
          utr: cleanUtr,
          message: data.message || `₹${effectiveAmount.toFixed(2)} has been added to your wallet instantly! You can now activate virtual numbers.`,
        });
        setUtrNumber("");
      } else {
        toast.success("Deposit Request Submitted", "UTR recorded for verification. Admin will credit your balance shortly.");
        setSuccessInfo({
          amount: effectiveAmount,
          utr: cleanUtr,
          message: `Your deposit request for ₹${effectiveAmount.toFixed(2)} (UTR: ${cleanUtr}) has been recorded. Admin will verify and credit your wallet.`,
        });
        setUtrNumber("");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit UTR. Please check and try again.");
      toast.error("Submission Failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cleanUtrDigits = utrNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-white text-sm sm:text-base truncate">Add Money via UPI QR</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Zero Fees • Instant Scan & Pay</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 sm:px-5 pt-1.5 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab("pay");
              setSuccessInfo(null);
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "pay"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pay & Submit UTR</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              setSuccessInfo(null);
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === "history"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Deposit History</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {activeTab === "pay" ? (
            successInfo ? (
              /* Success Celebration Screen */
              <div className="py-6 px-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-white">Deposit Submitted!</h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                    {successInfo.message}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 max-w-sm mx-auto text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Amount:</span>
                    <span className="text-emerald-400 font-bold text-sm">₹{successInfo.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>UTR / Ref ID:</span>
                    <span className="text-white font-bold">{successInfo.utr}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Account:</span>
                    <span className="text-cyan-300 font-bold truncate max-w-[180px]">{activeEmail}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("history");
                      fetchDepositsHistory();
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 hover:text-white font-bold text-xs transition-colors"
                  >
                    View in History
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-opacity"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitDeposit} className="space-y-4 sm:space-y-5">
                {/* Account Email Confirmation */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Crediting Account</p>
                      {user?.email ? (
                        <p className="text-xs font-bold text-emerald-400 truncate">{user.email}</p>
                      ) : (
                        <input
                          type="email"
                          required
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          placeholder="Enter your registered email"
                          className="bg-transparent border-b border-cyan-400/50 text-xs font-bold text-cyan-300 outline-none w-full max-w-[220px]"
                        />
                      )}
                    </div>
                  </div>
                  {user?.email && (
                    <span className="self-start sm:self-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      Verified User
                    </span>
                  )}
                </div>

                {/* Step 1: Select Amount */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-black">
                        1
                      </span>
                      <span>Choose Amount to Add</span>
                    </label>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      Paying: ₹{effectiveAmount || 0}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
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
                          className={`py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-500/20 scale-[1.02]"
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
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs sm:text-sm focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Step 2: Scan QR or Pay via Mobile UPI */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <div className="flex items-center justify-between text-left pb-2 border-b border-slate-800/80">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-black">
                          2
                        </span>
                        <span>Scan & Pay with Any UPI App</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Google Pay • PhonePe • Paytm • BHIM • CRED</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      Zero Fees
                    </span>
                  </div>

                  {/* QR Code Container */}
                  <div className="w-44 h-44 sm:w-52 sm:h-52 mx-auto p-2.5 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={finalQrUrl}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

                  {/* Payee Info & Copy Button */}
                  <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 sm:p-2.5 rounded-xl">
                    <div className="text-left overflow-hidden pr-2">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">UPI ID</p>
                      <p className="font-mono text-xs sm:text-sm font-bold text-white truncate">{upiId}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all shrink-0"
                    >
                      {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUpi ? "Copied" : "Copy UPI ID"}</span>
                    </button>
                  </div>

                  {/* Mobile Direct UPI Intent Deep Link Button */}
                  <a
                    href={upiUri}
                    className="w-full py-3 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-teal-500/15 hover:from-cyan-500/25 hover:to-teal-500/25 text-cyan-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Pay ₹{effectiveAmount || 0} via Installed UPI App</span>
                  </a>
                </div>

                {/* Step 3: Next Steps Guide (Visual Step-by-Step) */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/25 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-black">
                        3
                      </span>
                      <span>Next Steps: What to do after paying?</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowUtrHelp(!showUtrHelp)}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Where is UTR?</span>
                      {showUtrHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                      <p className="font-bold text-white text-[11px]">1. Complete Payment</p>
                      <p className="text-[10px] text-slate-400 leading-tight">Pay exact ₹{effectiveAmount || 0} from your UPI app.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                      <p className="font-bold text-white text-[11px]">2. Copy 12-Digit UTR</p>
                      <p className="text-[10px] text-slate-400 leading-tight">Open payment receipt and copy the 12-digit UPI Ref ID.</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                      <p className="font-bold text-white text-[11px]">3. Instant Balance Addition</p>
                      <p className="text-[10px] text-slate-400 leading-tight">Paste below & money gets added directly to your account.</p>
                    </div>
                  </div>

                  {/* Expandable UTR Location Helper */}
                  {showUtrHelp && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 text-[11px] text-slate-300 space-y-2 animate-in fade-in duration-150">
                      <p className="font-bold text-indigo-300">How to find UTR in your app:</p>
                      <ul className="space-y-1.5 text-[10px] text-slate-400 list-disc list-inside">
                        <li>
                          <strong className="text-white">PhonePe:</strong> Open the transaction & look for <span className="text-cyan-300 font-mono">UTR: 428190123456</span>.
                        </li>
                        <li>
                          <strong className="text-white">Google Pay:</strong> View payment details & copy the <span className="text-cyan-300 font-mono">UPI Transaction ID (12 digits)</span>.
                        </li>
                        <li>
                          <strong className="text-white">Paytm:</strong> Go to Passbook/History & copy <span className="text-cyan-300 font-mono">UPI Ref No.</span>.
                        </li>
                        <li>
                          <strong className="text-white">BHIM / Bank Apps:</strong> Look for <span className="text-cyan-300 font-mono">Ref No / Approval Code</span>.
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Step 4: Enter 12-Digit UTR Number */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-black">
                        4
                      </span>
                      <span>Enter 12-Digit UTR / UPI Ref ID</span>
                    </label>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        cleanUtrDigits.length === 12
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : cleanUtrDigits.length > 0
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      {cleanUtrDigits.length}/12 Digits
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={utrNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                        setUtrNumber(val);
                        setSubmitError("");
                      }}
                      placeholder="e.g. 428190123456"
                      maxLength={25}
                      className="w-full pl-3.5 pr-20 py-3 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm sm:text-base font-mono tracking-wider focus:border-cyan-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handlePasteUtr}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                      title="Paste UTR from clipboard"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal">
                    ⚠️ <strong>Strict Single-Use Policy:</strong> Each UTR can only be submitted once. Duplicate or reused transaction references are automatically rejected.
                  </p>
                </div>

                {/* Inline Error Alert */}
                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit Verification Button */}
                <button
                  type="submit"
                  disabled={submitting || !effectiveAmount || !cleanUtrDigits}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-white font-black text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying & Recording UTR...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Submit Payment Verification (₹{effectiveAmount || 0})</span>
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            /* Deposit History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Your Recent Deposits</p>
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
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-2xl p-6 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs font-semibold text-slate-300">No deposits found yet</p>
                  <p className="text-[11px] text-slate-400">
                    Once you pay via UPI and submit the 12-digit UTR, your requests will appear here with live verification status.
                  </p>
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
                        <div className="min-w-0">
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
                          <p className="font-mono text-[11px] text-slate-400 mt-0.5 truncate">
                            UTR: <span className="text-slate-200 font-bold">{dep.utr}</span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
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
