"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Globe,
  Radio,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Flame,
  MessageCircle,
  Share2,
  Bot,
  Gamepad2,
  ShoppingBag,
  CreditCard,
  Lock,
} from "lucide-react";
import { useAuth } from "./providers/auth-provider";
import { useToast } from "./ui/toast";
import { ActiveOtpCard, ActiveOtpOrder } from "./active-otp-card";
import { AddMoneyModal } from "./add-money-modal";
import { POPULAR_COUNTRIES } from "@/lib/fivesim-catalog";

interface CountryItem {
  code: string;
  name: string;
  flag: string;
  prefix: string;
  operators: string[];
}

interface ProductItem {
  code: string;
  name: string;
  qty: number;
  priceWholesaleUsd: number;
  priceCustomerUsd: number;
  priceCustomerInr: number;
  category?: string;
  isPopular?: boolean;
}

export function OtpMarketplace() {
  const router = useRouter();
  const { user, updateBalanceLocally, refreshUser } = useAuth();
  const { toast } = useToast();

  // State
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("usa");
  const [selectedOperator, setSelectedOperator] = useState<string>("any");
  const [availableOperators, setAvailableOperators] = useState<string[]>([]);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Purchase modal & active orders state
  const [buyingProduct, setBuyingProduct] = useState<ProductItem | null>(null);
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOtpOrder[]>([]);
  const [showAddFundsModal, setShowAddFundsModal] = useState<boolean>(false);
  const [neededAmount, setNeededAmount] = useState<number>(0);

  // 1. Load Countries on mount
  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch("/api/otp/countries");
        const data = await res.json();
        if (data.success && Array.isArray(data.countries)) {
          setCountries(data.countries);
          // Set operators for initial country
          const initCountry = data.countries.find((c: CountryItem) => c.code === "usa") || data.countries[0];
          if (initCountry) {
            setAvailableOperators(initCountry.operators || []);
          }
        }
      } catch (e) {
        console.error("Failed to load countries:", e);
      } finally {
        setLoadingCountries(false);
      }
    }
    loadCountries();
  }, []);

  // 2. Load User's Active Orders if logged in
  useEffect(() => {
    if (!user) return;

    async function loadActiveOrders() {
      try {
        const res = await fetch("/api/otp/orders?status=active");
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setActiveOrders(data.orders);
        }
      } catch (e) {
        console.error("Failed to load active orders:", e);
      }
    }
    loadActiveOrders();
  }, [user]);

  // 3. Load Products whenever country or operator changes
  useEffect(() => {
    async function loadServices() {
      setLoadingProducts(true);
      try {
        const res = await fetch(
          `/api/otp/services?country=${encodeURIComponent(selectedCountry)}&operator=${encodeURIComponent(selectedOperator)}`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } catch (e) {
        console.error("Failed to load services:", e);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadServices();
  }, [selectedCountry, selectedOperator]);

  // Handle Country Change
  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code);
    const countryObj = countries.find((c) => c.code === code);
    setAvailableOperators(countryObj?.operators || []);
    setSelectedOperator("any");
  };

  // Filtered Services List
  const filteredProducts = useMemo(() => {
    let result = products;

    // Category filter
    if (selectedCategory !== "all") {
      if (selectedCategory === "popular") {
        result = result.filter((p) => p.isPopular);
      } else {
        result = result.filter((p) => p.category === selectedCategory);
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  // Quick Category Filter Buttons
  const CATEGORIES = [
    { id: "all", label: "All Services", icon: Flame },
    { id: "popular", label: "Popular", icon: TrendingUp },
    { id: "messaging", label: "Messaging", icon: MessageCircle },
    { id: "ai", label: "AI & Tools", icon: Bot },
    { id: "social", label: "Social", icon: Share2 },
    { id: "entertainment", label: "Gaming & Media", icon: Gamepad2 },
    { id: "shopping", label: "Shopping", icon: ShoppingBag },
    { id: "finance", label: "Finance", icon: CreditCard },
  ];

  // Current Country Meta
  const currentCountry = useMemo(() => {
    return (
      countries.find((c) => c.code === selectedCountry) || {
        code: selectedCountry,
        name: selectedCountry.toUpperCase(),
        flag: "🌐",
        prefix: "",
        operators: [],
      }
    );
  }, [countries, selectedCountry]);

  // Handle Buy Number Click
  const handleInitiateBuy = (product: ProductItem) => {
    if (!user) {
      toast({
        title: "Account Required",
        description: "Please sign in or create an account to purchase numbers.",
        variant: "info",
      });
      router.push("/login?redirect=/");
      return;
    }

    // Check balance
    const userBalance = Number(user.walletBalance ?? 0);
    if (userBalance < product.priceCustomerInr) {
      const deficit = product.priceCustomerInr - userBalance;
      setNeededAmount(Math.ceil(deficit));
      setShowAddFundsModal(true);
      toast({
        title: "Insufficient Balance",
        description: `You need ₹${deficit.toFixed(2)} more to buy this number. Please top up your wallet.`,
        variant: "destructive",
      });
      return;
    }

    setBuyingProduct(product);
  };

  // Confirm Purchase Execution
  const handleConfirmPurchase = async () => {
    if (!buyingProduct || purchasing) return;
    setPurchasing(true);

    try {
      const res = await fetch("/api/otp/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: selectedCountry,
          operator: selectedOperator,
          product: buyingProduct.code,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.order) {
        // Deduct balance locally
        updateBalanceLocally((user?.walletBalance ?? 0) - buyingProduct.priceCustomerInr);

        // Prepend to active orders
        setActiveOrders((prev) => [data.order, ...prev]);

        toast({
          title: "Phone Number Allocated!",
          description: `Ready: ${data.order.phone}. Paste into ${data.order.serviceName} to get your code.`,
          variant: "success",
        });

        setBuyingProduct(null);

        // Scroll to active orders section
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        toast({
          title: "Order Failed",
          description: data.error || "Unable to allocate number.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Something went wrong while purchasing.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="w-full space-y-10">
      {/* 1. HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto pt-6 pb-2 px-4 space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-sm shadow-cyan-500/10">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>High-Delivery Virtual Numbers • Powered by 5SIM Protocol</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
          Receive OTP Online with{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Instant Virtual Numbers
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Over 1,300+ platforms & 150+ countries supported. If your SMS code doesn't arrive within 20 minutes, your wallet is{" "}
          <strong className="text-emerald-400 font-semibold">100% automatically refunded</strong>.
        </p>

        {/* Live Trust Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg sm:text-xl font-bold text-cyan-400">1,320+</div>
            <div className="text-[11px] text-slate-400">Supported Apps</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg sm:text-xl font-bold text-emerald-400">100%</div>
            <div className="text-[11px] text-slate-400">Refund Guarantee</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg sm:text-xl font-bold text-indigo-400">&lt; 10s</div>
            <div className="text-[11px] text-slate-400">SMS Detection</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg sm:text-xl font-bold text-amber-400">150+</div>
            <div className="text-[11px] text-slate-400">Global Countries</div>
          </div>
        </div>
      </section>

      {/* 2. ACTIVE ORDERS LISTENING DRAWER */}
      {activeOrders.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Live Active Numbers ({activeOrders.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Auto-refreshing every 3 seconds
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((ord) => (
              <ActiveOtpCard
                key={ord.id}
                order={ord}
                onOrderUpdated={(updated) => {
                  setActiveOrders((prev) =>
                    prev.map((o) => (o.id === updated.id ? updated : o))
                  );
                }}
                onOrderDismiss={(id) => {
                  setActiveOrders((prev) => prev.filter((o) => o.id !== id));
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. MARKETPLACE INTERACTIVE HUB */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Country Selector Header */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5" />
                Step 1: Choose Country
              </label>
              <h3 className="text-lg font-bold text-white">
                Selected: {currentCountry.flag} {currentCountry.name} {currentCountry.prefix && `(${currentCountry.prefix})`}
              </h3>
            </div>

            {/* Operator Selection */}
            {availableOperators.length > 0 && (
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Carrier:</span>
                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="bg-[#030712] border border-slate-700 text-xs font-semibold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="any">⚡ Any Operator (Auto Best)</option>
                  {availableOperators.map((op) => (
                    <option key={op} value={op} className="capitalize">
                      {op}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Popular Country Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {POPULAR_COUNTRIES.map((c) => {
              const isSelected = selectedCountry === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => handleCountrySelect(c.code)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20 border border-cyan-400/50"
                      : "bg-[#030712] border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Full Country Dropdown */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Or pick from all 150+ countries:
            </span>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountrySelect(e.target.value)}
              className="bg-[#030712] border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-cyan-500 flex-1 max-w-xs"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} {c.prefix ? `(${c.prefix})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. SERVICE FILTERS & SEARCH */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Available Services</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                  {filteredProducts.length} Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Click any service to instantly generate your private virtual number.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Telegram, WhatsApp, ChatGPT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? "bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-sm"
                      : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. SERVICES GRID */}
        {loadingProducts ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading live stock & prices for {currentCountry.name}...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 p-8 space-y-3">
            <p className="text-slate-300 text-sm font-semibold">No services found matching your search</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try switching the country to United States, United Kingdom, or India for the highest availability.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                handleCountrySelect("usa");
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod.code}
                className="group relative rounded-2xl p-4 bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all duration-200 flex flex-col justify-between gap-4 shadow-lg hover:shadow-cyan-500/5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-300 text-sm group-hover:scale-105 transition">
                        {prod.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                          {prod.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {prod.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] font-semibold text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{prod.qty.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-black text-white">
                      ₹{prod.priceCustomerInr.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ${prod.priceCustomerUsd.toFixed(2)} USD
                    </div>
                  </div>

                  <button
                    onClick={() => handleInitiateBuy(prod)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-cyan-500/15 active:scale-95 transition"
                  >
                    <span>Get</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. ORDER CONFIRMATION MODAL */}
      {buyingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-[#090d16] border border-cyan-500/40 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Confirm Number Order</h3>
              </div>
              <button
                onClick={() => setBuyingProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-[#030712] border border-slate-800 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Service</span>
                <span className="font-bold text-white">{buyingProduct.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Country</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <span>{currentCountry.flag}</span>
                  <span>{currentCountry.name}</span>
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Operator</span>
                <span className="font-bold text-white capitalize">{selectedOperator}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Price Charged</span>
                <span className="font-bold text-cyan-400 text-sm">₹{buyingProduct.priceCustomerInr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Wallet After</span>
                <span className="font-semibold text-slate-300">
                  ₹{((user?.walletBalance ?? 0) - buyingProduct.priceCustomerInr).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>100% Refund Guarantee:</strong> If the SMS code does not arrive or you cancel the number, your ₹{buyingProduct.priceCustomerInr.toFixed(2)} is immediately returned to your wallet.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setBuyingProduct(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={purchasing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Allocating SIM...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Confirm & Get Number</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. ADD MONEY MODAL */}
      <AddMoneyModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
      />
    </div>
  );
}
