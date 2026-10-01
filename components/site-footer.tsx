"use client";

import React from "react";
import Link from "next/link";
import { Shield, Heart, Lock } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl py-12 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <BrandLogo href="/" size="sm" />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Enterprise telecom intelligence, carrier routing diagnostics, and public records verification platform engineered with atomic wallet security and automated failure refunds.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Compliant with DPDP Act 2023 & UIDAI Guidelines</span>
            </div>
          </div>

          {/* Quick Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Verification Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/search/phone" className="hover:text-cyan-400 transition-colors">
                  Phone Number Search (+91)
                </Link>
              </li>
              {/* Vehicle RC search and Refer program removed per user request */}
            </ul>
          </div>

          {/* Compliance & Legal (Mandatory for Razorpay & RBI) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Legal & Compliance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-cyan-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-cyan-400 transition-colors">
                  Refund & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan-400 transition-colors">
                  Contact Us & Grievance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Disclaimer */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} UnMaskPeople.in. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Razorpay 256-Bit Encrypted Payments</span>
            </span>
          </div>
        </div>

        {/* Regulatory Disclaimer */}
        <p className="mt-4 text-[10px] text-slate-600 leading-normal text-center sm:text-left">
          Disclaimer: UnMaskPeople.in is an independent digital analytics SaaS platform providing routing telemetry and public registry intelligence. We do not store biometric data or sensitive Aadhaar identity records. All queries are conducted strictly in accordance with applicable Indian laws and the Digital Personal Data Protection Act 2023.
        </p>
      </div>
    </footer>
  );
}
