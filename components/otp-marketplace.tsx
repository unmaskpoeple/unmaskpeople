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
  Flame,
  MessageCircle,
  Share2,
  Bot,
  Gamepad2,
  ShoppingBag,
  CreditCard,
  Lock,
  ChevronLeft,
  ChevronRight,
  Award,
} from "lucide-react";
import { useAuth } from "./providers/auth-provider";
import { useToast } from "./ui/toast";
import { ActiveOtpCard, ActiveOtpOrder } from "./active-otp-card";
import { AddMoneyModal } from "./add-money-modal";

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
  const { user, updateBalanceLocally } = useAuth();
  const { toast } = useToast();

  // State: Default to India as requested
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("india");
  const [selectedOperator, setSelectedOperator] = useState<string>("any");
  const [availableOperators, setAvailableOperators] = useState<string[]>([]);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [loadingCountries, setLoadingCountries] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Pagination State: 10 items per page as requested
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Purchase modal & active orders state
  const [buyingProduct, setBuyingProduct] = useState<ProductItem | null>(null);
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOtpOrder[]>([]);
  const [showAddFundsModal, setShowAddFundsModal] = useState<boolean>(false);
  const [neededAmount, setNeededAmount] = useState<number>(0);

  // 1. Load Countries on mount (Default to India)
  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await fetch("/api/otp/countries");
        const data = await res.json();
        if (data.success && Array.isArray(data.countries)) {
          setCountries(data.countries);
          // Prioritize India by default
          const indiaCountry = data.countries.find((c: CountryItem) => c.code.toLowerCase() === "india");
          const initCountry = indiaCountry || data.countries[0];
          if (initCountry) {
            setSelectedCountry(initCountry.code);
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

  // Reset pagination page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCountry, selectedOperator, selectedCategory, searchQuery]);

  // Handle Country Change
  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code);
    const countryObj = countries.find((c) => c.code.toLowerCase() === code.toLowerCase());
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

  // Pagination calculation (exactly 10 per page)
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    const el = document.getElementById("services-catalog");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
      countries.find((c) => c.code.toLowerCase() === selectedCountry.toLowerCase()) || {
        code: selectedCountry,
        name: selectedCountry.toUpperCase(),
        flag: selectedCountry.toLowerCase() === "india" ? "🇮🇳" : "🌐",
        prefix: selectedCountry.toLowerCase() === "india" ? "+91" : "",
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
    <div className="w-full space-y-8 sm:space-y-10">
      {/* 1. HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto pt-4 sm:pt-6 pb-2 px-3 sm:px-4 space-y-4 sm:space-y-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-semibold shadow-sm shadow-cyan-500/10">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>High-Delivery Virtual Numbers</span>
        </div>

        <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
          Receive OTP Online with{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Instant Virtual Numbers
          </span>
        </h1>

        <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Over 1,300+ platforms & 150+ countries supported. If your SMS code doesn't arrive within 20 minutes, your wallet is{" "}
          <strong className="text-emerald-400 font-semibold">100% automatically refunded</strong>.
        </p>

        {/* Live Trust Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto pt-1">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-base sm:text-xl font-bold text-cyan-400">1,320+</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400">Supported Apps</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-base sm:text-xl font-bold text-emerald-400">100%</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400">Refund Guarantee</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-base sm:text-xl font-bold text-indigo-400">&lt; 10s</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400">SMS Detection</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-base sm:text-xl font-bold text-amber-400">150+</div>
            <div className="text-[10px] sm:text-[11px] text-slate-400">Global Countries</div>
          </div>
        </div>
      </section>

      {/* 2. ACTIVE ORDERS LISTENING DRAWER */}
      {activeOrders.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <h2 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">
                Live Numbers ({activeOrders.length})
              </h2>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-400 shrink-0">
              Refreshing every 3s
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        {/* Country Selector Header */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4 sm:space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div>
              <label className="text-[11px] sm:text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5" />
                Step 1: Choose Country
              </label>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Selected:</span>
                <span className="text-amber-300 font-extrabold flex items-center gap-1.5">
                  {currentCountry.flag} {currentCountry.name} {currentCountry.prefix && `(${currentCountry.prefix})`}
                </span>
              </h3>
            </div>

            {/* Operator Selection */}
            {availableOperators.length > 0 && (
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Carrier:</span>
                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="bg-[#030712] border border-slate-700 text-xs font-semibold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 w-full sm:w-auto"
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

          {/* Quick Country: Exclusive Golden Indian Option as requested */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 🇮🇳 Indian Option - Rendered in rich GOLD colour */}
              <button
                type="button"
                onClick={() => handleCountrySelect("india")}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all active:scale-95 ${
                  selectedCountry.toLowerCase() === "india"
                    ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 border-2 border-yellow-200 ring-2 ring-amber-400/40"
                    : "bg-amber-950/40 border border-amber-500/60 text-amber-300 hover:bg-amber-900/50"
                }`}
              >
                <span className="text-2xl drop-shadow-sm">🇮🇳</span>
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm ${selectedCountry.toLowerCase() === "india" ? "text-slate-950 font-black" : "text-amber-200 font-bold"}`}>
                      India (+91)
                    </span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-black tracking-wider ${
                      selectedCountry.toLowerCase() === "india"
                        ? "bg-slate-950 text-amber-300"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      Priority Route
                    </span>
                  </div>
                  <div className={`text-[10px] ${selectedCountry.toLowerCase() === "india" ? "text-slate-800 font-bold" : "text-amber-400/80"}`}>
                    High Delivery Rate • Instant OTP
                  </div>
                </div>
              </button>

              {/* If user picked another country via dropdown, show active tag next to India */}
              {selectedCountry.toLowerCase() !== "india" && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/50 text-cyan-300 text-xs font-semibold">
                  <span className="text-lg">{currentCountry.flag}</span>
                  <div>
                    <div className="font-bold text-white text-xs">{currentCountry.name}</div>
                    <div className="text-[10px] text-slate-400">{currentCountry.prefix} (Active)</div>
                  </div>
                  <button
                    onClick={() => handleCountrySelect("india")}
                    className="ml-2 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition"
                  >
                    Reset to 🇮🇳 India
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Full Country Dropdown for all 150+ countries */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 border-t border-slate-800/80">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Or pick from all 150+ countries:
            </span>
            <select
              value={selectedCountry}
              onChange={(e) => handleCountrySelect(e.target.value)}
              className="bg-[#030712] border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 flex-1 max-w-xs"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code.toLowerCase() === "india" ? "⭐ " : ""}{c.flag} {c.name} {c.prefix ? `(${c.prefix})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. SERVICE FILTERS & SEARCH */}
        <div id="services-catalog" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Available Services</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                  {filteredProducts.length} Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Showing 10 services per page for fast browsing. Click any service to generate your number.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-auto sm:min-w-[280px]">
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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
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

        {/* 5. SERVICES GRID (10 Items per page) */}
        {loadingProducts ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading live stock & prices for {currentCountry.name}...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800 p-8 space-y-3">
            <p className="text-slate-300 text-sm font-semibold">No services found matching your search</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try switching the country to India or United States for the highest availability.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                handleCountrySelect("india");
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Exactly 10 Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {paginatedProducts.map((prod) => (
                <div
                  key={prod.code}
                  className="group relative rounded-2xl p-3.5 sm:p-4 bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all duration-200 flex flex-col justify-between gap-3 shadow-lg hover:shadow-cyan-500/5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center font-black text-cyan-300 text-sm group-hover:scale-105 transition shrink-0">
                          {prod.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition truncate">
                            {prod.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono truncate block">
                            {prod.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[10px] font-semibold text-emerald-400 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{prod.qty.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
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

            {/* Pagination Controls (10 items per page) */}
            {totalPages > 1 && (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400 text-center sm:text-left">
                  Showing <span className="font-bold text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                  <span className="font-bold text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of{" "}
                  <span className="font-bold text-cyan-400">{filteredProducts.length}</span> services
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden xs:inline">Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Compact page indicators */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && (
                              <span className="px-1 text-slate-500 text-xs">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(p)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                                currentPage === p
                                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20 font-black"
                                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition"
                  >
                    <span className="hidden xs:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 6. ORDER CONFIRMATION MODAL */}
      {buyingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-[#090d16] border border-cyan-500/40 p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Confirm Number Order</h3>
              </div>
              <button
                onClick={() => setBuyingProduct(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#030712] border border-slate-800 text-xs">
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

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setBuyingProduct(null)}
                className="flex-1 py-2.5 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={purchasing}
                className="flex-1 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition"
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
