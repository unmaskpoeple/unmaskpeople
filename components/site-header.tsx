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
  User as UserIcon,
  ChevronDown,
  Layers,
  Menu,
  X,
  Code2,
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
    { href: "/", label: "Get OTP" },
    { href: "/orders", label: "My Orders" },
    { href: "/prices", label: "Rates & Services" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/api-docs", label: "API Docs" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#030712]/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
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

          {/* Right: Wallet & Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Active Numbers Shortcut */}
                {onOpenActiveDrawer && (
                  <button
                    onClick={onOpenActiveDrawer}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 transition"
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
                    <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-400 font-medium">Balance:</span>
                    <span className="font-bold text-white tracking-wide">
                      ₹{Number(user.walletBalance ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowAddMoney(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 active:scale-95 transition"
                    title="Add Funds"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Top Up</span>
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
                          href="/admin/fivesim"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 transition"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>5SIM Admin Control</span>
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

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#030712] px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-medium ${
                  pathname === link.href
                    ? "text-cyan-400 bg-cyan-950/40 border border-cyan-800/40"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Add Money Modal */}
      <AddMoneyModal isOpen={showAddMoney} onClose={() => setShowAddMoney(false)} />
    </>
  );
}
