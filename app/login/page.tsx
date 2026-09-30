"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("demo@unmaskpeople.in");
  const [password, setPassword] = useState("UserPassword123!");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [simulatedUrl, setSimulatedUrl] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setUnverifiedEmail(null);
    setSimulatedUrl(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes("EMAIL_NOT_VERIFIED")) {
          setUnverifiedEmail(email.trim());
        }
        throw new Error(data.error?.replace("EMAIL_NOT_VERIFIED: ", "") || "Login failed.");
      }

      login(data.user);
      toast.success("Welcome Back", `Logged in as ${data.user.name}`);

      // If admin logging in via user portal, redirect to admin, else to home
      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password.");
      toast.error("Authentication Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendActivation = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend activation link.");

      if (data.simulatedActivationUrl) {
        setSimulatedUrl(data.simulatedActivationUrl);
      }
      toast.success("Link Sent", `Fresh activation email sent to ${unverifiedEmail}`);
    } catch (err: any) {
      toast.error("Resend Error", err.message);
    } finally {
      setResending(false);
    }
  };

  const handleUseDemoCreds = (type: "user" | "admin") => {
    if (type === "user") {
      setEmail("demo@unmaskpeople.in");
      setPassword("UserPassword123!");
    } else {
      setEmail("admin@unmaskpeople.in");
      setPassword("AdminPassword123!");
    }
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-40 z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Top Bar with Brand & Back to Home */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto relative z-10">
        <BrandLogo href="/" size="md" />

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-xl transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Login Form Card */}
      <div className="w-full max-w-md mx-auto my-8 relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            <span className="gradient-letter">Sign In to</span>{" "}
            <span className="gradient-letter-cyan">UnMaskPeople.in</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Access verification services and prepaid wallet
          </p>
        </div>

        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative group">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-20 group-hover:opacity-40 blur-xl transition-opacity -z-10" />

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            {unverifiedEmail && (
              <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-800/80 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">Account Activation Required</span>
                  <span className="text-[10px] bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded-full font-mono">Unverified</span>
                </div>
                <p className="text-[11px] text-amber-200/80">
                  Did not receive the activation email sent to <strong>{unverifiedEmail}</strong>?
                </p>
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendActivation}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Email...</span>
                    </>
                  ) : (
                    <span>Resend Activation Link</span>
                  )}
                </button>

                {simulatedUrl && (
                  <div className="pt-1 border-t border-amber-800/60">
                    <p className="text-[10px] text-slate-400 mb-1">Sandbox Test Link:</p>
                    <Link
                      href={simulatedUrl}
                      className="text-[11px] font-mono text-cyan-400 hover:underline break-all block bg-slate-950/80 p-2 rounded-lg border border-slate-800"
                    >
                      {simulatedUrl}
                    </Link>
                  </div>
                )}
              </div>
            )}

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
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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

          {/* Quick 1-Click Credentials Tester */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Quick Test Credentials
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleUseDemoCreds("user")}
                className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-300 font-medium transition-colors text-center"
              >
                Demo Subscriber
              </button>
              <button
                type="button"
                onClick={() => handleUseDemoCreds("admin")}
                className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-300 font-medium transition-colors text-center"
              >
                Root Admin
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-400">
            Don't have an account yet?{" "}
            <Link
              href="/register"
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
            >
              Register with ₹50 credit
            </Link>
          </div>
        </div>

        {/* Link to Dedicated Admin Login */}
        <div className="text-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Switch to Secure Administrator Login Portal</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4 relative z-10">
        © 2026 UnMaskPeople.in. All rights reserved.
      </footer>
    </div>
  );
}
