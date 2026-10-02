"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  Copy,
  Check,
  Zap,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useToast } from "@/components/ui/toast";

export default function ApiDocsPage() {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast({
      title: "Copied!",
      description: "Code snippet copied to clipboard.",
      variant: "success",
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const BUY_CURL = `curl -X POST https://yourdomain.com/api/otp/buy \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "country": "usa",
    "operator": "any",
    "product": "telegram"
  }'`;

  const CHECK_CURL = `curl -X GET "https://yourdomain.com/api/otp/check?orderId=ORDER_ID" \\
  -H "Authorization: Bearer YOUR_API_TOKEN"`;

  const BUY_NODE = `const axios = require('axios');

async function buyNumber() {
  const response = await axios.post('https://yourdomain.com/api/otp/buy', {
    country: 'usa',
    operator: 'any',
    product: 'telegram'
  }, {
    headers: { 'Authorization': 'Bearer YOUR_API_TOKEN' }
  });

  console.log('Allocated Number:', response.data.order.phone);
  console.log('Order ID:', response.data.order.id);
}`;

  const BUY_PYTHON = `import requests

url = "https://yourdomain.com/api/otp/buy"
headers = {"Authorization": "Bearer YOUR_API_TOKEN"}
payload = {
    "country": "usa",
    "operator": "any",
    "product": "telegram"
}

response = requests.post(url, json=payload, headers=headers)
order = response.json().get("order")
print("Phone Number:", order["phone"])`;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      <SiteHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer Reference</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            REST API Documentation
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Integrate virtual number acquisition and real-time SMS verification directly into your bots, software, and automation scripts.
          </p>
        </div>

        {/* Auth section */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Authentication</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Authenticate all requests by including your session token or API key in the HTTP <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded">Authorization</code> header:
          </p>
          <div className="p-3 rounded-xl bg-[#030712] border border-slate-800 font-mono text-xs text-cyan-400">
            Authorization: Bearer YOUR_API_TOKEN
          </div>
        </div>

        {/* Endpoint 1: Buy Number */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-xs font-black">
                POST
              </span>
              <span className="font-mono text-sm font-bold text-white">/api/otp/buy</span>
            </div>
            <span className="text-xs text-slate-400">Order New Virtual Number</span>
          </div>

          <p className="text-xs text-slate-400">
            Deducts the customer cost from your wallet balance and returns an allocated private phone number.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>cURL Request</span>
              <button
                onClick={() => handleCopy(BUY_CURL, "buy_curl")}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
              >
                {copiedKey === "buy_curl" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "buy_curl" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-[#030712] border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              {BUY_CURL}
            </pre>
          </div>
        </div>

        {/* Endpoint 2: Check Order Status & Code */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono text-xs font-black">
                GET
              </span>
              <span className="font-mono text-sm font-bold text-white">/api/otp/check?orderId=&#123;orderId&#125;</span>
            </div>
            <span className="text-xs text-slate-400">Poll SMS Code</span>
          </div>

          <p className="text-xs text-slate-400">
            Checks if the SMS has arrived. If received, returns the parsed verification code and full SMS text.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>cURL Request</span>
              <button
                onClick={() => handleCopy(CHECK_CURL, "check_curl")}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
              >
                {copiedKey === "check_curl" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "check_curl" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-[#030712] border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              {CHECK_CURL}
            </pre>
          </div>
        </div>

        {/* Code Examples in Node & Python */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>SDK & Scripting Examples</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Node */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-bold text-white">Node.js (Axios)</span>
                <button
                  onClick={() => handleCopy(BUY_NODE, "node_code")}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {copiedKey === "node_code" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto py-2 leading-relaxed">
                {BUY_NODE}
              </pre>
            </div>

            {/* Python */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-bold text-white">Python (Requests)</span>
                <button
                  onClick={() => handleCopy(BUY_PYTHON, "python_code")}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {copiedKey === "python_code" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto py-2 leading-relaxed">
                {BUY_PYTHON}
              </pre>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
