/**
 * Sanitization utility for external API payloads to eliminate XSS and injection vulnerabilities
 */

export function escapeHtml(str: string): string {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Deeply sanitizes any object or primitive returned by external APIs
 * Also scrubs out any raw secrets, API tokens, or authorization headers
 */
export function sanitizeData(data: any, secretToScrub?: string): any {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    let cleaned = data;
    if (secretToScrub && secretToScrub.length >= 4) {
      cleaned = cleaned.replaceAll(secretToScrub, "••••••••••••••••");
    }
    // Scrub typical authorization tokens or live secret key patterns
    cleaned = cleaned.replace(/Bearer\s+([A-Za-z0-9_\-\.]{8,})/gi, "Bearer ••••••••••••••••");
    cleaned = cleaned.replace(/(api[-_]?key|secret|token)=([^&\s]+)/gi, "$1=••••••••••••••••");
    return cleaned;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, secretToScrub));
  }

  if (typeof data === "object") {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Do not allow prototype pollution
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        continue;
      }
      const lowerKey = key.toLowerCase();
      // Mask keys that look like secrets or auth tokens
      if (
        lowerKey.includes("secret") ||
        lowerKey.includes("apikey") ||
        lowerKey.includes("api_key") ||
        lowerKey.includes("auth_token") ||
        lowerKey === "authorization"
      ) {
        cleanObj[key] = "••••••••••••••••";
        continue;
      }

      cleanObj[key] = sanitizeData(value, secretToScrub);
    }
    return cleanObj;
  }

  return data;
}


/**
 * Extract flat key-value pairs suitable for quick SaaS card displays
 */
export function extractKeyValueSummary(obj: any, maxDepth = 2, currentDepth = 0): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};

  if (!obj || currentDepth > maxDepth) {
    return result;
  }

  // If passed an array of records, unwrap the first record or items
  if (Array.isArray(obj)) {
    if (obj.length === 0) return result;
    return extractKeyValueSummary(obj[0], maxDepth, currentDepth);
  }

  if (typeof obj !== "object") {
    return result;
  }

  // If wrapped in { found: 1, data: [ ... ] }, extract the inner record
  if (obj.data && (Array.isArray(obj.data) || typeof obj.data === "object")) {
    const inner = extractKeyValueSummary(obj.data, maxDepth, currentDepth);
    Object.assign(result, inner);
  }

  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (k === "data" && (Array.isArray(v) || typeof v === "object")) continue;

    let formattedKey = k
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/^./, (str) => str.toUpperCase());

    // Custom friendly labels
    if (k.toLowerCase() === "fname") formattedKey = "Father's Name";
    if (k.toLowerCase() === "id") formattedKey = "Identity Number";
    if (k.toLowerCase() === "mobile") formattedKey = "Mobile Number";
    if (k.toLowerCase() === "name") formattedKey = "Full Name";
    if (k.toLowerCase() === "address") formattedKey = "Registered Address";
    if (k.toLowerCase() === "found") formattedKey = "Records Found";

    if (typeof v === "string") {
      // Clean up exclamation-separated addresses
      let val = v;
      if (k.toLowerCase() === "address") {
        val = val.replace(/!+/g, ", ").replace(/^[\s,]+|[\s,]+$/g, "").trim();
      }
      result[formattedKey] = val;
    } else if (typeof v === "number" || typeof v === "boolean") {
      result[formattedKey] = v;
    } else if (typeof v === "object" && !Array.isArray(v) && currentDepth < maxDepth) {
      const nested = extractKeyValueSummary(v, maxDepth, currentDepth + 1);
      for (const [nk, nv] of Object.entries(nested)) {
        result[`${formattedKey} - ${nk}`] = nv;
      }
    }
  }

  return result;
}

