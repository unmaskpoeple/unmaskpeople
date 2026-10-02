"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Cpu,
  BadgeDollarSign,
  Activity,
  FileCheck2,
  Settings,
  Shield,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Share2,
  QrCode,
  Mail,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { BrandLogo } from "@/components/brand-logo";

const ADMIN_NAV = [
  { name: "Overview & Analytics", href: "/admin", icon: LayoutDashboard },
  { name: "Referral Program", href: "/admin/referrals", icon: Share2 },
  { name: "UPI Gateway & Deposits", href: "/admin/gateway", icon: QrCode },
  { name: "Email & SMTP", href: "/admin/email", icon: Mail },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "API Configuration", href: "/admin/apis", icon: Cpu },
  { name: "Pricing & Rate Limits", href: "/admin/pricing", icon: BadgeDollarSign },
  { name: "Operational API Logs", href: "/admin/logs", icon: Activity },
  { name: "Audit Trail & Security", href: "/admin/audits", icon: FileCheck2 },
  { name: "Platform Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 border-r border-slate-800 w-64 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <BrandLogo href="/admin" size="sm" adminVariant subtitle="Admin Console" />
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {ADMIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Shortcut to switch back to user application */}
        <div className="pt-4 mt-4 border-t border-slate-800/80">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Subscriber App</span>
          </Link>
        </div>
      </nav>

      {/* Admin Profile Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/70">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-violet-500/30">
              AD
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || "Admin"}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Admin Console</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-64 flex-shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-xs h-full animate-slide-up">
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 shadow-md"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}
