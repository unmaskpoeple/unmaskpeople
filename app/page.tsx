"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Clock,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OtpMarketplace } from "@/components/otp-marketplace";

export default function HomePage() {
  const FAQS = [
    {
      q: "How does the SMS verification work?",
      a: "Select your desired app (Telegram, WhatsApp, ChatGPT, etc.) and country. We allocate a fresh, non-VoIP virtual phone number. Copy the number and enter it in the app. As soon as the app sends an SMS, the OTP code is displayed on your screen automatically.",
    },
    {
      q: "What happens if I don't receive an SMS code?",
      a: "You are 100% protected. If the SMS does not arrive within the 20-minute window, or if you cancel the number beforehand, our system automatically refunds 100% of the cost directly back to your wallet. You only pay for codes you actually receive.",
    },
    {
      q: "Can I use the number more than once?",
      a: "Each standard activation number is dedicated to you for a single service verification window (20 minutes). You can receive repeat SMS codes for the same service within this window free of charge.",
    },
    {
      q: "Which countries and services are supported?",
      a: "We support over 150 countries including the United States, United Kingdom, India, Canada, Germany, Indonesia, Brazil, and over 1,300 services including OpenAI, Telegram, WhatsApp, TikTok, Discord, Google, Steam, and Twitter/X.",
    },
    {
      q: "How do I top up my wallet balance?",
      a: "Click 'Top Up' in the header. We accept instant UPI, QR codes, and digital payments. Funds are credited to your balance instantly.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-600/10 via-indigo-600/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-t from-indigo-900/10 to-transparent blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <SiteHeader />

        {/* Main Interactive Marketplace Area */}
        <main className="flex-1 pb-16">
          <OtpMarketplace />

          {/* 3 STEPS WALKTHROUGH */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Simple & Seamless
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                How It Works in 3 Quick Steps
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Get your accounts verified in under 60 seconds with zero technical setup.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-400 text-lg">
                  1
                </div>
                <h3 className="text-lg font-bold text-white">Pick Service & Country</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Choose from 1,320+ services like Telegram, WhatsApp, ChatGPT, or Google, and select from 150+ countries. Click <strong>Get Number</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-400 text-lg">
                  2
                </div>
                <h3 className="text-lg font-bold text-white">Paste Number into App</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Copy your newly allocated private virtual number and enter it in the app's phone verification screen. Click request SMS.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl relative overflow-hidden space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-lg">
                  3
                </div>
                <h3 className="text-lg font-bold text-white">Instant OTP Code</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our system detects the incoming SMS in real time. Copy the verification code with 1 click. If no SMS arrives, you are 100% refunded!
                </p>
              </div>
            </div>
          </section>

          {/* WHY CHOOSE NUMVERGE */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900/90 to-[#030712] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>The Premier OTP Verification Experience</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    Engineered for Speed, Reliability, and Zero Waste.
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Unlike unreliable free burner numbers that are banned or shared across thousands of users, NumVerge allocates dedicated, real-carrier virtual SIMs directly through high-capacity telecom channels.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-300">
                        <strong className="text-white">Automated Zero-Risk Guarantee:</strong> If the service rejects the number or the SMS delays past 20 minutes, your wallet is immediately refunded.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-300">
                        <strong className="text-white">Strict Privacy & Anonymity:</strong> No identity verification (KYC) required. Keep your personal telephone number safe from spam and data brokers.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-300">
                        <strong className="text-white">Developer Friendly API:</strong> Scale up and automate verification workflows with our REST API.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Visual Stats Box */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-[#030712]/90 border border-slate-800 space-y-2">
                    <Zap className="w-6 h-6 text-cyan-400" />
                    <div className="text-2xl font-black text-white">&lt; 10s</div>
                    <div className="text-xs text-slate-400">Average SMS Delivery Latency</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-[#030712]/90 border border-slate-800 space-y-2">
                    <RotateCcw className="w-6 h-6 text-emerald-400" />
                    <div className="text-2xl font-black text-white">100%</div>
                    <div className="text-xs text-slate-400">Auto-Refund on Unreceived SMS</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-[#030712]/90 border border-slate-800 space-y-2">
                    <Globe2 className="w-6 h-6 text-indigo-400" />
                    <div className="text-2xl font-black text-white">150+</div>
                    <div className="text-xs text-slate-400">Worldwide Countries & Carrier Nodes</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-[#030712]/90 border border-slate-800 space-y-2">
                    <Lock className="w-6 h-6 text-amber-400" />
                    <div className="text-2xl font-black text-white">256-Bit</div>
                    <div className="text-xs text-slate-400">Encrypted Wallet Security</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FREQUENTLY ASKED QUESTIONS */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Got Questions?
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2"
                >
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <SiteFooter />
      </div>
    </div>
  );
}
