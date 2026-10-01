import prisma from "@/lib/prisma";

export interface SystemSettingsMap {
  site_name: string;
  currency_symbol: string;
  currency_code: string;
  default_cost_per_request: number;
  min_wallet_balance: number;
  refund_on_failure: boolean;
  max_requests_per_minute: number;
  max_requests_per_day: number;
  registration_enabled: boolean;
  maintenance_mode: boolean;
  privacy_mask_phone: boolean;
  data_retention_days: number;
  webhook_secret: string;

  // Welcome & Referral Program
  welcome_bonus: number; // default: 15.0 (₹15 for new users)
  referral_enabled: boolean; // default: true
  referral_bonus: number; // default: 9.0 (₹9 per successful referral)
  referral_required_searches: number; // default: 2 (2 successful searches required)

  // Razorpay Gateway
  razorpay_enabled: boolean;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  razorpay_webhook_secret: string;

  // Email / SMTP Settings
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  smtp_from_name: string;
  smtp_from_email: string;
  app_url: string;
  require_email_verification: boolean;
}

const DEFAULT_SETTINGS: SystemSettingsMap = {
  site_name: "UnMaskPeople.in",
  currency_symbol: "₹",
  currency_code: "INR",
  default_cost_per_request: 3.5,
  min_wallet_balance: 0.0,
  refund_on_failure: true,
  max_requests_per_minute: 20,
  max_requests_per_day: 500,
  registration_enabled: true,
  maintenance_mode: false,
  privacy_mask_phone: true,
  data_retention_days: 90,
  webhook_secret: "whsec_unmaskpeople_mock_webhook_key_xyz",

  // Defaults as per user requirements
  welcome_bonus: 0.0,
  referral_enabled: false,
  referral_bonus: 0.0,
  referral_required_searches: 2,

  razorpay_enabled: false,
  razorpay_key_id: process.env.RAZORPAY_KEY_ID || "",
  razorpay_key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpay_webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET || "",

  // Email & Activation Defaults
  smtp_enabled: process.env.SMTP_ENABLED === "true",
  smtp_host: process.env.SMTP_HOST || "smtp.gmail.com",
  smtp_port: Number(process.env.SMTP_PORT) || 587,
  smtp_secure: process.env.SMTP_SECURE === "true",
  smtp_user: process.env.SMTP_USER || "",
  smtp_pass: process.env.SMTP_PASS || "",
  smtp_from_name: process.env.SMTP_FROM_NAME || "UnMaskPeople Security",
  smtp_from_email: process.env.SMTP_FROM_EMAIL || "no-reply@unmaskpeople.in",
  app_url: process.env.NEXT_PUBLIC_APP_URL || "https://unmaskpeople.in",
  require_email_verification: true,
};

export class SettingsService {
  static async getAllSettings(): Promise<SystemSettingsMap> {
    try {
      const records = await prisma.systemSetting.findMany();
      const settings: any = { ...DEFAULT_SETTINGS };

      for (const rec of records) {
        if (rec.key in settings) {
          if (rec.value === "true") {
            settings[rec.key] = true;
          } else if (rec.value === "false") {
            settings[rec.key] = false;
          } else if (
            !isNaN(Number(rec.value)) &&
            (rec.key.includes("cost") ||
              rec.key.includes("balance") ||
              rec.key.includes("max") ||
              rec.key.includes("days") ||
              rec.key.includes("bonus") ||
              rec.key.includes("searches"))
          ) {
            settings[rec.key] = Number(rec.value);
          } else {
            settings[rec.key] = rec.value;
          }
        }
      }

      return settings as SystemSettingsMap;
    } catch {
      // 2. Try Cloud Firestore
      try {
        const { db } = await import("@/lib/firebase");
        if (db) {
          const { doc, getDoc } = await import("firebase/firestore");
          const snap = await getDoc(doc(db, "system", "settings"));
          if (snap.exists()) {
            return { ...DEFAULT_SETTINGS, ...snap.data() } as SystemSettingsMap;
          }
        }
      } catch (fsErr) {
        // Fallback
      }
      return DEFAULT_SETTINGS;
    }
  }

  static async getSetting<K extends keyof SystemSettingsMap>(key: K): Promise<SystemSettingsMap[K]> {
    const all = await this.getAllSettings();
    return all[key];
  }

  static async updateSettings(updates: Partial<SystemSettingsMap>): Promise<SystemSettingsMap> {
    // 1. Save to Cloud Firestore
    try {
      const { db } = await import("@/lib/firebase");
      if (db) {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "system", "settings"), updates, { merge: true });
      }
    } catch (fsErr) {
      console.warn("Firestore updateSettings warning:", fsErr);
    }

    // 2. Save to Prisma if available
    try {
      for (const [key, value] of Object.entries(updates)) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    } catch (prismaErr) {
      // Prisma optional on serverless
    }

    return await this.getAllSettings();
  }
}
