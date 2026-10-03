"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Share2,
  Copy,
  Check,
  Gift,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchReferralData();
    }
  }, [isOpen, user]);

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

  if (!isOpen) return null;

  const referralCode = data?.referralCode || user?.referralCode || "NUMVERGE";
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
      `Join NumVerge OTP with my invite code *${referralCode}* to get ₹15.00 FREE welcome credits! Receive instant SMS OTPs & virtual numbers: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black gradient-letter">Refer & Earn ₹9.00</h2>
              <p className="text-xs text-slate-400">
                Invite friends: they get <strong className="text-emerald-400">₹15</strong>, you get <strong className="text-cyan-400">₹9</strong> after their first OTP activation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest prompt if not logged in */}
        {!user ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 mx-auto flex items-center justify-center shadow-lg">
              <Share2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Log In to View Your Referral Code</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Every registered subscriber gets a unique referral code and link to earn ₹9.00 per referral.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/login"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25"
              >
                Sign In Now
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-200 font-bold text-xs hover:bg-slate-800"
              >
                Register (₹15 Free Credit)
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Unique Code & Link Share Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Your Unique Invite Code & Link
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Code Card */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">REFERRAL CODE</span>
                    <span className="font-mono font-black text-lg text-cyan-400 tracking-wider">
                      {referralCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* Direct Link */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="truncate mr-2">
                    <span className="text-[10px] text-slate-400 block font-semibold">INVITE LINK</span>
                    <span className="font-mono text-xs text-slate-300 truncate block">
                      {referralLink}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleShareWhatsapp}
                className="w-full py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share Invite on WhatsApp</span>
              </button>
            </div>

            {/* How It Works - Strict 4-Step Rules */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                How It Works & Reward Rules
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-black flex items-center justify-center">
                    1
                  </span>
                  <h4 className="font-bold text-white text-[11px]">Share Code</h4>
                  <p className="text-[10px] text-slate-400">Send your code or link to colleagues and friends</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 text-[10px] font-black flex items-center justify-center">
                    2
                  </span>
                  <h4 className="font-bold text-white text-[11px]">Friend Gets ₹15</h4>
                  <p className="text-[10px] text-slate-400">New user gets ₹15.00 free credit instantly upon signup</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-black flex items-center justify-center">
                    3
                  </span>
                  <h4 className="font-bold text-white text-[11px]">1 Valid Activation</h4>
                  <p className="text-[10px] text-slate-400">Friend completes a successful SMS verification (cancelled/refunded excluded)</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-black flex items-center justify-center">
                    4
                  </span>
                  <h4 className="font-bold text-emerald-400 text-[11px]">You Get ₹9.00</h4>
                  <p className="text-[10px] text-slate-400">₹9.00 is deposited directly to your prepaid wallet</p>
                </div>
              </div>
            </div>

            {/* Live Personal Statistics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invited</span>
                <span className="text-xl font-black text-white">{data?.totalReferrals ?? 0}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending (Activations)</span>
                <span className="text-xl font-black text-amber-400">{data?.pendingReferrals ?? 0}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Earned from Referrals</span>
                <span className="text-xl font-black text-emerald-400">₹{(data?.totalEarned ?? 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Referrals History List */}
            {data?.referrals && data.referrals.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Referred Friends & Progress
                </span>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {data.referrals.map((item: any) => {
                    const isDone = item.status === "COMPLETED";
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-200">{item.userName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{item.userEmailMasked}</p>
                        </div>

                        <div className="text-right">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>₹{item.rewardAmount?.toFixed(2)} Credited</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              <span>{item.successfulSearchCount} / {item.requiredSearches || 1} Orders</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
