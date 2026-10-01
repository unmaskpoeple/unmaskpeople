"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Send,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { BrandLogo } from "@/components/brand-logo";

function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Verification Pending State
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [simulatedUrl, setSimulatedUrl] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const { registerWithFirebase } = await import("@/lib/firebase-auth-helper");
      const data = await registerWithFirebase(name.trim(), email.trim(), password);

      login(data.user);
      if (data.user.role === "ADMIN") {
        toast.success("Master Admin Account Ready", "Welcome to UnMaskPeople.in Administrator Console.");
        router.push("/admin");
      } else {
        toast.success(
          "Account Created Successfully!",
          "Welcome to UnMaskPeople.in."
        );
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed.");
      toast.error("Registration Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend activation link.");

      if (data.simulatedActivationUrl) {
        setSimulatedUrl(data.simulatedActivationUrl);
      }
      toast.success("Link Resent", `Fresh activation email sent to ${registeredEmail}`);
    } catch (err: any) {
      toast.error("Resend Error", err.message);
    } finally {
      setResending(false);
    }
  };

  // If waiting for email activation
  if (verificationPending) {
    return (
      <div className="w-full max-w-md mx-auto my-8 relative z-10 space-y-6">
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-3xl bg-cyan-500/20 animate-ping opacity-40" />
            <div className="w-20 h-20 rounded-3xl bg-cyan-950/90 border border-cyan-800/80 text-cyan-400 mx-auto flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <Mail className="w-9 h-9" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black gradient-letter">Check Your Email</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              We have sent a secure activation link to:
              <br />
              <strong className="text-cyan-400 font-mono text-sm block mt-1">{registeredEmail}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 text-left flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0">
              ₹
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">₹15.00 Welcome Credit Waiting</p>
              <p className="text-emerald-400/80 text-[11px]">Click the link in your email to activate and claim.</p>
            </div>
          </div>

          {/* Sandbox Development One-Click Button */}
          {simulatedUrl && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-900/40 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>One-Click Test Activation</span>
              </div>
              <p className="text-[11px] text-slate-400">
                SMTP simulator detected this link. Click below to verify instantly in your browser:
              </p>
              <Link
                href={simulatedUrl}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all mt-1"
              >
                <span>Activate Account Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              type="button"
              disabled={resending}
              onClick={handleResend}
              className="w-full py-3 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Resending Activation Link...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Resend Activation Email</span>
                </>
              )}
            </button>

            <Link
              href="/login"
              className="block text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              Already activated? Proceed to Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto my-8 relative z-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 text-xs font-bold mb-1 shadow-lg shadow-cyan-500/10">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Fast & Secure Registration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
          <span className="gradient-letter">Create Your</span>{" "}
          <span className="gradient-letter-cyan">Account</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Start verifying phone numbers, vehicles, and identity records
        </p>
      </div>

      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative group">
        <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-20 group-hover:opacity-40 blur-xl transition-opacity -z-10" />

        <form onSubmit={handleRegister} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Aarav Sharma"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

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
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:border-cyan-400 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password (min 8 characters)
            </label>
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

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link
            href="/login"
            className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
          >
            Log in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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

      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto my-8 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>

      <footer className="text-center text-xs text-slate-500 py-4 relative z-10">
        © 2026 UnMaskPeople.in. All rights reserved.
      </footer>
    </div>
  );
}
