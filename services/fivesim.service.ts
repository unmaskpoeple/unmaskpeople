import prisma from "@/lib/prisma";
import { formatServiceName, formatCountryName, getCountryFlag } from "@/lib/fivesim-catalog";

const CARRIER_API_BASE = "https://5sim.net/v1";
const FIVESIM_BASE_URL = CARRIER_API_BASE;

export interface FiveSimProfile {
  id: number;
  email: string;
  balance: number;
  rating: number;
  frozen_balance?: number;
  total_active_orders?: number;
}

export interface FiveSimCountry {
  code: string;
  name: string;
  flag: string;
  prefix: string;
  operators: string[];
}

export interface FiveSimProduct {
  code: string;
  name: string;
  qty: number;
  priceWholesaleUsd: number;
  priceCustomerUsd: number;
  priceCustomerInr: number;
  category?: string;
}

export interface FiveSimOrderResponse {
  id: number;
  phone: string;
  operator: string;
  product: string;
  price: number;
  status: "PENDING" | "RECEIVED" | "CANCELED" | "TIMEOUT" | "FINISHED" | "BANNED";
  expires: string;
  sms: Array<{
    id?: number;
    created_at?: string;
    date?: string;
    sender: string;
    text: string;
    code: string;
  }>;
  created_at: string;
  country: string;
}

// In-Memory Caches for super fast response times
let countriesCache: { data: FiveSimCountry[]; expiresAt: number } | null = null;
const productsCache = new Map<string, { data: FiveSimProduct[]; expiresAt: number }>();
let pricingConfigCache: { markupPercent: number; minPriceUsd: number; exchangeRateInr: number; expiresAt: number } | null = null;

export class FiveSimService {
  private static getApiKey(): string {
    const key = process.env.FIVESIM_API_KEY;
    if (!key) {
      throw new Error("FIVESIM_API_KEY is not configured in environment variables.");
    }
    return key.trim();
  }

  /**
   * Fetch current pricing configuration (cached for 60s)
   */
  static async getPricingConfig() {
    const now = Date.now();
    if (pricingConfigCache && pricingConfigCache.expiresAt > now) {
      return pricingConfigCache;
    }

    let markupPercent = Number(process.env.PRICE_MARKUP_PERCENT ?? 40);
    let minPriceUsd = Number(process.env.MIN_PRICE_USD ?? 0.15);
    let exchangeRateInr = Number(process.env.EXCHANGE_RATE_INR ?? 86.5);

    // 1. Try Cloud Firestore (Primary online cloud configuration - strictly namespaced)
    try {
      const { db } = await import("@/lib/firebase");
      const { FS_COLLECTIONS } = await import("@/lib/collections");
      if (db) {
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, FS_COLLECTIONS.PRICING, "fivesim_pricing"));
        if (snap.exists()) {
          const fsData = snap.data();
          if (fsData.markupPercent !== undefined && !isNaN(Number(fsData.markupPercent))) {
            markupPercent = Number(fsData.markupPercent);
          }
          if (fsData.minPriceUsd !== undefined && !isNaN(Number(fsData.minPriceUsd))) {
            minPriceUsd = Number(fsData.minPriceUsd);
          }
          if (fsData.exchangeRateInr !== undefined && !isNaN(Number(fsData.exchangeRateInr))) {
            exchangeRateInr = Number(fsData.exchangeRateInr);
          }
          pricingConfigCache = {
            markupPercent,
            minPriceUsd,
            exchangeRateInr,
            expiresAt: now + 30_000,
          };
          return pricingConfigCache;
        }
      }
    } catch (fsPricingErr) {
      // Continue to Prisma fallback
    }

    // 2. Try Prisma fallback
    try {
      const settingRows = await prisma.systemSetting.findMany({
        where: {
          key: { in: ["PRICE_MARKUP_PERCENT", "MIN_PRICE_USD", "EXCHANGE_RATE_INR"] },
        },
      });

      for (const row of settingRows) {
        if (row.key === "PRICE_MARKUP_PERCENT" && !isNaN(Number(row.value))) {
          markupPercent = Number(row.value);
        } else if (row.key === "MIN_PRICE_USD" && !isNaN(Number(row.value))) {
          minPriceUsd = Number(row.value);
        } else if (row.key === "EXCHANGE_RATE_INR" && !isNaN(Number(row.value))) {
          exchangeRateInr = Number(row.value);
        }
      }
    } catch {
      // Prisma optional fallback
    }

    pricingConfigCache = {
      markupPercent,
      minPriceUsd,
      exchangeRateInr,
      expiresAt: now + 60_000,
    };

    return pricingConfigCache;
  }

  /**
   * Calculate customer prices from wholesale carrier cost
   */
  static calculateCustomerPrice(wholesaleCostUsd: number, markupPercent: number, minPriceUsd: number, exchangeRateInr: number) {
    const wholesale = Number(wholesaleCostUsd) || 0.10;
    const markupMultiplier = 1 + (markupPercent / 100);
    const calculated = Math.round(wholesale * markupMultiplier * 100) / 100;
    const customerUsd = Math.max(minPriceUsd, calculated);
    const customerInr = Math.max(Math.round(minPriceUsd * exchangeRateInr), Math.round(customerUsd * exchangeRateInr));

    return {
      priceWholesaleUsd: wholesale,
      priceCustomerUsd: customerUsd,
      priceCustomerInr: customerInr,
    };
  }

  /**
   * Fetch carrier account profile and live balance
   */
  static async getProfile(): Promise<FiveSimProfile> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${FIVESIM_BASE_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Carrier Profile Request failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return {
      id: data.id,
      email: data.email,
      balance: Number(data.balance ?? 0),
      rating: Number(data.rating ?? 0),
      frozen_balance: Number(data.frozen_balance ?? 0),
      total_active_orders: Number(data.total_active_orders ?? 0),
    };
  }

  /**
   * Get all supported countries with flags, prefixes, and operators
   */
  static async getCountries(): Promise<FiveSimCountry[]> {
    const now = Date.now();
    if (countriesCache && countriesCache.expiresAt > now) {
      return countriesCache.data;
    }

    const apiKey = this.getApiKey();
    const res = await fetch(`${FIVESIM_BASE_URL}/guest/countries`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch countries from carrier network: ${res.status}`);
    }

    const data: Record<string, any> = await res.json();
    const countries: FiveSimCountry[] = [];

    for (const [code, info] of Object.entries(data)) {
      if (!info) continue;
      const isoKey = info.iso ? Object.keys(info.iso)[0] : undefined;
      const prefixKey = info.prefix ? Object.keys(info.prefix)[0] : "";
      
      const operators: string[] = [];
      for (const key of Object.keys(info)) {
        if (!["iso", "prefix", "text_en", "text_ru"].includes(key) && typeof info[key] === "object") {
          operators.push(key);
        }
      }

      countries.push({
        code,
        name: info.text_en || formatCountryName(code),
        flag: getCountryFlag(isoKey),
        prefix: prefixKey,
        operators,
      });
    }

    // Sort with popular countries first
    const popularOrder = ["usa", "england", "india", "canada", "germany", "france", "netherlands", "indonesia", "brazil", "philippines", "poland", "spain", "vietnam", "malaysia", "nigeria", "pakistan"];
    countries.sort((a, b) => {
      const idxA = popularOrder.indexOf(a.code);
      const idxB = popularOrder.indexOf(b.code);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    countriesCache = {
      data: countries,
      expiresAt: now + 600_000, // 10 minutes
    };

    return countries;
  }

  /**
   * Get available products (services) with live stock and pricing for a country
   */
  static async getProducts(country: string = "usa", operator: string = "any"): Promise<FiveSimProduct[]> {
    const cacheKey = `${country}_${operator}`;
    const now = Date.now();
    const cached = productsCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const apiKey = this.getApiKey();
    const pricing = await this.getPricingConfig();

    const res = await fetch(`${FIVESIM_BASE_URL}/guest/products/${encodeURIComponent(country)}/${encodeURIComponent(operator)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to fetch carrier products (${res.status}): ${errText}`);
    }

    const raw: Record<string, { Category: string; Qty: number; Price: number }> = await res.json();
    const products: FiveSimProduct[] = [];

    for (const [code, val] of Object.entries(raw)) {
      if (!val || val.Qty <= 0) continue;

      const calc = this.calculateCustomerPrice(
        val.Price,
        pricing.markupPercent,
        pricing.minPriceUsd,
        pricing.exchangeRateInr
      );

      products.push({
        code,
        name: formatServiceName(code),
        qty: val.Qty,
        category: val.Category,
        priceWholesaleUsd: calc.priceWholesaleUsd,
        priceCustomerUsd: calc.priceCustomerUsd,
        priceCustomerInr: calc.priceCustomerInr,
      });
    }

    // Sort by popular and stock count
    products.sort((a, b) => b.qty - a.qty);

    productsCache.set(cacheKey, {
      data: products,
      expiresAt: now + 45_000, // 45 seconds cache
    });

    return products;
  }

  /**
   * Purchase an activation phone number
   */
  static async buyActivation(params: {
    country: string;
    operator: string;
    product: string;
  }): Promise<FiveSimOrderResponse> {
    const { country, operator, product } = params;
    const apiKey = this.getApiKey();

    const url = `${FIVESIM_BASE_URL}/user/buy/activation/${encodeURIComponent(country)}/${encodeURIComponent(operator || "any")}/${encodeURIComponent(product)}`;
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      let friendlyError = `Purchase failed: ${errorText}`;

      if (errorText.includes("no free phones") || res.status === 400 && errorText.toLowerCase().includes("no")) {
        friendlyError = `No available phone numbers for "${formatServiceName(product)}" in ${formatCountryName(country)} right now. Please choose another country or try again shortly.`;
      } else if (errorText.includes("not enough user balance")) {
        friendlyError = "System supplier replenishment in progress. Please notify admin or try again in a few minutes.";
      } else if (errorText.includes("bad operator")) {
        friendlyError = `Operator "${operator}" is not supported for this country. Please select 'Any Operator'.`;
      }

      const err = new Error(friendlyError);
      (err as any).statusCode = res.status;
      (err as any).rawError = errorText;
      throw err;
    }

    const data: FiveSimOrderResponse = await res.json();
    return data;
  }

  /**
   * Check order status and incoming SMS
   */
  static async checkOrder(orderId: number | string): Promise<FiveSimOrderResponse> {
    const apiKey = this.getApiKey();
    const url = `${FIVESIM_BASE_URL}/user/check/${encodeURIComponent(orderId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Order status check failed (${res.status}): ${errorText}`);
    }

    return await res.json();
  }

  /**
   * Finish / complete order
   */
  static async finishOrder(orderId: number | string): Promise<FiveSimOrderResponse> {
    const apiKey = this.getApiKey();
    const url = `${FIVESIM_BASE_URL}/user/finish/${encodeURIComponent(orderId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to finish order (${res.status}): ${errorText}`);
    }

    return await res.json();
  }

  /**
   * Cancel order and refund wholesale cost back to carrier
   */
  static async cancelOrder(orderId: number | string): Promise<FiveSimOrderResponse> {
    const apiKey = this.getApiKey();
    const url = `${FIVESIM_BASE_URL}/user/cancel/${encodeURIComponent(orderId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to cancel order (${res.status}): ${errorText}`);
    }

    return await res.json();
  }

  /**
   * Ban bad/burned number on carrier
   */
  static async banOrder(orderId: number | string): Promise<FiveSimOrderResponse> {
    const apiKey = this.getApiKey();
    const url = `${FIVESIM_BASE_URL}/user/ban/${encodeURIComponent(orderId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to ban number (${res.status}): ${errorText}`);
    }

    return await res.json();
  }
}
