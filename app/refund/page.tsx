"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export default function RefundPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 text-teal-400 border border-teal-800/60 text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Razorpay Compliant Policy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            <span className="gradient-letter">Refund & Cancellation</span>{" "}
            <span className="gradient-letter-cyan">Policy</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Last updated: September 2026 • Automated Failure Protection & Consumer Safeguards
          </p>
        </div>

        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-2xl space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Highlight Card */}
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200/90 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Automated Zero-Loss Failure Guarantee</span>
            </div>
            <p className="text-xs leading-relaxed">
              Subscribers never pay for failed or unreceived SMS codes. If an upstream virtual number times out without receiving an SMS verification code within the order window, our automated refund mechanism instantly restores the reserved fee back to your prepaid wallet balance within milliseconds.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              1. Overview of Billing Model
            </h2>
            <p>
              NumVerge OTP provides cloud-based virtual number and SMS verification services. All virtual numbers and SMS verification requests are billed dynamically against your user account's prepaid wallet balance in Indian Rupees (INR).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              2. Failed Orders & Instant Restorations
            </h2>
            <p>
              When a virtual number is rented for SMS verification:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>Successful Activations:</strong> When the incoming SMS OTP code is received and verified, the activation cost is finalized.</li>
              <li><strong>Cancelled / Expired Numbers:</strong> If you cancel the order before SMS arrival, or if the order times out (15-20 mins) without receiving an SMS, the order is marked as <code>CANCELED</code> or <code>TIMEOUT</code> and the reserved amount is credited back to your wallet balance automatically.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              3. UPI Top-Up Reconciliation & Disputed Transfers
            </h2>
            <p>
              If money was debited from your bank account or UPI app during a wallet top-up but failed to reflect in your NumVerge OTP wallet:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>UTR Verification:</strong> Ensure you entered the correct 12-digit UPI UTR / Reference number from your payment app (Google Pay, PhonePe, Paytm, or BHIM).</li>
              <li><strong>Manual Support Escalation:</strong> If your account has not been credited after submitting your UTR, email us at <code className="text-cyan-400">billing@numverge.com</code> with your 12-digit UPI Reference / UTR number and payment screenshot. Our team will verify the payment and credit your wallet promptly.</li>
              <li><strong>Timeline:</strong> Bank reconciliation is typically completed within <strong>2 to 4 business hours</strong>.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              4. Cancellation Policy
            </h2>
            <p>
              As NumVerge OTP is a prepaid pay-as-you-go service without recurring subscription lock-ins, there are no recurring monthly charges to cancel. You may stop using the service at any time without incurring cancellation fees.
            </p>
            <p>
              Unutilized promotional credits (such as the ₹15.00 welcome bonus or referral bonuses) have no cash value and cannot be withdrawn to external bank accounts.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-white">
              5. How to File a Dispute or Refund Request
            </h2>
            <p>
              To report any billing discrepancies or request manual assistance, please contact:
            </p>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
              <p><strong>Department:</strong> Billing & Payments Redressal, NumVerge OTP</p>
              <p><strong>Email:</strong> billing@numverge.com</p>
              <p><strong>Average Response Time:</strong> Within 12-24 hours</p>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
