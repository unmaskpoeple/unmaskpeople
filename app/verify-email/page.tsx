"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  ArrowRight,
  ShieldCheck,
  Send,
  Lock,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { login, refreshUser } = useAuth();
  const { toast } = useToast();

  const [status, setStatus] = useState<"IDLE" | "VERIFYING" | "SUCCESS" | "ERROR">(
    token ? "VERIFYING" : "IDLE"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(3);

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [simulatedUrl, setSimulatedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (tok: string) => {
    setStatus("VERIFYING");
    setErrorMessage("");

    try {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(tok)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed. Link may have expired.");
      }

      setStatus("SUCCESS");
      toast.success("Account Activated", "Your email has been verified and ₹15.00 credit is ready!");

      if (data.user) {
        login(data.user);
      } else {
        await refreshUser();
      }

      // Auto redirect countdown
      let count = 3;
      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          router.push("/");
        }
      }, 1000);
    } catch (err: any) {
      setStatus("ERROR");
      setErrorMessage(err.message || "Failed to verify email. Please request a new activation link.");
      toast.error("Verification Failed", err.message);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || !resendEmail.includes("@")) {
      toast.error("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setResending(true);
    setResendSuccess(false);
    setSimulatedUrl(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send activation email.");

      setResendSuccess(true);
      if (data.simulatedActivationUrl) {
        setSimulatedUrl(data.simulatedActivationUrl);
      }
      toast.success("Link Sent", data.message || "Activation link sent to your inbox!");
    } catch (err: any) {
      toast.error("Error", err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* VERIFYING STATE */}
      {status === "VERIFYING" && (
        <div className="text-center py-8 space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10">
              <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black gradient-letter">Activating Account</h2>
            <p className="text-xs text-slate-400">
              Verifying cryptographic activation token and unlocking your ₹15.00 welcome bonus...
            </p>
          </div>
        </div>
      )}

      {/* SUCCESS STATE */}
      {status === "SUCCESS" && (
        <div className="text-center py-6 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black gradient-letter">Account Verified!</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your email address has been confirmed and your NumVerge OTP account is officially active.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 text-left flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-black">
              ₹
            </div>
            <div>
              <p className="text-xs font-bold text-white">₹15.00 Welcome Credit Active</p>
              <p className="text-[11px] text-emerald-400/80">Available now for virtual numbers and SMS verification.</p>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href="/"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Go to Home ({countdown}s)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {status === "ERROR" && (
        <div className="py-4 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-800/80 text-rose-400 mx-auto flex items-center justify-center shadow-xl shadow-rose-500/20">
              <XCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-rose-400">Activation Link Invalid or Expired</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {errorMessage || "The activation link has expired or has already been used. Please request a new one below."}
              </p>
            </div>
          </div>

          <form onSubmit={handleResend} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Your Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs placeholder:text-slate-600 focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={resending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Link...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Fresh Activation Link</span>
                </>
              )}
            </button>
          </form>

          {/* Dev Mode Simulator preview */}
          {simulatedUrl && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs space-y-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sandbox Test Link (SMTP not configured)</span>
              </span>
              <a
                href={simulatedUrl}
                className="text-[11px] font-mono text-cyan-400 hover:underline break-all block bg-slate-950/80 p-2 rounded-lg border border-slate-800"
              >
                {simulatedUrl}
              </a>
            </div>
          )}

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors">
              Return to Login
            </Link>
          </div>
        </div>
      )}

      {/* IDLE STATE (No token provided) */}
      {status === "IDLE" && (
        <div className="py-4 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 mx-auto flex items-center justify-center shadow-xl shadow-cyan-500/10">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black gradient-letter">Resend Activation Link</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Didn't receive your account activation link or need a new one? Enter your email address to resend.
              </p>
            </div>
          </div>

          <form onSubmit={handleResend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs placeholder:text-slate-600 focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={resending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {resending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Activation Link</span>
                </>
              )}
            </button>
          </form>

          {/* Dev Mode Simulator preview */}
          {simulatedUrl && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs space-y-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sandbox Test Link (SMTP not configured)</span>
              </span>
              <a
                href={simulatedUrl}
                className="text-[11px] font-mono text-cyan-400 hover:underline break-all block bg-slate-950/80 p-2 rounded-lg border border-slate-800"
              >
                {simulatedUrl}
              </a>
            </div>
          )}

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors">
              Already verified? Log in here
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-40 z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Simple Header */}
      <header className="relative z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <BrandLogo href="/" size="md" />

          <Link
            href="/login"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Log In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content with Suspense */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-10">
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto p-12 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl text-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
              <p className="text-xs text-slate-400">Loading activation credentials...</p>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </main>

      <footer className="relative z-10 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© 2026 NumVerge OTP Verification Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
