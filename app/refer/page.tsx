"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Gift,
  Share2,
  Copy,
  Check,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Wallet,
  Plus,
  LogOut,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { SiteFooter } from "@/components/site-footer";

export default function ReferPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referrals");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const referralCode = data?.referralCode || user?.referralCode || "UNMASK";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${origin}/register?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success("Code Copied", `Referral code ${referralCode} copied to clipboard.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Link Copied", "Referral invitation link copied to clipboard.");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsapp = () => {
    const text = encodeURIComponent(
      `Join UnMaskPeople.in Intelligence with my invite code *${referralCode}* to get ₹15.00 FREE welcome credits! Verify phone carriers, RC vehicle records & Aadhar numbers: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-40 z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <BrandLogo href="/" size="md" />

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:text-cyan-400 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Services</span>
            </Link>

            {user ? (
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 font-bold text-xs transition-all flex items-center gap-1.5 hover:bg-rose-950/20"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Log Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-1.5"
              >
                <span>Log In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 mx-auto flex items-center justify-center mb-2 shadow-lg shadow-cyan-500/10">
            <Gift className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            <span className="gradient-letter">Refer Friends,</span>{" "}
            <span className="gradient-letter-cyan">Earn ₹9.00</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-400 max-w-lg mx-auto">
            Friends receive ₹15.00 upon signup. Once they complete 2 successful searches, you get ₹9.00 in your wallet.
          </p>
        </div>

        {!user ? (
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-4 shadow-2xl backdrop-blur-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 mx-auto flex items-center justify-center">
              <Share2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Authentication Required</h3>
              <p className="text-xs text-slate-400">
                Log in to generate and view your unique referral invite code.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5"
              >
                <span>Log In Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/register"
                className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 font-bold text-xs hover:bg-slate-800"
              >
                Create Account (₹15 Free Credit)
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Share Code & Link Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-2xl space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block tracking-wider">YOUR REFERRAL CODE</span>
                    <span className="font-mono font-black text-2xl text-cyan-400 tracking-wider">
                      {referralCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="truncate mr-3">
                    <span className="text-[10px] text-slate-400 font-bold block tracking-wider">INVITE URL</span>
                    <span className="font-mono text-xs text-slate-300 truncate block">
                      {referralLink}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleShareWhatsapp}
                className="w-full py-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share with Friends on WhatsApp</span>
              </button>
            </div>

            {/* Rules */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-black flex items-center justify-center">1</span>
                <h3 className="font-bold text-white">Share Your Link</h3>
                <p className="text-slate-400 text-[11px]">Send code or URL to your friends.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 text-xs font-black flex items-center justify-center">2</span>
                <h3 className="font-bold text-white">Friend Gets ₹15</h3>
                <p className="text-slate-400 text-[11px]">₹15 welcome bonus credited on signup.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-xs font-black flex items-center justify-center">3</span>
                <h3 className="font-bold text-white">2 Successful Searches</h3>
                <p className="text-slate-400 text-[11px]">Friend performs 2 successful lookups (Phone, RC, or UIDAI).</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-black flex items-center justify-center">4</span>
                <h3 className="font-bold text-emerald-400">You Get ₹9.00</h3>
                <p className="text-slate-400 text-[11px]">₹9.00 deposited instantly to your wallet.</p>
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center shadow-xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Referred</span>
                <span className="text-3xl font-black text-white mt-1 block">{data?.totalReferrals ?? 0}</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center shadow-xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Searches</span>
                <span className="text-3xl font-black text-amber-400 mt-1 block">{data?.pendingReferrals ?? 0}</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center shadow-xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Earned</span>
                <span className="text-3xl font-black text-emerald-400 mt-1 block">₹{(data?.totalEarned ?? 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Referred Friends List */}
            {data?.referrals && data.referrals.length > 0 && (
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                <h3 className="font-bold text-white text-sm">Your Invited Friends</h3>
                <div className="space-y-2">
                  {data.referrals.map((item: any) => {
                    const isDone = item.status === "COMPLETED";
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{item.userName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{item.userEmailMasked}</p>
                        </div>

                        <div className="text-right">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>₹{item.rewardAmount?.toFixed(2)} Credited</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-3 py-1 rounded-full">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{item.successfulSearchCount} / {item.requiredSearches || 2} Searches</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Universal Compliant Site Footer */}
      <SiteFooter />
    </div>
  );
}
