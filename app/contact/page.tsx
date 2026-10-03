"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Mail,
  MapPin,
  Clock,
  Phone,
  Send,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Building,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useToast } from "@/components/ui/toast";
import { SiteFooter } from "@/components/site-footer";

export default function ContactPage() {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("TECHNICAL");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate reliable dispatch
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success("Message Received", "Our support engineering team will respond within 24 hours.");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-cyber-mesh text-slate-100 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-dots pointer-events-none opacity-40 z-0" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-[128px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <BrandLogo href="/" size="md" />

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 text-xs font-bold">
            <Mail className="w-3.5 h-3.5" />
            <span>Customer & Enterprise Support</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            <span className="gradient-letter">Get in</span>{" "}
            <span className="gradient-letter-cyan">Touch</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Have questions regarding wallet recharges, API access, or data privacy? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Contact Details Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-cyan-400" />
                <span>Operational Headquarters</span>
              </h3>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">General & Technical Support</p>
                    <a href="mailto:support@numverge.com" className="text-cyan-400 hover:underline">
                      support@numverge.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Billing & Payments Helpdesk</p>
                    <a href="mailto:billing@numverge.com" className="text-emerald-400 hover:underline">
                      billing@numverge.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-violet-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Registered Address (India)</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      NumVerge Technologies India Pvt Ltd<br />
                      Tower B, Cyber City, DLF Phase 2<br />
                      Gurugram, Haryana - 122002, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Operating Hours</p>
                    <p className="text-slate-400 text-[11px]">
                      Monday – Friday: 09:30 AM – 06:30 PM IST<br />
                      Automated API Services: 24/7/365
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grievance Officer Notice */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1 text-slate-400">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Statutory Grievance Officer</span>
              </span>
              <p>Designated under Rule 3(2) of Information Technology Rules, 2021.</p>
              <p>Email: <code className="text-cyan-400">grievance@numverge.com</code></p>
            </div>
          </div>

          {/* Interactive Contact Form */}
          <div className="md:col-span-3">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-2xl">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Message Dispatched!</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out. A support engineer will review your ticket and respond to <strong className="text-cyan-400">{email}</strong> within 12-24 business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Send Us a Direct Message</h3>
                    <p className="text-[11px] text-slate-400">Fill in the details below and we will get back to you promptly.</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Verma"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:border-cyan-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:border-cyan-400 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Inquiry Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:border-cyan-400 outline-none"
                    >
                      <option value="TECHNICAL">Technical Support & API Queries</option>
                      <option value="BILLING">Billing, Payments & Razorpay Recharges</option>
                      <option value="REFUND">Refund or Failed Search Investigation</option>
                      <option value="PRIVACY">Data Privacy & DPDP Inquiries</option>
                      <option value="PARTNERSHIP">Enterprise Volume Pricing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Message / Issue Details
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe your question or issue in detail..."
                      className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:border-cyan-400 outline-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Transmitting Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-white" />
                        <span>Submit Support Ticket</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
