"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Globe, ArrowRight, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { POPULAR_COUNTRIES } from "@/lib/fivesim-catalog";

interface ProductItem {
  code: string;
  name: string;
  qty: number;
  priceWholesaleUsd: number;
  priceCustomerUsd: number;
  priceCustomerInr: number;
}

export default function PricesPage() {
  const [selectedCountry, setSelectedCountry] = useState("usa");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadPrices() {
      setLoading(true);
      try {
        const res = await fetch(`/api/otp/services?country=${encodeURIComponent(selectedCountry)}&operator=any`);
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (e) {
        console.error("Error loading prices:", e);
      } finally {
        setLoading(false);
      }
    }
    loadPrices();
  }, [selectedCountry]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Wholesale Rates</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Live Pricing & Service Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time pricing and stock counts directly synchronized with our 5SIM telecom node.
          </p>
        </div>

        {/* Country Selector & Search */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Select Country:
              </span>
            </div>

            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search services (e.g. Telegram, ChatGPT)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#030712] border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {POPULAR_COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCountry === c.code
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "bg-[#030712] border border-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading catalog prices...</p>
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#030712] border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Service</th>
                    <th className="py-3.5 px-4 font-bold">API Code</th>
                    <th className="py-3.5 px-4 font-bold">Numbers in Stock</th>
                    <th className="py-3.5 px-4 font-bold">Price (INR)</th>
                    <th className="py-3.5 px-4 font-bold">Price (USD)</th>
                    <th className="py-3.5 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((item) => (
                    <tr key={item.code} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-xs font-black">
                          {item.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span>{item.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {item.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-semibold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>{item.qty.toLocaleString()} available</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white text-sm">
                        ₹{item.priceCustomerInr.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-cyan-400 text-xs">
                        ${item.priceCustomerUsd.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/?country=${selectedCountry}&service=${item.code}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm shadow-cyan-500/20 transition active:scale-95"
                        >
                          <span>Buy Number</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
