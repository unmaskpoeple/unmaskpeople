"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { SiteFooter } from "@/components/site-footer";
import { BrandLogo } from "@/components/brand-logo";
import { AddMoneyModal } from "@/components/add-money-modal";

export default function ServicesHubPage() {
  const { user, logout, updateBalanceLocally } = useAuth();
  const { toast } = useToast();

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

  // Add Money Modal State
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);

  // Guest Prompt Modal
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleAddMoneyClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setShowAddMoneyModal(true);
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
      accentBadge: `Cost: ₹${phoneCost.toFixed(2)} / query`,
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

          {/* Top Controls: Add Money, Login / Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-1 sm:p-1.5 shadow-inner">
                <div className="px-2 sm:px-3 py-1 text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-emerald-400">₹{user.walletBalance.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddMoneyClick}
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Money</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddMoneyClick}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Money</span>
              </button>
            )}

            {user ? (
              <button
                type="button"
                onClick={logout}
                className="p-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 font-bold text-xs transition-all flex items-center gap-1.5 hover:bg-rose-950/20 shrink-0"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
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
            Instant carrier routing diagnostics, telecom circle identification, and live HLR status
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
