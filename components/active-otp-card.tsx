"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Copy,
  Check,
  Clock,
  ShieldCheck,
  AlertCircle,
  X,
  RotateCw,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { useToast } from "./ui/toast";
import { useAuth } from "./providers/auth-provider";

export interface ActiveOtpOrder {
  id: string;
  fiveSimId: number;
  phone: string;
  service: string;
  serviceName: string;
  country: string;
  countryName: string;
  operator: string;
  cost: number;
  costUsd?: number;
  status: "PENDING" | "RECEIVED" | "FINISHED" | "CANCELED" | "TIMEOUT" | "BANNED";
  expiresAt: string;
  createdAt: string;
  smsCode?: string | null;
  smsText?: string | null;
  smsSender?: string | null;
}

interface ActiveOtpCardProps {
  order: ActiveOtpOrder;
  onOrderUpdated?: (order: ActiveOtpOrder) => void;
  onOrderDismiss?: (orderId: string) => void;
}

export function ActiveOtpCard({
  order: initialOrder,
  onOrderUpdated,
  onOrderDismiss,
}: ActiveOtpCardProps) {
  const { toast } = useToast();
  const { updateBalanceLocally, refreshUser } = useAuth();

  const [order, setOrder] = useState<ActiveOtpOrder>(initialOrder);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("20:00");
  const [isExpired, setIsExpired] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  // Countdown timer
  useEffect(() => {
    let hasDismissed = false;

    const updateCountdown = () => {
      const expiry = new Date(order.expiresAt).getTime();
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        setIsExpired(true);
        if (!hasDismissed && order.status === "PENDING") {
          hasDismissed = true;
          // Notify backend check to ensure refund is registered
          fetch(`/api/otp/check?orderId=${order.id}&fiveSimId=${order.fiveSimId}`).catch(() => {});
          toast({
            title: "Order Expired",
            description: "Time limit reached. 100% refunded to your wallet.",
            variant: "info",
          });
          onOrderUpdated?.({ ...order, status: "TIMEOUT" });
          refreshUser();
          // Automatically remove from home screen
          setTimeout(() => {
            onOrderDismiss?.(order.id);
          }, 1500);
        }
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [order.expiresAt, order.id, order.fiveSimId, order.status, onOrderDismiss, onOrderUpdated, refreshUser, toast]);

  // Polling for incoming SMS if status is PENDING
  const pollStatus = useCallback(async () => {
    if (order.status !== "PENDING" || isExpired) return;

    try {
      const res = await fetch(`/api/otp/check?orderId=${order.id}&fiveSimId=${order.fiveSimId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
          onOrderUpdated?.(data.order);

          if (data.smsReceived) {
            toast.success("🎉 SMS Code Received!", `Verification code for ${data.order.serviceName}: ${data.order.smsCode}`);
            // Try to trigger a notification sound
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
              audio.play().catch(() => {});
            } catch {}
          } else if (data.autoRefunded || data.order.status === "TIMEOUT" || data.order.status === "CANCELED") {
            toast.info("Order Expired", "No SMS was received in time. Your wallet has been 100% refunded.");
            refreshUser();
            setTimeout(() => {
              onOrderDismiss?.(order.id);
            }, 1500);
          }
        }
      }
    } catch (e) {
      console.warn("Poll check error:", e);
    }
  }, [order.id, order.fiveSimId, order.status, isExpired, onOrderUpdated, onOrderDismiss, refreshUser, toast]);

  useEffect(() => {
    if (order.status !== "PENDING" || isExpired) return;

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [pollStatus, order.status, isExpired]);

  // Copy Phone Number
  const handleCopyPhone = () => {
    navigator.clipboard.writeText(order.phone);
    setCopiedPhone(true);
    toast({
      title: "Copied Number!",
      description: `${order.phone} copied to clipboard.`,
      variant: "success",
    });
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Copy SMS Code
  const handleCopyCode = () => {
    if (!order.smsCode) return;
    navigator.clipboard.writeText(order.smsCode);
    setCopiedCode(true);
    toast({
      title: "Copied Code!",
      description: `${order.smsCode} copied to clipboard.`,
      variant: "success",
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Cancel Order & 100% Refund
  const handleCancelOrder = async () => {
    if (cancelling) return;
    setCancelling(true);

    try {
      const res = await fetch("/api/otp/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, fiveSimId: order.fiveSimId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedOrder: ActiveOtpOrder = data.order || { ...order, status: "CANCELED" };
        setOrder(updatedOrder);
        onOrderUpdated?.(updatedOrder);
        if (data.newBalance !== undefined) {
          updateBalanceLocally(data.newBalance);
        } else {
          refreshUser();
        }
        toast({
          title: "Order Cancelled & Refunded",
          description: "100% refund credited back to your wallet. Closing window...",
          variant: "success",
        });

        // Automatically dismiss the card after a moment so the window disappears
        setTimeout(() => {
          onOrderDismiss?.(order.id);
        }, 1000);
      } else {
        toast({
          title: "Cancel Notice",
          description: data.error || "Unable to cancel with carrier. You can close this window.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Failed to cancel order.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  // Finish Order
  const handleFinishOrder = async () => {
    if (finishing) return;
    setFinishing(true);

    try {
      const res = await fetch("/api/otp/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
        onOrderUpdated?.(data.order);
        toast({
          title: "Activation Finished",
          description: "This order is marked as completed.",
          variant: "success",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setFinishing(false);
    }
  };

  const isPending = order.status === "PENDING" && !isExpired;
  const isReceived = order.status === "RECEIVED" || !!order.smsCode;
  const isFinished = order.status === "FINISHED";
  const isCanceled = order.status === "CANCELED" || order.status === "TIMEOUT" || isExpired;

  return (
    <div
      className={`relative rounded-3xl p-5 md:p-6 transition-all duration-300 backdrop-blur-xl border ${
        isReceived
          ? "bg-emerald-950/30 border-emerald-500/50 shadow-2xl shadow-emerald-500/10"
          : isPending
          ? "bg-slate-900/90 border-cyan-500/40 shadow-2xl shadow-cyan-500/10"
          : "bg-slate-900/60 border-slate-800"
      }`}
    >
      {/* Glow background accent */}
      <div
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isReceived ? "bg-emerald-500" : isPending ? "bg-cyan-500" : "bg-slate-700"
        }`}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-300 text-lg">
            {order.serviceName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {order.serviceName}
              <span className="text-xs font-normal text-slate-400">
                ({order.countryName})
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Operator: <span className="text-slate-300 font-medium capitalize">{order.operator}</span> • Cost: <span className="text-cyan-400 font-semibold">₹{order.cost.toFixed(2)}</span>
            </p>
          </div>
        </div>

        {/* Status Badge & Dismiss */}
        <div className="flex items-center gap-2">
          {isPending && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Waiting for SMS</span>
            </div>
          )}

          {isReceived && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SMS Received!</span>
            </div>
          )}

          {isFinished && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300">
              <Check className="w-3.5 h-3.5" />
              <span>Completed</span>
            </div>
          )}

          {isCanceled && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 border border-rose-800 text-rose-300">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Refunded</span>
            </div>
          )}

          {onOrderDismiss && (
            <button
              onClick={() => onOrderDismiss(order.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition shadow-sm ml-1"
              title="Close Window"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Number Section */}
      <div className="py-5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
          Allocated Virtual Phone Number
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#030712]/90 border border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xl sm:text-2xl font-black text-cyan-300 tracking-wider select-all break-all">
              {order.phone}
            </span>
          </div>

          <button
            onClick={handleCopyPhone}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-95 ${
              copiedPhone
                ? "bg-emerald-600 text-white"
                : "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20"
            }`}
          >
            {copiedPhone ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPhone ? "Copied Number!" : "Copy Number"}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Status / SMS Display Area */}
      {isPending && (
        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Listening for incoming verification message...</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/50">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{timeLeft}</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            Enter this number into <strong className="text-white">{order.serviceName}</strong>. As soon as the SMS is sent, the OTP will appear here automatically.
          </div>
        </div>
      )}

      {/* RECEIVED SMS STATE */}
      {isReceived && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                VERIFICATION CODE DETECTED
              </span>
              {order.smsSender && (
                <span className="text-slate-400">From: {order.smsSender}</span>
              )}
            </div>

            {/* Giant OTP Code Box */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-[#030712] border border-emerald-500/60 shadow-lg shadow-emerald-500/10">
              <div className="font-mono text-3xl sm:text-4xl font-black text-emerald-400 tracking-widest text-center sm:text-left select-all">
                {order.smsCode || "CODE ARRIVED"}
              </div>

              <button
                onClick={handleCopyCode}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm shadow-md transition active:scale-95 ${
                  copiedCode
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30"
                }`}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>
          </div>

          {/* Full SMS Body */}
          {order.smsText && (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                Full Message:
              </div>
              <p className="font-mono text-slate-200 break-words">{order.smsText}</p>
            </div>
          )}
        </div>
      )}

      {/* CANCELED / REFUNDED STATE */}
      {isCanceled && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>This order was cancelled or timed out. 100% of the cost was refunded to your wallet.</span>
          </div>
          {onOrderDismiss && (
            <button
              onClick={() => onOrderDismiss(order.id)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs transition border border-slate-700 self-end sm:self-auto shrink-0 shadow"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Window</span>
            </button>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500 font-mono">
          Ref: #{order.fiveSimId} • Order: {order.id.slice(0, 8)}...
        </div>

        <div className="flex items-center gap-2">
          {/* Close Window Button (Always accessible to dismiss the card) */}
          {onOrderDismiss && (
            <button
              onClick={() => onOrderDismiss(order.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Window</span>
            </button>
          )}

          {/* Cancel button: Only available before SMS is received */}
          {isPending && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-200 hover:text-white text-xs font-bold transition active:scale-95 disabled:opacity-50 shadow-sm shadow-rose-950/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{cancelling ? "Refunding..." : "Cancel & Refund"}</span>
            </button>
          )}

          {/* Finish Button */}
          {isReceived && !isFinished && (
            <button
              onClick={handleFinishOrder}
              disabled={finishing}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{finishing ? "Finishing..." : "Mark Done"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
