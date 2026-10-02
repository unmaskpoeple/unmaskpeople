"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Wallet,
  Plus,
  Loader2,
  LogOut,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  X,
  CreditCard,
  Zap,
  Lock,
  Phone,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { ResponseViewer } from "@/components/response-viewer";
import { SiteFooter } from "@/components/site-footer";

const COUNTRY_CODE = "+91";
const COUNTRY_NAME = "India";
const COUNTRY_FLAG = "🇮🇳";

const PRESET_AMOUNTS = [100, 250, 500, 1000];

export default function PhoneSearchPage() {
  const { user, logout, updateBalanceLocally } = useAuth();
  const { toast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState("");

  // Add Money Modal State
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [recharging, setRecharging] = useState(false);

  // Dynamic Query Pricing
  const [phoneCost, setPhoneCost] = useState<number>(3.5);

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.phoneCost === "number") {
          setPhoneCost(data.phoneCost);
        }
      })
      .catch(() => {});
  }, []);

  // Login Prompt Modal State
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState("");

  const effectiveAmount = isCustom ? Number(customAmount) : selectedAmount;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setSearchResult(null);

    const cleaned = phoneNumber.replace(/\D/g, "");
    if (!cleaned) {
      setSearchError("Please enter a 10-digit Indian mobile number.");
      return;
    }

    if (cleaned.length !== 10) {
      setSearchError(`Phone number must be exactly 10 digits (currently ${cleaned.length} digits).`);
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setSearchError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210).");
      return;
    }

    const targetPhone = cleaned;

    if (!user) {
      setPromptMessage("Please log in to search phone numbers and resolve live carrier intelligence.");
      setShowLoginPrompt(true);
      return;
    }

    if (user.walletBalance < phoneCost) {
      setSearchError(`Insufficient balance (₹${user.walletBalance.toFixed(2)}). Minimum ₹${phoneCost.toFixed(2)} required per lookup. Please click 'Add Money' at the top.`);
      toast.warning("Low Balance", "Please top up your wallet to continue searching.");
      return;
    }

    setSearching(true);
    try {
      const res = await fetch("/api/phone/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetPhone,
          countryCode: COUNTRY_CODE,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Lookup request failed.");
      }

      setSearchResult(data);
      if (typeof data.walletBalance === "number") {
        updateBalanceLocally(data.walletBalance);
      }

      if (data.isRefunded) {
        toast.info("Query Refunded", data.message || "Provider error. Fee refunded to your wallet.");
      } else {
        toast.success("Resolved", "Phone intelligence retrieved successfully.");
      }
    } catch (err: any) {
      setSearchError(err.message || "Failed to search phone number.");
      toast.error("Lookup Failed", err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMoneyClick = () => {
    if (!user) {
      setPromptMessage("Please log in to add money to your prepaid wallet.");
      setShowLoginPrompt(true);
      return;
    }
    setShowAddMoneyModal(true);
  };

  const handleProcessRecharge = async () => {
    if (!effectiveAmount || effectiveAmount < 10) {
      toast.error("Invalid Amount", "Minimum recharge amount is ₹10.00");
      return;
    }

    setRecharging(true);
    try {
      const resOrder = await fetch("/api/wallet/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: effectiveAmount }),
      });
      const orderData = await resOrder.json();
      if (!resOrder.ok) throw new Error(orderData.error || "Failed to initialize recharge order");

      if (orderData.isSimulator) {
        const resVerify = await fetch("/api/wallet/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: effectiveAmount,
            isSimulator: true,
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
          }),
        });
        const verifyData = await resVerify.json();
        if (!resVerify.ok) throw new Error(verifyData.error || "Verification failed");

        if (typeof verifyData.walletBalance === "number") {
          updateBalanceLocally(verifyData.walletBalance);
        } else {
          updateBalanceLocally((user?.walletBalance || 0) + effectiveAmount);
        }

        toast.success("Wallet Recharged", `₹${effectiveAmount.toFixed(2)} credited successfully!`);
        setShowAddMoneyModal(false);
        setCustomAmount("");
        setIsCustom(false);
      } else {
        await loadRazorpayScript();
        const options = {
          key: orderData.keyId,
          amount: Math.round(effectiveAmount * 100),
          currency: "INR",
          name: "UnMaskPeople.in",
          description: `Prepaid Wallet Top-up (₹${effectiveAmount})`,
          order_id: orderData.orderId,
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: {
            color: "#06b6d4",
          },
          handler: async function (response: any) {
            try {
              const resVerify = await fetch("/api/wallet/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amount: effectiveAmount,
                  isSimulator: false,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await resVerify.json();
              if (!resVerify.ok) throw new Error(verifyData.error || "Verification failed");

              if (typeof verifyData.walletBalance === "number") {
                updateBalanceLocally(verifyData.walletBalance);
              } else {
                updateBalanceLocally((user?.walletBalance || 0) + effectiveAmount);
              }

              toast.success("Payment Received", `₹${effectiveAmount.toFixed(2)} credited via Razorpay!`);
              setShowAddMoneyModal(false);
              setCustomAmount("");
              setIsCustom(false);
            } catch (vErr: any) {
              toast.error("Verification Error", vErr.message);
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      toast.error("Payment Error", err.message);
    } finally {
      setRecharging(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-60 z-0" />
      <div className="absolute inset-0 hacker-scanlines opacity-15 pointer-events-none z-0" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header (Logo, Refer & Earn, Add Money, Login / Logout) */}
      <header className="relative z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <BrandLogo href="/" size="md" />

          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-1.5 shadow-inner">
                <div className="px-3 py-1 text-xs font-mono font-bold text-slate-300 hidden sm:flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-emerald-400">₹{user.walletBalance.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddMoneyClick}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Money</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddMoneyClick}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Money</span>
              </button>
            )}

            {user ? (
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 font-bold text-xs transition-all flex items-center gap-1.5 hover:bg-rose-950/20"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Log Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>Log In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Search Body */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center justify-start space-y-8">
        {/* Navigation Breadcrumb Back to Services Hub */}
        <div className="w-full flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Services</span>
          </Link>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-full">
            Cost: ₹{phoneCost.toFixed(2)} / query
          </span>
        </div>

        {/* Title in Radiant Gradient Letters */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 mx-auto flex items-center justify-center mb-2 shadow-lg shadow-cyan-500/10">
            <Phone className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            <span className="gradient-letter">Search Phone</span>{" "}
            <span className="gradient-letter-cyan">Number</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-400 max-w-md mx-auto">
            Real-time carrier identification, telecom circle verification, and HLR line status
          </p>
        </div>

        {/* Glowing Search Form */}
        <div className="w-full max-w-2xl relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-25 group-focus-within:opacity-75 blur-xl transition-opacity duration-300 -z-10" />

          <form
            onSubmit={handleSearch}
            className="w-full bg-slate-900/90 border border-slate-700/80 focus-within:border-cyan-400/80 rounded-2xl shadow-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 backdrop-blur-2xl transition-all"
          >
            {/* Exclusively Indian Country Code (+91) */}
            <div className="relative shrink-0 flex items-center border-b sm:border-b-0 sm:border-r border-slate-800 pb-2 sm:pb-0 px-3.5 py-1.5">
              <span className="text-xl pr-2">{COUNTRY_FLAG}</span>
              <span className="font-mono font-black text-sm text-cyan-400">{COUNTRY_CODE}</span>
            </div>

            <div className="flex-1 relative flex items-center">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhoneNumber(digits);
                  setSearchError("");
                }}
                maxLength={10}
                placeholder="Enter 10 digits (e.g. 9876543210)"
                className="w-full bg-transparent px-3 py-2 font-mono font-bold text-base sm:text-lg text-white placeholder:text-slate-500 outline-none tracking-wider"
                autoFocus
              />
              {/* Digit counter indicator */}
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded mr-1 transition-all ${
                  phoneNumber.length === 10
                    ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 shadow-sm shadow-emerald-500/20"
                    : phoneNumber.length > 0
                    ? "text-slate-400"
                    : "text-slate-600"
                }`}
              >
                {phoneNumber.length}/10
              </span>
              {phoneNumber && (
                <button
                  type="button"
                  onClick={() => setPhoneNumber("")}
                  className="p-1 rounded-full text-slate-500 hover:text-slate-300 mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={searching}
              className="py-3 px-7 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:opacity-95 text-white font-black text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-white" />
                  <span>Search</span>
                </>
              )}
            </button>
          </form>

          {searchError && (
            <div className="mt-3.5 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 backdrop-blur-xl animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* Dynamic Results Card */}
        {searchResult && (
          <div className="w-full max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider gradient-letter-cyan">Resolved Intelligence</span>
                <span className="font-mono text-xs font-bold text-slate-200 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800">
                  {searchResult.phone}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchResult(null)}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold"
              >
                Clear Result
              </button>
            </div>

            <ResponseViewer
              status={searchResult.status}
              phone={searchResult.phone}
              apiUsed={searchResult.apiUsed}
              latencyMs={searchResult.latencyMs}
              amountCharged={searchResult.amountCharged}
              isRefunded={searchResult.isRefunded}
              message={searchResult.message}
              data={searchResult.data}
              raw={searchResult.raw}
            />
          </div>
        )}
      </main>

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 backdrop-blur-2xl relative">
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-lg gradient-letter-cyan">Add Money</h3>
                  <p className="text-xs text-slate-400 font-mono">Current Balance: <span className="text-emerald-400 font-bold">₹{(user?.walletBalance ?? 0).toFixed(2)}</span></p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddMoneyModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Select Recharge Amount</label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = !isCustom && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setSelectedAmount(amt); setIsCustom(false); }}
                      className={`py-3 rounded-xl font-bold text-xs border transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-transparent shadow-lg shadow-indigo-500/25"
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Or Custom Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setIsCustom(true); }}
                  placeholder="Enter custom amount (min ₹10)"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:border-cyan-400 outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={recharging || !effectiveAmount || effectiveAmount < 10}
              onClick={handleProcessRecharge}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {recharging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-white" />
                  <span>Pay & Top-Up ₹{effectiveAmount || 0}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Guest Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-lg gradient-letter">Authentication Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {promptMessage || "Please log in to your account to use live carrier intelligence."}
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Log In Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/register"
                className="w-full py-2.5 rounded-xl border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800/60 transition-colors block"
              >
                Create Account (₹15 Free Credit)
              </Link>
            </div>
            <button type="button" onClick={() => setShowLoginPrompt(false)} className="text-xs text-slate-500 hover:text-slate-300 pt-1">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Universal Compliant Site Footer */}
      <SiteFooter />
    </div>
  );
}
