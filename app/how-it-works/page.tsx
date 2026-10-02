"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      <SiteHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete User Guide</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            How NumVerge OTP Works
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Everything you need to know about receiving SMS verification codes safely, quickly, and with a guaranteed 100% refund on unreceived messages.
          </p>
        </div>

        {/* 3 Steps Detailed */}
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-500/40">
                1
              </span>
              <h3 className="text-lg font-bold text-white">Select Your Desired Service & Country</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-11">
              On our homepage or catalog, search for the service you want to register (e.g., Telegram, WhatsApp, ChatGPT, Instagram). Choose the country you prefer. You can also pick a specific operator or leave it on <strong>Any Operator</strong> for maximum delivery probability.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/40">
                2
              </span>
              <h3 className="text-lg font-bold text-white">Paste the Number & Request Verification</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-11">
              Once purchased, the number is displayed with an instant <strong>Copy Number</strong> button. Paste it into the registration page of the app. Ensure you select the correct international dialing prefix in the app (e.g., +1 for USA, +44 for UK, +91 for India).
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/40">
                3
              </span>
              <h3 className="text-lg font-bold text-white">Instant OTP Display & 100% Auto-Refund</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed pl-11">
              Our automated system listens for incoming SMS traffic. As soon as the platform transmits the SMS, the OTP code is displayed on your screen. If the SMS does not arrive within the 20-minute window, or if you click <strong>Cancel & Refund</strong>, 100% of the cost is automatically refunded back to your wallet balance.
            </p>
          </div>
        </div>

        {/* Pro Tips for Successful Registration */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Pro Tips for Reliable Account Creation</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-[#030712]/80 border border-slate-800 space-y-1">
              <strong className="text-white">Match Country with IP:</strong>
              <p className="text-slate-400 leading-relaxed">
                If you are registering an American number, use a clean US proxy or VPN so the platform doesn't flag location mismatches.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#030712]/80 border border-slate-800 space-y-1">
              <strong className="text-white">Clean Browser Environment:</strong>
              <p className="text-slate-400 leading-relaxed">
                Use an Incognito window or multi-login profile (like AdsPower/Dolphin) to prevent browser fingerprint tracking.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#030712]/80 border border-slate-800 space-y-1">
              <strong className="text-white">Instant Reselection:</strong>
              <p className="text-slate-400 leading-relaxed">
                If WhatsApp or Telegram says "This number is banned", immediately click <strong>Cancel & Refund</strong>, and grab another number for free!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#030712]/80 border border-slate-800 space-y-1">
              <strong className="text-white">Repeat SMS Window:</strong>
              <p className="text-slate-400 leading-relaxed">
                Need a second code for the same registration? You can receive multiple SMS messages for the same service within the 20-minute validity.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 active:scale-95 transition"
          >
            <span>Start Buying Numbers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
