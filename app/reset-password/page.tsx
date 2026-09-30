"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { useToast } from "@/components/ui/toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Missing Token", "Reset token is missing from URL.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mismatch", "Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Weak Password", "Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      setSuccess(true);
      toast.success("Password Updated", "You can now log in with your new password.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      toast.error("Reset Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-2xl relative group">
      <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-20 group-hover:opacity-40 blur-xl transition-opacity -z-10" />

      {success ? (
        <div className="text-center space-y-3 py-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <p className="font-bold text-white text-sm">
            Password Successfully Reset!
          </p>
          <p className="text-xs text-slate-400">Redirecting to login portal...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Confirm New Password
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
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span>Update Password</span>}
          </button>
        </form>
      )}

      <div className="mt-6 pt-4 border-t border-slate-800 text-center">
        <Link
          href="/login"
          className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          Cancel and Return to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-40 z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-[128px] pointer-events-none z-0" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-cyan-500/10">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-tight">
            <span className="gradient-letter">Set New</span>{" "}
            <span className="gradient-letter-cyan">Password</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Choose a strong password containing at least 8 characters
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
