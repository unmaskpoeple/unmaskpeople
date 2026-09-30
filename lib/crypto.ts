import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const DEFAULT_SECRET_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function getKey(): Buffer {
  return Buffer.from(DEFAULT_SECRET_KEY.slice(0, 64), "hex");
}

/**
 * Encrypt a plaintext secret using AES-256-GCM
 */
export function encryptSecret(text: string): string {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(12);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    // Format: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return text;
  }
}

/**
 * Decrypt a secret using AES-256-GCM
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return "";
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) {
      // If not in encrypted format (e.g. legacy plain demo secret), return as is
      return encryptedPayload;
    }
    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return encryptedPayload;
  }
}

/**
 * Mask a phone number for privacy display (e.g., +91 98*****3210)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.trim();
  // If it has spaces, split into country code and number
  const parts = cleaned.split(" ");
  if (parts.length > 1) {
    const code = parts[0];
    const num = parts.slice(1).join("");
    if (num.length <= 4) return `${code} ****`;
    const visiblePrefix = num.slice(0, 2);
    const visibleSuffix = num.slice(-4);
    const maskedLength = Math.max(3, num.length - 6);
    return `${code} ${visiblePrefix}${"*".repeat(maskedLength)}${visibleSuffix}`;
  }

  // Without space
  if (cleaned.length <= 6) {
    return cleaned.slice(0, 2) + "****";
  }
  const prefix = cleaned.slice(0, 4);
  const suffix = cleaned.slice(-4);
  const maskedCount = Math.max(3, cleaned.length - 8);
  return `${prefix}${"*".repeat(maskedCount)}${suffix}`;
}

/**
 * Hash a phone number with SHA-256 for duplicate lookup and privacy retention
 */
export function hashPhoneNumber(phone: string): string {
  const normalized = phone.replace(/[^0-9+]/g, "");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Mask an API key/secret for admin view (e.g., ••••••••••••••••)
 * Never leaks raw prefix or suffix to protect live credentials
 */
export function maskSecret(secret: string): string {
  if (!secret) return "";
  return "••••••••••••••••";
}

