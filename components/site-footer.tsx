"use client";

import React from "react";
import Link from "next/link";
import { Shield, Lock, Radio, Zap, Heart } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-800/80 bg-[#030712]/95 backdrop-blur-xl py-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <BrandLogo href="/" size="sm" showSubtitle={false} />
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Global virtual number marketplace for SMS activation, OTP bypass, and private account verifications. Seamless integration powered by the high-availability 5SIM protocol.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Radio className="w-3.5 h-3.5" />
                150+ Countries Live
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                100% Refund Guarantee
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              OTP Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition-colors">
                  Buy Virtual Number
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-cyan-400 transition-colors">
                  My Active Orders
                </Link>
              </li>
              <li>
                <Link href="/prices" className="hover:text-cyan-400 transition-colors">
                  Live Rates & Catalog
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-cyan-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-cyan-400 transition-colors">
                  Developer API
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-cyan-400 transition-colors">
                  Terms of Service
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
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} NumVerge OTP. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Encrypted Wallet • Instant Auto-Refunds</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
