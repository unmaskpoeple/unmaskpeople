"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, ShieldCheck, FileText, Scale } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 text-xs font-bold">
            <Scale className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            <span className="gradient-letter">Terms and</span>{" "}
            <span className="gradient-letter-cyan">Conditions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Last updated: September 2026 • Effective immediately across all UnMaskPeople.in digital services
          </p>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-2xl space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, registering with, or utilizing the services provided by <strong>UnMaskPeople.in</strong> ("Platform", "we", "us", or "our"), you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, you must discontinue using our services immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              2. Scope of Services & Informational Nature
            </h2>
            <p>
              UnMaskPeople.in provides an enterprise SaaS lookup platform designed to assist developers, organizations, and verified individuals in retrieving technical carrier routing telemetry (HLR/MNP), public vehicle registry data (Vahan/RC), and cryptographic identity status checks.
            </p>
            <p>
              All queries are aggregated through authorized telecom carriers, public data registries, and compliant third-party gateways. UnMaskPeople.in acts solely as an intermediary data routing platform and does not maintain secret or unauthorized surveillance records.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              3. Permissible & Prohibited Use
            </h2>
            <p>
              You represent and warrant that you will use UnMaskPeople.in only for lawful purposes in compliance with all applicable Indian and international laws, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>You shall not use the service for stalking, harassment, intimidation, or unauthorized tracking.</li>
              <li>You shall not attempt to reverse-engineer, decompile, or launch automated scraping botnets against the Platform.</li>
              <li>You shall not submit queries relating to minors or prohibited government personnel.</li>
              <li>Violation of these restrictions will result in immediate termination of the user account and forfeiture of wallet balances.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              4. Prepaid Wallet & Payment Processing
            </h2>
            <p>
              UnMaskPeople.in operates on an atomic prepaid wallet model. Subscribers top up funds through our authorized payment aggregator, <strong>Razorpay</strong>, using UPI, Credit/Debit Cards, or NetBanking.
            </p>
            <p>
              Usage charges are deducted on a per-query basis upon successful execution. In the event an upstream provider fails to resolve a query, our automated failure refund mechanism instantly credits the reserved amount back to your prepaid wallet balance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              5. Limitation of Liability
            </h2>
            <p>
              While UnMaskPeople.in strives for 99.9% uptime and high accuracy, services are provided on an "as is" and "as available" basis. To the maximum extent permitted by Indian law, UnMaskPeople.in and its operators shall not be liable for indirect, incidental, or consequential damages resulting from upstream carrier network delays, telecom downtime, or incorrect external registry entries.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              6. Governing Law & Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-white">
              7. Contact Information
            </h2>
            <p>
              For legal inquiries, dispute resolution, or contractual questions, please reach out to our legal department at <code className="text-cyan-400">legal@unmaskpeople.in</code> or visit our <Link href="/contact" className="text-cyan-400 hover:underline">Contact Page</Link>.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
