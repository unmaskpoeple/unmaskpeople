/**
 * Curated 5SIM Services and Countries Directory
 * Contains categorized popular services, display names, badge colors, and helpers.
 */

export interface ServiceMeta {
  code: string;
  name: string;
  category: "popular" | "social" | "ai" | "messaging" | "entertainment" | "finance" | "shopping" | "other";
  iconName?: string;
  color?: string;
}

export const POPULAR_SERVICES: ServiceMeta[] = [
  { code: "telegram", name: "Telegram", category: "messaging", color: "from-sky-500 to-blue-600" },
  { code: "whatsapp", name: "WhatsApp", category: "messaging", color: "from-emerald-500 to-green-600" },
  { code: "openai", name: "OpenAI / ChatGPT", category: "ai", color: "from-teal-400 to-emerald-600" },
  { code: "claudeai", name: "Claude AI (Anthropic)", category: "ai", color: "from-amber-500 to-orange-600" },
  { code: "google", name: "Google & YouTube", category: "popular", color: "from-red-500 to-yellow-500" },
  { code: "instagram", name: "Instagram & Threads", category: "social", color: "from-pink-500 via-rose-500 to-yellow-500" },
  { code: "tiktok", name: "TikTok / Douyin", category: "social", color: "from-cyan-400 to-pink-500" },
  { code: "discord", name: "Discord", category: "messaging", color: "from-indigo-500 to-purple-600" },
  { code: "twitter", name: "Twitter / X", category: "social", color: "from-slate-400 to-slate-200" },
  { code: "steam", name: "Steam", category: "entertainment", color: "from-blue-600 to-slate-700" },
  { code: "amazon", name: "Amazon", category: "shopping", color: "from-amber-400 to-orange-500" },
  { code: "apple", name: "Apple ID / iCloud", category: "popular", color: "from-slate-300 to-slate-500" },
  { code: "microsoft", name: "Microsoft / Hotmail", category: "popular", color: "from-blue-500 to-cyan-400" },
  { code: "netflix", name: "Netflix", category: "entertainment", color: "from-red-600 to-rose-700" },
  { code: "uber", name: "Uber", category: "popular", color: "from-zinc-400 to-zinc-700" },
  { code: "airbnb", name: "Airbnb", category: "popular", color: "from-rose-500 to-pink-600" },
  { code: "tinder", name: "Tinder", category: "social", color: "from-rose-500 to-orange-500" },
  { code: "facebook", name: "Facebook", category: "social", color: "from-blue-600 to-indigo-700" },
  { code: "snapchat", name: "Snapchat", category: "social", color: "from-yellow-400 to-amber-500" },
  { code: "spotify", name: "Spotify", category: "entertainment", color: "from-emerald-400 to-green-600" },
  { code: "linkedin", name: "LinkedIn", category: "social", color: "from-sky-600 to-blue-700" },
  { code: "deepseek", name: "DeepSeek", category: "ai", color: "from-blue-500 to-indigo-600" },
  { code: "gemini", name: "Google Gemini", category: "ai", color: "from-blue-400 to-purple-500" },
  { code: "roblox", name: "Roblox", category: "entertainment", color: "from-red-500 to-red-700" },
  { code: "paypal", name: "PayPal", category: "finance", color: "from-blue-500 to-sky-600" },
  { code: "coinbase", name: "Coinbase", category: "finance", color: "from-blue-600 to-indigo-600" },
  { code: "aliexpress", name: "AliExpress", category: "shopping", color: "from-orange-500 to-red-500" },
  { code: "ebay", name: "eBay", category: "shopping", color: "from-yellow-500 to-green-500" },
  { code: "line", name: "Line", category: "messaging", color: "from-green-500 to-emerald-600" },
  { code: "viber", name: "Viber", category: "messaging", color: "from-purple-500 to-indigo-600" },
  { code: "wechat", name: "WeChat", category: "messaging", color: "from-emerald-500 to-teal-600" },
  { code: "bumble", name: "Bumble", category: "social", color: "from-amber-400 to-yellow-500" },
];

export const POPULAR_COUNTRIES = [
  { code: "usa", name: "United States", flag: "🇺🇸", prefix: "+1", priority: 1 },
  { code: "england", name: "United Kingdom", flag: "🇬🇧", prefix: "+44", priority: 2 },
  { code: "india", name: "India", flag: "🇮🇳", prefix: "+91", priority: 3 },
  { code: "canada", name: "Canada", flag: "🇨🇦", prefix: "+1", priority: 4 },
  { code: "germany", name: "Germany", flag: "🇩🇪", prefix: "+49", priority: 5 },
  { code: "france", name: "France", flag: "🇫🇷", prefix: "+33", priority: 6 },
  { code: "netherlands", name: "Netherlands", flag: "🇳🇱", prefix: "+31", priority: 7 },
  { code: "indonesia", name: "Indonesia", flag: "🇮🇩", prefix: "+62", priority: 8 },
  { code: "brazil", name: "Brazil", flag: "🇧🇷", prefix: "+55", priority: 9 },
  { code: "philippines", name: "Philippines", flag: "🇵🇭", prefix: "+63", priority: 10 },
  { code: "poland", name: "Poland", flag: "🇵🇱", prefix: "+48", priority: 11 },
  { code: "spain", name: "Spain", flag: "🇪🇸", prefix: "+34", priority: 12 },
  { code: "vietnam", name: "Vietnam", flag: "🇻🇳", prefix: "+84", priority: 13 },
  { code: "malaysia", name: "Malaysia", flag: "🇲🇾", prefix: "+60", priority: 14 },
  { code: "nigeria", name: "Nigeria", flag: "🇳🇬", prefix: "+234", priority: 15 },
  { code: "pakistan", name: "Pakistan", flag: "🇵🇰", prefix: "+92", priority: 16 },
  { code: "kenya", name: "Kenya", flag: "🇰🇪", prefix: "+254", priority: 17 },
  { code: "thailand", name: "Thailand", flag: "🇹🇭", prefix: "+66", priority: 18 },
  { code: "hongkong", name: "Hong Kong", flag: "🇭🇰", prefix: "+852", priority: 19 },
  { code: "australia", name: "Australia", flag: "🇦🇺", prefix: "+61", priority: 20 },
];

// Helper to convert 2-letter ISO to Flag emoji
export function getCountryFlag(isoCode?: string): string {
  if (!isoCode || isoCode.length !== 2) return "🌐";
  const codePoints = isoCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Clean Service Display Formatter
export function formatServiceName(serviceCode: string): string {
  const match = POPULAR_SERVICES.find((s) => s.code.toLowerCase() === serviceCode.toLowerCase());
  if (match) return match.name;

  // Formatting heuristics
  return serviceCode
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Country code to nice formatted name
export function formatCountryName(countryCode: string): string {
  const match = POPULAR_COUNTRIES.find((c) => c.code.toLowerCase() === countryCode.toLowerCase());
  if (match) return match.name;

  return countryCode
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
