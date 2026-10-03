"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Shield, Lock, EyeOff, Radio, Scale, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-40 z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" size="sm" />

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-cyan-400 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-4 mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Intermediary Safe-Harbor & Activity Logging Disclosures</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Privacy Policy &{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Compliance Disclosure
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Last updated: October 2026 • Strict compliance with Section 79 Intermediary Guidelines & DPDP Regulations
          </p>
        </div>

        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Statutory Disclaimer */}
          <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-300 text-sm">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Intermediary Disclaimer</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              "NumVerge OTP is a technology intermediary and communications aggregator. We do not endorse, promote, or tolerate the misuse of communication channels for illicit activities."
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <span>1. Mandatory User Activity Logging</span>
            </h2>
            <p>
              To maintain statutory protection under intermediary safe-harbor rules and assist cyber cell investigations in instances of suspected unlawful activity, NumVerge OTP securely records:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>Timestamps:</strong> Exact millisecond timestamps for account creation, login, order allocation, and SMS delivery.</li>
              <li><strong>IP Addresses & User-Agents:</strong> Originating IPv4/IPv6 addresses and client device headers for all wallet transactions and phone number purchases.</li>
              <li><strong>Payment References:</strong> 12-digit UPI UTR reference numbers, bank transaction IDs, and settlement records.</li>
            </ul>
            <p className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <strong>Notice on Law Enforcement Cooperation:</strong> If NumVerge OTP receives a valid legal notice, court order, or official cyber cell inquiry from law enforcement authorities, we will promptly cooperate by providing relevant connection logs, timestamps, and financial identifiers to shield the platform under intermediary safe-harbor rules.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>2. Purpose Limitation: Software Testing & Privacy</span>
            </h2>
            <p>
              The platform is engineered strictly for developer software testing, security research, and personal privacy preservation. Any attempt to utilize allocated virtual numbers for banking fraud, identity theft, financial scamming, or illegal impersonation will result in an <strong>immediate permanent ban without refund</strong>, and all associated connection telemetry will be preserved for law enforcement handoff.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              <span>3. Data Retention and Security Architecture</span>
            </h2>
            <p>
              Incoming SMS message texts and verification OTP codes are transiently held during the 20-minute activation window to allow subscriber copy-paste, after which the message text is automatically purged or hashed. Telemetry logs (IP address, UTR references) are stored in encrypted databases adhering to industry standard TLS 1.3 and AES-256 protocols.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-white">
              4. Legal & Grievance Contact
            </h2>
            <p>
              For legal inquiries, law enforcement communication, or statutory notices, please contact our designated Intermediary Grievance Officer:
            </p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
              <p><strong>Entity:</strong> NumVerge OTP Technology Intermediary</p>
              <p><strong>Compliance Officer:</strong> Legal & Cyber Compliance Desk</p>
              <p><strong>Email:</strong> legal@numverge.com / privacy@numverge.com</p>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
