"use client";

import React, { useState, useEffect } from "react";
import { AdminTopbar } from "@/components/admin/topbar";
import { useToast } from "@/components/ui/toast";
import {
  Settings,
  Save,
  Loader2,
  Shield,
  KeyRound,
  Database,
  Lock,
  Globe,
  Sliders,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [siteName, setSiteName] = useState("UnMaskPeople.in");
  const [currencySymbol, setCurrencySymbol] = useState("₹");
  const [currencyCode, setCurrencyCode] = useState("INR");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [privacyMaskPhone, setPrivacyMaskPhone] = useState(true);
  const [dataRetentionDays, setDataRetentionDays] = useState("90");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);


  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        const s = data.settings;
        setSettings(s);
        setSiteName(s.site_name || "UnMaskPeople.in");
        setCurrencySymbol(s.currency_symbol || "₹");
        setCurrencyCode(s.currency_code || "INR");
        setMaintenanceMode(s.maintenance_mode || false);
        setRegistrationEnabled(s.registration_enabled !== false);
        setPrivacyMaskPhone(s.privacy_mask_phone !== false);
        setDataRetentionDays(String(s.data_retention_days || 90));
        setWebhookSecret(s.webhook_secret || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_name: siteName.trim(),
          currency_symbol: currencySymbol.trim(),
          currency_code: currencyCode.trim(),
          maintenance_mode: maintenanceMode,
          registration_enabled: registrationEnabled,
          privacy_mask_phone: privacyMaskPhone,
          data_retention_days: Number(dataRetentionDays),
          webhook_secret: webhookSecret.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update platform settings");

      toast.success("Settings Saved", data.message);
      fetchSettings();
    } catch (err: any) {
      toast.error("Save Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <AdminTopbar
        title="Global Platform Settings & Policies"
        subtitle="Manage branding, registration rules, cryptographic webhook secrets, and data privacy"
      />

      <main className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Branding & Currency */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-violet-400" />
                <span>Branding & Regional Localization</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Customize platform identity, currency symbol, and regional representations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Application Name</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-bold focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-bold focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">ISO Currency Code</label>
                <input
                  type="text"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Operational Toggles */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>Access Gates & Maintenance</span>
              </h2>
            </div>

            {/* Toggle 1: Registration */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-white text-xs block">Public Subscriber Registration</span>
                <p className="text-[11px] text-slate-400">
                  Allow new users to sign up from the landing page. If disabled, only existing accounts can log in.
                </p>
              </div>
              <input
                type="checkbox"
                checked={registrationEnabled}
                onChange={(e) => setRegistrationEnabled(e.target.checked)}
                className="w-5 h-5 rounded accent-violet-600 cursor-pointer"
              />
            </div>

            {/* Toggle 2: Maintenance Mode */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-white text-xs block">Maintenance Mode</span>
                <p className="text-[11px] text-slate-400">
                  Blocks standard subscriber queries with a maintenance message. Administrators can still operate normally.
                </p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 rounded accent-violet-600 cursor-pointer"
              />
            </div>

            {/* Toggle 3: Privacy Mask Phone */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-white text-xs block">Enforce Phone Number Masking</span>
                <p className="text-[11px] text-slate-400">
                  Mask sensitive phone digits in logs and histories (+91 98*****3210) according to GDPR/data protection regulations.
                </p>
              </div>
              <input
                type="checkbox"
                checked={privacyMaskPhone}
                onChange={(e) => setPrivacyMaskPhone(e.target.checked)}
                className="w-5 h-5 rounded accent-violet-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Card 3: Security & Secrets */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-400" />
                <span>Security & Webhook Secrets</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                    <span>Payment Webhook Signing Key</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Masked</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showWebhookSecret ? "text" : "password"}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="whsec_..."
                    className="w-full p-3 pr-11 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
                    title={showWebhookSecret ? "Hide Signing Key" : "Show Signing Key"}
                  >
                    {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>


              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Request Data Retention (Days)
                </label>
                <input
                  type="number"
                  value={dataRetentionDays}
                  onChange={(e) => setDataRetentionDays(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
