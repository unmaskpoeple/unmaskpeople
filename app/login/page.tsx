"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { loginWithFirebase } = await import("@/lib/firebase-auth-helper");
      const data = await loginWithFirebase(cleanEmail, password);

      // Enforce ADMIN role if logging in with master admin email zh@gmail.com
      if (cleanEmail === "zh@gmail.com") {
        data.user.role = "ADMIN";
      }

      login(data.user);

      if (data.user.role === "ADMIN" || cleanEmail === "zh@gmail.com") {
        toast.success("Administrator Access Granted", `Welcome back, ${data.user.name || "Admin"}`);
        router.push("/admin");
      } else {
        toast.success("Welcome Back", `Logged in as ${data.user.name}`);
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password.");
      toast.error("Authentication Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-40 z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Top Bar with Brand & Back to Home */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto relative z-10">
        <BrandLogo href="/" size="md" />

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-xl transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Store</span>
        </Link>
      </div>

      {/* Main Login Form Card */}
      <div className="w-full max-w-md mx-auto my-8 relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            <span className="text-white">Sign In to</span>{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              NumVerge OTP
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Access virtual numbers, active SMS inbox, and prepaid balance
          </p>
        </div>

        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative group">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-20 group-hover:opacity-40 blur-xl transition-opacity -z-10" />

          {errorMsg && (
            <div className="p-3.5 mb-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="subscriber@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:border-cyan-400 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{" "}
            <Link
              href="/register"
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4 relative z-10">
        © 2026 NumVerge OTP. All rights reserved. • Intermediary Communications Platform
      </footer>
    </div>
  );
}
