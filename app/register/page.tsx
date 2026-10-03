"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
        toast.success("Administrator Account Ready", "Welcome to NumVerge OTP Console.");
        router.push("/admin");
      } else {
        toast.success(
          "Account Created Successfully!",
          "Welcome to NumVerge OTP. Your account is active."
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

  const handleGoogleSignup = async () => {
    setErrorMsg("");
    setGoogleLoading(true);
    try {
      const { loginWithGoogle } = await import("@/lib/firebase-auth-helper");
      const data = await loginWithGoogle();

      login(data.user);
      toast.success("Welcome!", `Account ready for ${data.user.name}`);

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMsg(err.message || "Failed to sign up with Google.");
        toast.error("Google Sign-Up Error", err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-8 relative z-10 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
          <span className="text-white">Join</span>{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            NumVerge OTP
          </span>
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Get high-availability virtual numbers for SMS verifications
        </p>
      </div>

      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative group">
        <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-20 group-hover:opacity-40 blur-xl transition-opacity -z-10" />

        {errorMsg && (
          <div className="p-3.5 mb-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* 1-Click Firebase Google Sign-Up */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-700/80 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md hover:border-slate-600 disabled:opacity-50"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-800" />
          <span className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Or register with email
          </span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
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
                placeholder="e.g. Alex Morgan"
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
                placeholder="you@domain.com"
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

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-cyan-400 underline hover:text-cyan-300">
                Terms & Acceptable Use Policy
              </Link>
              . Fraudulent misuse leads to immediate forfeiture.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creating Firebase Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
          >
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-40 z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Top Bar with Brand & Back to Store */}
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

      <Suspense fallback={<div className="text-center py-20 text-slate-500">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4 relative z-10">
        © 2026 NumVerge OTP. All rights reserved. • Licensed Technology Intermediary
      </footer>
    </div>
  );
}
