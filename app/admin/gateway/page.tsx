"use client";

import React, { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { useToast } from "@/components/ui/toast";
import {
  CreditCard,
  KeyRound,
  ShieldCheck,
  Save,
  Loader2,
  ExternalLink,
  CheckCircle2,
  QrCode,
  Zap,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

export default function AdminGatewayPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [hasExistingSecret, setHasExistingSecret] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState("");

  // Secret & Key Visibility Toggles (Hidden by default to prevent screen leaks)
  const [showKeyId, setShowKeyId] = useState(false);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);


  const fetchGatewayConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gateway");
      if (res.ok) {
        const json = await res.json();
        setRazorpayEnabled(json.razorpay_enabled);
        setKeyId(json.razorpay_key_id || "");
        setHasExistingSecret(json.razorpay_has_secret);
        setWebhookSecret(json.razorpay_webhook_secret || "");
      }
    } catch (err: any) {
      toast.error("Failed to load gateway config", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/gateway", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_enabled: razorpayEnabled,
          razorpay_key_id: keyId.trim(),
          razorpay_key_secret: keySecret.trim(),
          razorpay_webhook_secret: webhookSecret.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update gateway settings");

      toast.success("Gateway Saved", "Razorpay credentials and configuration updated successfully!");
      setKeySecret("");
      fetchGatewayConfig();
    } catch (err: any) {
      toast.error("Save Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Payment Gateway & Razorpay Integration"
        subtitle="Connect Razorpay API credentials for live UPI, Cards, NetBanking, and automated wallet recharges"
      />

      <main className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6">
        {/* Step-by-Step Connection Instructions Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">How to Connect Razorpay to UnMaskPeople.in</h2>
                <p className="text-xs text-slate-400">Step-by-step setup guide for test mode or live collections</p>
              </div>
            </div>

            <a
              href="https://dashboard.razorpay.com/#/access/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400 text-xs font-bold hover:bg-cyan-900/50 transition-colors"
            >
              <span>Razorpay Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-violet-500/20 text-violet-400 font-black flex items-center justify-center text-xs">
                1
              </div>
              <h3 className="font-bold text-white">Get API Keys</h3>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Sign in to Razorpay Dashboard &gt; <strong>Account & Settings</strong> &gt; <strong>API Keys</strong> &gt; Click <strong>Generate Key</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs">
                2
              </div>
              <h3 className="font-bold text-white">Paste Below & Save</h3>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Copy your <strong>Key ID</strong> (<code className="text-cyan-400 font-mono">rzp_test_...</code> or <code className="text-cyan-400 font-mono">rzp_live_...</code>) and <strong>Key Secret</strong> into the form below.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs">
                3
              </div>
              <h3 className="font-bold text-white">Accept UPI & Cards</h3>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Enable the toggle. Subscribers clicking <strong>Add Money</strong> will instantly pay via GPay, PhonePe, Paytm, QR, or Cards.
              </p>
            </div>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-violet-400" />
                <span>Gateway Configuration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable live Razorpay checkout or run in simulated sandbox mode
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">
                {razorpayEnabled ? "Razorpay Gateway Active" : "Gateway Disabled (Simulator Mode)"}
              </span>
              <input
                type="checkbox"
                checked={razorpayEnabled}
                onChange={(e) => setRazorpayEnabled(e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Razorpay Key ID</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <Lock className="w-3 h-3" />
                  <span>Masked on Screen</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type={showKeyId ? "text" : "password"}
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  placeholder="rzp_test_xxxxxx or rzp_live_xxxxxx"
                  className="w-full p-3 pr-11 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:border-cyan-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyId(!showKeyId)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title={showKeyId ? "Hide Key ID" : "Show Key ID"}
                >
                  {showKeyId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Public client key used to initiate checkout widgets. Hidden by default to prevent screen leaks.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-violet-400" />
                  <span>Razorpay Key Secret</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Encrypted Secret</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type={showKeySecret ? "text" : "password"}
                  value={keySecret}
                  onChange={(e) => setKeySecret(e.target.value)}
                  placeholder={
                    hasExistingSecret
                      ? "•••••••••••••••• (Leave blank to keep existing secret)"
                      : "Enter secret key from Razorpay dashboard"
                  }
                  className="w-full p-3 pr-11 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:border-cyan-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKeySecret(!showKeySecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title={showKeySecret ? "Hide Secret" : "Show Secret"}
                >
                  {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Server-side private key used for cryptographic signature verification. Never shared with client browsers.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Webhook Secret (Optional)</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  <Lock className="w-3 h-3" />
                  <span>Masked on Screen</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type={showWebhookSecret ? "text" : "password"}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full p-3 pr-11 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:border-cyan-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title={showWebhookSecret ? "Hide Webhook Secret" : "Show Webhook Secret"}
                >
                  {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Webhook URL to set in Razorpay: <code className="text-violet-400 font-mono">https://unmaskpeople.in/api/wallet/webhook</code>
              </p>
            </div>
          </div>


          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Gateway Credentials</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
