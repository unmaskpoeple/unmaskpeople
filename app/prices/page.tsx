"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Globe, ArrowRight, Loader2, Sparkles } from "lucide-react";
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
        const res = await fetch(
          `/api/otp/services?country=${encodeURIComponent(selectedCountry)}&operator=any`
        );
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Pricing</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Live Pricing &amp; Service Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 px-2">
            Live pricing and availability updated in real time from our global carrier network.
          </p>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
          {/* Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Telegram, ChatGPT, WhatsApp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Country Label */}
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Globe className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Select Country:</span>
          </div>

          {/* Country Pills — scrollable row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {POPULAR_COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 flex-shrink-0 ${
                  selectedCountry === c.code
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "bg-[#030712] border border-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-slate-400 px-1">
            Showing <span className="text-white font-bold">{filtered.length}</span> services available
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading catalog prices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 p-8 space-y-3">
            <p className="text-slate-300 text-sm font-semibold">No services found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Try a different country or clear your search.
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((item) => (
              <div
                key={item.code}
                className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all"
              >
                {/* Left: icon + name + stock */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-black text-sm flex-shrink-0">
                    {item.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] font-semibold text-emerald-400 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                      {item.qty.toLocaleString()} avail.
                    </span>
                  </div>
                </div>

                {/* Right: price + button */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <div className="text-sm font-black text-white">
                    ₹{item.priceCustomerInr.toFixed(2)}
                  </div>
                  <Link
                    href={`/?country=${selectedCountry}&service=${item.code}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-[10px] shadow-sm shadow-cyan-500/20 transition active:scale-95 whitespace-nowrap"
                  >
                    <span>Get Number</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
