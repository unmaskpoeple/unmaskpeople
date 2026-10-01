"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Phone,
  Car,
  Fingerprint,
  Wallet,
  Plus,
  Loader2,
  LogOut,
  ArrowRight,
  X,
  CreditCard,
  Zap,
  Lock,
  Gift,
  Share2,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { ReferralModal } from "@/components/referral-modal";
import { SiteFooter } from "@/components/site-footer";
import { BrandLogo } from "@/components/brand-logo";

const PRESET_AMOUNTS = [100, 250, 500, 1000];

export default function ServicesHubPage() {
  const { user, logout, updateBalanceLocally } = useAuth();
  const { toast } = useToast();

  // Add Money Modal State
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [recharging, setRecharging] = useState(false);

  // Referral Modal State
  const [showReferralModal, setShowReferralModal] = useState(false);

  // Guest Prompt Modal
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const effectiveAmount = isCustom ? Number(customAmount) : selectedAmount;

  const handleAddMoneyClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setShowAddMoneyModal(true);
  };

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

  const handleProcessRecharge = async () => {
    if (!effectiveAmount || effectiveAmount < 10) {
      toast.error("Invalid Amount", "Minimum recharge amount is ₹10.00");
      return;
    }

    setRecharging(true);
    try {
      // 1. Create order via Razorpay endpoint
      const resOrder = await fetch("/api/wallet/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: effectiveAmount }),
      });
      const orderData = await resOrder.json();
      if (!resOrder.ok) throw new Error(orderData.error || "Failed to initialize recharge order");

      if (orderData.isSimulator) {
        // Simulated sandbox mode
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
        // Live / Test Razorpay Checkout Modal
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

  const SERVICES = [
    {
      id: "phone",
      title: "Search Phone Number",
      titleClass: "gradient-letter",
      description: "Real-time carrier identification, telecom circle verification, line protocol, and live HLR status.",
      icon: Phone,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-950/80 border-cyan-800/60 shadow-cyan-500/10",
      borderHover: "hover:border-cyan-500/50 hover:shadow-cyan-500/10",
      accentBadge: "Cost: ₹3.50 / query",
      badgeColor: "text-cyan-400 bg-cyan-950/60 border-cyan-800/50",
      href: "/search/phone",
      buttonText: "Open Phone Search",
      buttonGradient: "from-cyan-500 via-indigo-500 to-fuchsia-500",
    },
    // Note: Vehicle search temporarily hidden per user request (restore when instructed)
    // Note: Aadhaar search temporarily hidden per user request (restore when instructed)
  ];

  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      {/* Simple Hacker Terminal Ambient Grid & Scanlines */}
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-60 z-0" />
      <div className="absolute inset-0 hacker-scanlines opacity-15 pointer-events-none z-0" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ─────────────────────────────────────────────────────────────
          TOP OF THE WEBSITE: LOGO, REFER & EARN, ADD MONEY, LOGIN/LOGOUT
      ────────────────────────────────────────────────────────────── */}
      <header className="relative z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <BrandLogo href="/" size="md" />

          {/* Top Controls: Refer & Earn, Add Money, Login / Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Refer & Earn Button */}
            <button
              type="button"
              onClick={() => setShowReferralModal(true)}
              className="px-3 sm:px-4 py-2 rounded-xl bg-violet-950/70 border border-violet-800/60 hover:border-violet-500/80 text-violet-300 hover:text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95"
            >
              <Gift className="w-3.5 h-3.5 text-violet-400" />
              <span>Refer & Earn ₹9</span>
            </button>

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

      {/* ─────────────────────────────────────────────────────────────
          CENTER: SERVICES SELECTION HUB (PHONE, VEHICLE, AADHAR, REFER)
      ────────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center justify-center space-y-10">
        {/* Main Title in Radiant Gradient Letters */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight">
            <span className="gradient-letter">Intelligence</span>{" "}
            <span className="gradient-letter-cyan">Services</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-slate-400 max-w-lg mx-auto">
            Choose a verification service below or invite friends to earn ₹9.00
          </p>
        </div>

        {/* Active Search Selection Cards */}
        <div className={`w-full ${SERVICES.length > 1 ? "grid grid-cols-1 md:grid-cols-2 max-w-4xl gap-6" : "max-w-xl"} mx-auto`}>
          {SERVICES.map((srv) => {
            const Icon = srv.icon;
            return (
              <Link
                key={srv.id}
                href={srv.href}
                className={`group relative p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between space-y-6 ${srv.borderHover} hover:scale-[1.03] active:scale-[0.99]`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${srv.iconBg} ${srv.iconColor}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${srv.badgeColor}`}>
                      {srv.accentBadge}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h2 className={`text-2xl font-black tracking-tight ${srv.titleClass}`}>
                      {srv.title}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      {srv.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <div className={`w-full py-3 px-5 rounded-2xl bg-gradient-to-r ${srv.buttonGradient} text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 group-hover:shadow-lg transition-all`}>
                    <span>{srv.buttonText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Refer & Earn Banner Card */}
        <div className="w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-violet-950/70 via-slate-900/90 to-fuchsia-950/70 border border-violet-800/50 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-900/80 border border-violet-700/60 text-violet-300 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
              <Gift className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Refer & Earn <span className="gradient-letter">₹9.00</span> per Friend
                </h3>
                <span className="text-[10px] font-mono font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                  Instant Wallet Cash
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                Friends get <strong className="text-emerald-400">₹15.00</strong> welcome credit. You receive <strong className="text-violet-300">₹9.00</strong> when they complete 2 successful searches.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowReferralModal(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-2 shrink-0 hover:scale-105 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Get Referral Code</span>
          </button>
        </div>
      </main>

      {/* Refer & Earn Modal */}
      <ReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
      />

      {/* Add Money Modal (with Live / Simulator Razorpay Integration) */}
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

            {/* Payment methods support banner */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Supports UPI (GPay/PhonePe), Cards, NetBanking</span>
              <span className="font-bold text-cyan-400 font-mono">Razorpay</span>
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
                  <span>Connecting to Gateway...</span>
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
                Please log in to your account or register to add funds and search intelligence databases.
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
