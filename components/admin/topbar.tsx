"use client";

import React from "react";
import Link from "next/link";
import { Shield, ShieldAlert, ArrowLeft, Sun, Moon } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";

export function AdminTopbar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 text-white transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="pl-10 md:pl-0">
          {title && <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Root Admin Authority</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-900 transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          <Link
            href="/dashboard"
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">User View</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
