"use client";

import React from "react";
import Link from "next/link";
import {
  Scale,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  Lock,
  FileText,
  Clock,
  CheckCircle2,
  Ban,
  Radio,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-600/10 via-indigo-600/5 to-transparent blur-3xl rounded-full" />
      </div>

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

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-4 mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>Binding Regulatory & User Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Terms of Service &{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Acceptable Use Policy (AUP)
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400">
            Last updated: October 2026 • Strict Enforcement of Intermediary Safe-Harbor & Cyber Safeguards
          </p>
        </div>

        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* CRITICAL INTERMEDIARY DISCLAIMER BANNER */}
          <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-300 text-sm">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Statutory Intermediary Notice & Safe Harbor Disclaimer</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              "NumVerge OTP is a technology intermediary and communications aggregator. We do not endorse, promote, or tolerate the misuse of communication channels for illicit activities."
            </p>
            <p className="text-[11px] text-slate-400">
              The Platform acts strictly as a technical conduit under Section 79 of the Information Technology Act, 2000 and international safe-harbor frameworks. We operate with zero-tolerance toward fraudulent exploitation.
            </p>
          </div>

          {/* SECTION 1: PERMISSIBLE PURPOSE */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>1. Permissible Scope of Use</span>
            </h2>
            <p>
              NumVerge OTP provides temporary telecommunication routing and SMS verification reception solely for the following legitimate purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li>
                <strong>Software & Application Testing:</strong> Developers, QA engineers, and cybersecurity researchers conducting functional automated testing of SMS delivery gateways and verification workflows.
              </li>
              <li>
                <strong>Personal Privacy Protection:</strong> Safeguarding personal telephone numbers from unsolicited telemarketing spam, public data brokers, and non-essential web forums.
              </li>
              <li>
                <strong>Legitimate Consumer Verifications:</strong> Lawful secondary account creation on supported third-party consumer web platforms.
              </li>
            </ul>
          </section>

          {/* SECTION 2: ACCEPTABLE USE POLICY & STRICT PROHIBITIONS */}
          <section className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-rose-400 flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-400" />
              <span>2. Strictly Prohibited Activities (Acceptable Use Policy)</span>
            </h2>
            <p>
              Users are strictly prohibited from using NumVerge OTP numbers for any of the following unauthorized or unlawful activities:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
                <strong className="text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Banking & Financial OTPs
                </strong>
                <p className="text-slate-400">
                  Strictly forbidden for banking portals, credit cards, payment gateways (UPI, Paytm, PhonePe, PayPal), money transfer apps, or loan platforms.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
                <strong className="text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Government & Identity Portals
                </strong>
                <p className="text-slate-400">
                  Strictly forbidden for Aadhaar, passports, tax departments (IRS/ITD), social security, public registries, or law enforcement portals.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
                <strong className="text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Fraud, Phishing & Impersonation
                </strong>
                <p className="text-slate-400">
                  Creating accounts for deceptive practices, fake profiles, identity theft, financial scamming, blackmail, or unlawful marketing campaigns.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
                <strong className="text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Botnets & Abuse
                </strong>
                <p className="text-slate-400">
                  Automated scraping, denial-of-service, mass registration for black-hat spamming, or circumventing platform security mechanisms.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: PENALTY CLAUSE */}
          <section className="space-y-3 p-5 rounded-2xl bg-rose-950/30 border border-rose-700/60">
            <h2 className="text-sm sm:text-base font-black text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>3. Zero-Tolerance Violation & Permanent Forfeiture Policy</span>
            </h2>
            <p className="text-xs text-rose-100/90 leading-relaxed font-medium">
              Any fraudulent, illegal, abusive, or unauthorized behavior detected will result in an <strong>immediate, permanent ban of the user account without prior notice</strong>, complete termination of access, and <strong>immediate forfeiture of all remaining prepaid wallet balances without eligibility for any refund</strong>.
            </p>
            <p className="text-[11px] text-slate-400">
              The Platform reserves the right to report unlawful activities, associated IP logs, and telemetry directly to the competent cyber police and statutory authorities.
            </p>
          </section>

          {/* SECTION 4: ACTIVITY LOGGING & LAW ENFORCEMENT */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              <span>4. Logging of User Activity & Regulatory Compliance</span>
            </h2>
            <p>
              In full adherence to intermediary guidelines and statutory cybersecurity mandates:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300 text-xs">
              <li>
                <strong>Technical Telemetry:</strong> We record and store client IP addresses, browser user agents, query timestamps, carrier order identifiers, and payment transaction references (including 12-digit UPI UTR numbers and gateway identifiers).
              </li>
              <li>
                <strong>Data Retention:</strong> Audit logs are preserved for compliance and fraud-prevention purposes.
              </li>
              <li>
                <strong>Cooperation with Law Enforcement:</strong> Upon receiving lawful notices, court orders, or statutory cyber cell inquiries from authorized governmental agencies, NumVerge OTP cooperates fully and furnishes relevant audit logs in accordance with intermediary safe-harbor standards.
              </li>
            </ul>
          </section>

          {/* SECTION 5: PREPAID WALLET & REFUNDS */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>5. Prepaid Wallet, Payments & Automated Refunds</span>
            </h2>
            <p>
              The Platform operates on a prepaid balance system. Wallet top-ups are completed via UPI QR code payments with mandatory 12-digit Unique Transaction Reference (UTR) verification.
            </p>
            <p>
              <strong>100% Automated Failure Guarantee:</strong> If an allocated virtual number does not receive an incoming SMS code within the 20-minute validity window, or if the order is cancelled prior to SMS arrival, the full purchase price is instantly refunded to your internal wallet balance.
            </p>
          </section>

          {/* SECTION 6: LIMITATION OF LIABILITY */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <span>6. Disclaimer & Limitation of Liability</span>
            </h2>
            <p>
              NumVerge OTP does not guarantee that third-party platforms will indefinitely maintain accounts registered using virtual numbers. Upstream carrier routing availability is subject to telecom network variations. In no event shall the Platform or its operators be liable for indirect, consequential, or third-party platform actions resulting from the user's voluntary activities.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
