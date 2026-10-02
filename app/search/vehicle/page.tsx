"use client";

import React, { useState } from "react";
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
  Car,
  CheckCircle2,
  ShieldCheck,
  Gift,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { ResponseViewer } from "@/components/response-viewer";
import { ReferralModal } from "@/components/referral-modal";
import { SiteFooter } from "@/components/site-footer";
import { AddMoneyModal } from "@/components/add-money-modal";

export default function VehicleSearchPage() {
  const { user, logout, updateBalanceLocally } = useAuth();
  const { toast } = useToast();

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState("");

  // Add Money Modal State
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);

  // Referral Modal State
  const [showReferralModal, setShowReferralModal] = useState(false);

  // Login Prompt Modal State
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setSearchResult(null);

    const cleaned = vehicleNumber.trim().toUpperCase().replace(/[\s-]/g, "");
    if (!cleaned) {
      setSearchError("Please enter a vehicle registration number.");
      return;
    }

    if (cleaned.length < 6 || cleaned.length > 13) {
      setSearchError("Please enter a valid vehicle number (e.g. MH 12 AB 1234).");
      return;
    }

    if (!user) {
      setPromptMessage("Please log in to search vehicle registration and RC details.");
      setShowLoginPrompt(true);
      return;
    }

    if (user.walletBalance < 5.0) {
      setSearchError(`Insufficient balance (₹${user.walletBalance.toFixed(2)}). ₹5.00 required for Vehicle RC search. Please click 'Add Money' at the top.`);
      toast.warning("Low Balance", "Please top up your wallet to continue searching.");
      return;
    }

    setSearching(true);
    try {
      const res = await fetch("/api/vehicle/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleNumber: cleaned }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Vehicle lookup failed.");
      }

      setSearchResult(data);
      if (typeof data.walletBalance === "number") {
        updateBalanceLocally(data.walletBalance);
      }

      toast.success("RC Verified", "Vehicle registration intelligence resolved successfully.");
    } catch (err: any) {
      setSearchError(err.message || "Failed to search vehicle.");
      toast.error("Search Error", err.message);
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

  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-60 z-0" />
      <div className="absolute inset-0 hacker-scanlines opacity-15 pointer-events-none z-0" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <BrandLogo href="/" size="md" />

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Refer & Earn button */}
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
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
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

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center justify-start space-y-8">
        <div className="w-full flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Services</span>
          </Link>
          <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-full">
            Cost: ₹5.00 / query
          </span>
        </div>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/60 text-amber-400 mx-auto flex items-center justify-center mb-2 shadow-lg shadow-amber-500/10">
            <Car className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            <span className="gradient-letter-amber">Search Vehicle</span>{" "}
            <span className="gradient-letter">Number</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-400 max-w-md mx-auto">
            Instant RC verification, ownership category, fitness validity, and RTO data
          </p>
        </div>

        {/* Vehicle Search Box */}
        <div className="w-full max-w-2xl relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-500 opacity-25 group-focus-within:opacity-75 blur-xl transition-opacity duration-300 -z-10" />

          <form
            onSubmit={handleSearch}
            className="w-full bg-slate-900/90 border border-slate-700/80 focus-within:border-amber-400/80 rounded-2xl shadow-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 backdrop-blur-2xl transition-all"
          >
            <div className="px-3 py-2 shrink-0 flex items-center gap-2 border-b sm:border-b-0 sm:border-r border-slate-800">
              <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-1 rounded-md">
                IND 🇮🇳
              </span>
            </div>

            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => {
                  setVehicleNumber(e.target.value.toUpperCase());
                  setSearchError("");
                }}
                placeholder="MH 12 AB 1234 or DL 01 AB 9988"
                className="w-full bg-transparent px-3 py-2 font-mono font-bold text-base sm:text-lg text-white placeholder:text-slate-500 outline-none uppercase tracking-wider"
                autoFocus
              />
              {vehicleNumber && (
                <button
                  type="button"
                  onClick={() => setVehicleNumber("")}
                  className="p-1 rounded-full text-slate-500 hover:text-slate-300 mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={searching}
              className="py-3 px-7 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-white font-black text-sm shadow-lg shadow-orange-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02] active:scale-[0.98]"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying RC...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-white" />
                  <span>Verify RC</span>
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

        {/* Results Card */}
        {searchResult && (
          <div className="w-full max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-400">RC Verification Summary</span>
                <span className="font-mono text-xs font-bold text-slate-200 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800">
                  {searchResult.number}
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
              phone={searchResult.number}
              apiUsed="National Vahan RTO Registry"
              latencyMs={searchResult.latencyMs}
              amountCharged={searchResult.amountCharged}
              isRefunded={false}
              message={searchResult.message}
              data={searchResult.data}
              raw={searchResult.raw}
            />
          </div>
        )}
      </main>

      {/* Add Money Modal (Manual UPI QR & UTR) */}
      <AddMoneyModal
        isOpen={showAddMoneyModal}
        onClose={() => setShowAddMoneyModal(false)}
        onBalanceUpdated={updateBalanceLocally}
        userEmail={user?.email}
        userName={user?.name}
      />

      {/* Guest Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/60 text-amber-400 mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-lg gradient-letter">Authentication Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {promptMessage || "Please log in to your account to verify vehicle registration records."}
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-1.5"
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

      {/* Referral Program Modal */}
      <ReferralModal isOpen={showReferralModal} onClose={() => setShowReferralModal(false)} />

      {/* Universal Compliant Site Footer */}
      <SiteFooter />
    </div>
  );
}
