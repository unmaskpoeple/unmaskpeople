"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, Shield, Lock, EyeOff, UserCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-40 z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <BrandLogo href="/" size="md" />

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="space-y-4 mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>DPDP Act 2023 Compliant</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            <span className="gradient-letter">Privacy</span>{" "}
            <span className="gradient-letter-cyan">Policy</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Last updated: September 2026 • Engineered for strict cryptographic data privacy and zero sensitive data retention
          </p>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-2xl space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              1. Overview & Commitment to Privacy
            </h2>
            <p>
              At <strong>UnMaskPeople.in</strong>, we take the confidentiality and privacy of our subscribers with paramount seriousness. This Privacy Policy details our practices regarding information collection, zero-retention architecture, and strict adherence to India’s <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              2. Special Aadhaar & Identity Data Protection Clause
            </h2>
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200/90 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-400 text-xs">
                <Lock className="w-4 h-4" />
                <span>Zero Storage of Raw Aadhaar Credentials</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                In compliance with the Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016 and UIDAI circulars, UnMaskPeople.in <strong>never stores, caches, or logs 12-digit Aadhaar numbers, biometric information, or physical identity card images</strong>. Queries are processed in transient memory to verify mathematical format, age band, and state distribution, after which all sensitive identifiers are immediately purged.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              3. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>Account Credentials:</strong> Name, work email address, and cryptographically hashed passwords (Bcrypt with salt rounds).</li>
              <li><strong>Billing & Wallet Data:</strong> Razorpay transaction IDs, top-up receipts, and atomic wallet ledgers. We do not store raw credit/debit card numbers or UPI MPINs.</li>
              <li><strong>Operational Logs:</strong> Timestamps, response latency, and masked carrier query logs used strictly for audit integrity and automated refund processing.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              4. Cryptographic Security Standards
            </h2>
            <p>
              We implement industry-leading technical measures to safeguard all telemetry data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>In-Transit Encryption:</strong> All data transmissions are encrypted using Transport Layer Security (TLS 1.3).</li>
              <li><strong>At-Rest Encryption:</strong> Database credentials and external provider API tokens are protected via AES-256-GCM authenticated encryption.</li>
              <li><strong>Secret Masking:</strong> Sensitive identifiers in administrative dashboards are dynamically masked (e.g. <code className="text-cyan-400 font-mono">••••••••1234</code>).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              5. Your Rights Under DPDP Act 2023
            </h2>
            <p>
              As a data principal under Indian law, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>Request a summary of personal data processed by the Platform.</li>
              <li>Request correction, completion, or updating of your account records.</li>
              <li>Request account closure and permanent erasure of your personal data.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-white">
              6. Grievance Redressal Officer
            </h2>
            <p>
              In accordance with the Information Technology Rules, 2021, the designated Grievance Officer for UnMaskPeople.in is:
            </p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
              <p><strong>Name:</strong> Grievance Redressal Officer, UnMaskPeople.in</p>
              <p><strong>Email:</strong> privacy@unmaskpeople.in</p>
              <p><strong>Turnaround Time:</strong> Acknowledgment within 24 hours; resolution within 15 days.</p>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
