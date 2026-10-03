"use client";

import React, { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { useToast } from "@/components/ui/toast";
import {
  Mail,
  KeyRound,
  ShieldCheck,
  Save,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Send,
  Server,
  Zap,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

export default function AdminEmailPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form State
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [requireVerification, setRequireVerification] = useState(true);
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(587);
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [hasPass, setHasPass] = useState(false);

  const [fromName, setFromName] = useState("NumVerge OTP Security");
  const [fromEmail, setFromEmail] = useState("no-reply@numverge.com");
  const [appUrl, setAppUrl] = useState("https://numverge.com");

  // Test Email State
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchEmailSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email");
      if (res.ok) {
        const data = await res.json();
        setSmtpEnabled(Boolean(data.smtp_enabled));
        setRequireVerification(data.require_email_verification !== false);
        setHost(data.smtp_host || "smtp.gmail.com");
        setPort(data.smtp_port || 587);
        setSecure(Boolean(data.smtp_secure));
        setUser(data.smtp_user || "");
        setHasPass(Boolean(data.smtp_has_pass));
        setFromName(data.smtp_from_name || "NumVerge OTP Security");
        setFromEmail(data.smtp_from_email || "no-reply@numverge.com");
        setAppUrl(data.app_url || "https://numverge.com");
      }
    } catch (err: any) {
      toast.error("Failed to load settings", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_enabled: smtpEnabled,
          require_email_verification: requireVerification,
          smtp_host: host.trim(),
          smtp_port: Number(port),
          smtp_secure: secure,
          smtp_user: user.trim(),
          smtp_pass: pass.trim() || undefined,
          smtp_from_name: fromName.trim(),
          smtp_from_email: fromEmail.trim(),
          app_url: appUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save SMTP settings");

      toast.success("Settings Saved", "Email and SMTP configuration updated successfully!");
      setPass("");
      fetchEmailSettings();
    } catch (err: any) {
      toast.error("Save Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      toast.error("Invalid Email", "Please enter a destination email to send a test message.");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: testEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestResult({ success: false, message: data.error || "SMTP test failed." });
        throw new Error(data.error || "SMTP test failed.");
      }

      setTestResult({ success: true, message: data.message });
      toast.success("Test Email Dispatched", "SMTP server verified successfully!");
    } catch (err: any) {
      toast.error("Test Error", err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Email & SMTP Activation Settings"
        subtitle="Configure email delivery servers to dispatch automated account activation links and notifications"
      />

      <main className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Quick Setup Guide Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">How Email Activation Works</h2>
                <p className="text-xs text-slate-400">Automated 24-hour cryptographic verification links</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                smtpEnabled
                  ? "bg-emerald-950/80 border-emerald-800/60 text-emerald-400"
                  : "bg-amber-950/80 border-amber-800/60 text-amber-400"
              }`}>
                {smtpEnabled ? "Live SMTP Active" : "Sandbox Simulator Mode"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-violet-500/20 text-violet-400 font-black flex items-center justify-center text-xs">
                1
              </div>
              <h3 className="font-bold text-white">New User Registers</h3>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Subscriber fills out the registration form. Their account is created with <code className="text-cyan-400">emailVerified: false</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs">
                2
              </div>
              <h3 className="font-bold text-white">Activation Email Dispatched</h3>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                A secure token link is emailed (e.g. via Gmail, Brevo, or SendGrid). If SMTP is not yet configured, the system logs the link in sandbox mode.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs">
                3
              </div>
              <h3 className="font-bold text-white">Account & ₹15 Unlocked</h3>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                User clicks the link &rarr; account is activated &rarr; ₹15.00 promotional welcome credits become immediately spendable!
              </p>
            </div>
          </div>
        </div>

        {/* Main Settings Form */}
        <form onSubmit={handleSave} className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" />
                <span>SMTP Mail Server Credentials</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your SMTP provider (Gmail App Password, Brevo, SendGrid, Hostinger, AWS SES)
              </p>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireVerification}
                  onChange={(e) => setRequireVerification(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-300">
                  Enforce Email Activation
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smtpEnabled}
                  onChange={(e) => setSmtpEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-emerald-400">
                  Enable SMTP Delivery
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Host */}
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                SMTP Server Host
              </label>
              <input
                type="text"
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="smtp.gmail.com or smtp.brevo.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:border-cyan-400 outline-none"
              />
            </div>

            {/* Port & Secure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Port
                </label>
                <input
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder="587"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  SSL / TLS Secure
                </label>
                <select
                  value={secure ? "true" : "false"}
                  onChange={(e) => setSecure(e.target.value === "true")}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-medium focus:border-cyan-400 outline-none"
                >
                  <option value="false">STARTTLS (587)</option>
                  <option value="true">SSL / TLS (465)</option>
                </select>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                SMTP Username / Email
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="your-email@gmail.com or api-key"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:border-cyan-400 outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-300">
                  SMTP Password / App Password
                </label>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Masked</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder={hasPass ? "•••••••••••••••• (Leave blank to keep existing password)" : "Enter password or App Password"}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:border-cyan-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
                  title={showPass ? "Hide Password" : "Show Password"}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>


            {/* From Name */}
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                Sender Name (From Name)
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="NumVerge OTP Security"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:border-cyan-400 outline-none"
              />
            </div>

            {/* From Email */}
            <div>
              <label className="block font-bold text-slate-300 mb-1.5">
                Sender Email (From Email)
              </label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="no-reply@numverge.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:border-cyan-400 outline-none"
              />
            </div>

            {/* App Base URL */}
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-300 mb-1.5">
                App Base URL (Used for verification link generation)
              </label>
              <input
                type="text"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder="http://localhost:3000 or https://numverge.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-cyan-400 font-mono focus:border-cyan-400 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Subscribers will receive links pointing to: <code className="text-cyan-400">{appUrl}/verify-email?token=...</code>
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Configuration...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Email & SMTP Settings</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Test Connection Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Send Test Verification Email</h3>
              <p className="text-xs text-slate-400">Verify that your SMTP credentials can successfully deliver messages</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter your email to receive a test message"
              className="flex-1 w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs placeholder:text-slate-600 focus:border-emerald-500 outline-none font-mono"
            />
            <button
              type="button"
              disabled={testing || !testEmail}
              onClick={handleTestConnection}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Email</span>
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 mt-2 ${
              testResult.success
                ? "bg-emerald-950/40 border-emerald-800/70 text-emerald-300"
                : "bg-rose-950/40 border-rose-800/70 text-rose-300"
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{testResult.success ? "Success" : "Connection Failed"}</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
