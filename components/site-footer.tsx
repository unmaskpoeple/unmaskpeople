"use client";

import React from "react";
import Link from "next/link";
import { Shield, Lock, Radio, CheckCircle2, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-800/80 bg-[#030712] py-10 sm:py-14 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="sm:col-span-2 space-y-4">
            <BrandLogo href="/" size="sm" showSubtitle={false} />
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Global virtual number marketplace for SMS activation, OTP bypass, and private account verifications. Seamless integration powered by high-availability tier-1 telecom carrier networks.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 font-semibold text-[11px]">
                <Radio className="w-3.5 h-3.5" />
                150+ Countries Live
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-semibold text-[11px]">
                <Shield className="w-3.5 h-3.5" />
                100% Refund Guarantee
              </span>
            </div>
          </div>

          {/* Quick Navigation (No API Docs) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              OTP Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors inline-block py-0.5">
                  Buy Virtual Number
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-cyan-400 transition-colors inline-block py-0.5">
                  My Active Orders
                </Link>
              </li>
              <li>
                <Link href="/prices" className="hover:text-cyan-400 transition-colors inline-block py-0.5">
                  Live Rates & Catalog
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-cyan-400 transition-colors inline-block py-0.5">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Legal & Support
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/terms" className="hover:text-cyan-400 transition-colors inline-block py-0.5">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-cyan-400 transition-colors inline-block py-0.5">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-cyan-400 transition-colors inline-block py-0.5">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan-400 transition-colors inline-block py-0.5">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Statutory Intermediary Notice */}
        <div className="pt-2 text-left space-y-2">
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            <strong className="text-slate-300">Intermediary Disclaimer:</strong> NumVerge OTP is a technology intermediary and communications aggregator. Services are strictly intended for software development, functional QA testing, and spam prevention.
          </p>
          <p className="text-[10px] text-slate-500 leading-normal">
            Use for financial fraud, banking OTPs, government portals, or illegal activities is strictly prohibited and results in immediate permanent account termination and referral to law enforcement authorities.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 border-t border-slate-900">
          <p>© {new Date().getFullYear()} NumVerge OTP. All rights reserved.</p>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Encrypted Wallet • Instant UTR Crediting • Auto-Refunds</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
