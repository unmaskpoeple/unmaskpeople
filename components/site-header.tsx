"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  Plus,
  Radio,
  Clock,
  Shield,
  LogOut,
  ChevronDown,
  Menu,
  X,
  User as UserIcon,
  Tag,
  HelpCircle,
  Smartphone,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { useAuth } from "./providers/auth-provider";
import { AddMoneyModal } from "./add-money-modal";

export function SiteHeader({ onOpenActiveDrawer }: { onOpenActiveDrawer?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Get OTP", icon: Smartphone },
    { href: "/orders", label: "My Orders", icon: Clock },
    { href: "/prices", label: "Rates & Services", icon: Tag },
    { href: "/how-it-works", label: "How It Works", icon: HelpCircle },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#030712]/90 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo - clean on mobile and desktop */}
          <div className="flex items-center gap-6 min-w-0">
            <BrandLogo size="md" />

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 shadow-sm shadow-cyan-500/10"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right: Wallet & Auth (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Active Numbers Shortcut */}
                {onOpenActiveDrawer && (
                  <button
                    onClick={onOpenActiveDrawer}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 transition"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    <span>Live Numbers</span>
                  </button>
                )}

                {/* Wallet Balance Capsule */}
                <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
                  <div className="flex items-center gap-2 px-2.5 py-1 text-xs">
                    <Wallet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-slate-400 font-medium">Balance:</span>
                    <span className="font-bold text-white tracking-wide text-sm">
                      ₹{Number(user.walletBalance ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowAddMoney(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 active:scale-95 transition"
                    title="Add Funds"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Top Up</span>
                  </button>
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#090d16] border border-slate-800 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="font-bold text-white truncate">{user.name}</p>
                        <p className="text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 border border-cyan-800 text-cyan-300">
                          {user.role}
                        </span>
                      </div>

                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition"
                      >
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>My Order History</span>
                      </Link>

                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin/gateway-settings"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 transition"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>Carrier & Pricing</span>
                        </Link>
                      )}

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition mt-1 border-t border-slate-800/60"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 active:scale-95 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right: ONLY the 3 lines hamburger menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white active:scale-95 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-cyan-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Full Dropdown Menu (Opened by 3 Lines) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/90 bg-[#060a12]/98 backdrop-blur-2xl px-4 py-4 space-y-4 animate-in slide-in-from-top-3 duration-200 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* 1. Profile & Balance (if user logged in) */}
            {user ? (
              <div className="space-y-3">
                {/* User Profile Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 border border-cyan-500/50 flex items-center justify-center font-bold text-cyan-300 text-base shrink-0">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm truncate">{user.name || "User"}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 border border-cyan-800 text-cyan-300 shrink-0">
                    {user.role}
                  </span>
                </div>

                {/* Wallet Balance Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/80 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg shadow-cyan-500/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Wallet Balance</div>
                      <div className="text-lg font-black text-white">
                        ₹{Number(user.walletBalance ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowAddMoney(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 active:scale-95 transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Top Up</span>
                  </button>
                </div>

                {/* Live Numbers Button on mobile if active numbers exist */}
                {onOpenActiveDrawer && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenActiveDrawer();
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-cyan-300"
                  >
                    <span className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                      </span>
                      <span>View Live Numbers / Received SMS</span>
                    </span>
                    <Radio className="w-4 h-4 text-cyan-400" />
                  </button>
                )}
              </div>
            ) : (
              /* User Not Logged In: Prominent Sign In & Register Buttons */
              <div className="grid grid-cols-2 gap-2.5 pb-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition text-center"
                >
                  <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/20 transition text-center"
                >
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* 2. Navigation Links */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">
                Navigation
              </div>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? "text-cyan-400 bg-cyan-950/50 border border-cyan-800/50"
                        : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* 3. Admin & Sign Out options */}
            {user && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin/gateway-settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/30 border border-amber-800/40"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Carrier & Pricing (Admin)</span>
                  </Link>
                )}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-950/40 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Add Money Modal */}
      <AddMoneyModal isOpen={showAddMoney} onClose={() => setShowAddMoney(false)} />
    </>
  );
}
