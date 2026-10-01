import { decryptSecret } from "@/lib/crypto";
import { sanitizeData, extractKeyValueSummary } from "@/lib/sanitizer";
import prisma from "@/lib/prisma";

export interface ApiExecutionInput {
  phone: string;
  countryCode?: string;
  apiConfigId?: string; // Optional: specify or default to primary active API
}

export interface ApiExecutionResult {
  success: boolean;
  httpStatus: number;
  latencyMs: number;
  rawResponse: any;
  sanitizedResult: Record<string, any>;
  message: string;
  error?: string;
  apiName: string;
  cost: number;
}

export class ApiExecutorService {
  /**
   * Resolve nested property from object by path (e.g. "data.status" or "result.code")
   */
  static getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split(".");
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  /**
   * Determine whether an API response is considered successful based on configured mapping
   */
  static evaluateSuccess(
    data: any,
    httpStatus: number,
    config: {
      successField: string;
      successValues: string;
      messageField: string;
    }
  ): { isSuccess: boolean; message: string } {
    // If HTTP status is >= 400, default to failure
    if (httpStatus >= 400) {
      const msg = this.getNestedValue(data, config.messageField) || `HTTP error ${httpStatus}`;
      return { isSuccess: false, message: String(msg) };
    }

    // If no specific successField is configured, HTTP 2xx is success
    if (!config.successField) {
      return { isSuccess: true, message: "Request completed successfully" };
    }

    const val = this.getNestedValue(data, config.successField);
    const validTokens = (config.successValues || "success,true,200,ok,valid,1")
      .split(",")
      .map((s) => s.trim().toLowerCase());

    const stringVal = String(val).toLowerCase();
    const isSuccess =
      validTokens.includes(stringVal) ||
      val === true ||
      val === 200 ||
      val === 1 ||
      (typeof val === "number" && val > 0) ||
      (Array.isArray(data?.data) && data.data.length > 0);

    const message =
      this.getNestedValue(data, config.messageField) ||
      (isSuccess ? "Lookup completed successfully" : "Provider reported unsuccessful lookup");

    return { isSuccess, message: String(message) };
  }

  /**
   * Execute external API request server-side
   */
  static async execute(
    config: any,
    phone: string,
    countryCode = "+91"
  ): Promise<ApiExecutionResult> {
    const startTime = Date.now();
    let httpStatus = 500;
    let latencyMs = 0;
    let secret = "";

    try {
      if (process.env.PHONE_SEARCH_API_KEY) {
        secret = process.env.PHONE_SEARCH_API_KEY;
      } else if (config.encryptedSecret) {
        secret = decryptSecret(config.encryptedSecret);
      }

      const method = (config.method || "POST").toUpperCase();
      let url = config.endpoint.trim();
      if (url.includes("localhost:3000") && process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
        url = url.replace("http://localhost:3000", process.env.NEXT_PUBLIC_APP_URL);
      }

      const headers: Record<string, string> = {
        "Accept": "application/json",
        "User-Agent": "UnMaskPeople-Core-Proxy/1.0",
      };

      // Custom headers
      if (config.headers) {
        try {
          const parsedHeaders = JSON.parse(config.headers);
          Object.assign(headers, parsedHeaders);
        } catch (e) {
          console.warn("Failed to parse custom headers:", e);
        }
      }


      // Apply Authentication
      switch (config.authType) {
        case "BEARER":
        case "BEARER_TOKEN":
          if (secret) headers["Authorization"] = `Bearer ${secret}`;
          break;
        case "API_KEY_HEADER":
          if (secret) headers[config.authKeyName || "X-Api-Key"] = secret;
          break;
        case "CUSTOM_HEADER":
          if (secret && config.authKeyName) headers[config.authKeyName] = secret;
          break;
        case "API_KEY_QUERY":
          if (secret) {
            const separator = url.includes("?") ? "&" : "?";
            url += `${separator}${encodeURIComponent(config.authKeyName || "api_key")}=${encodeURIComponent(secret)}`;
          }
          break;
        default:
          break;
      }

      let requestBody: string | undefined = undefined;

      // Handle GET vs POST/PUT body and parameters
      if (method === "GET") {
        const separator = url.includes("?") ? "&" : "?";
        url += `${separator}${encodeURIComponent(config.phoneParameter || "phone")}=${encodeURIComponent(phone)}`;
      } else {
        headers["Content-Type"] = "application/json";

        if (config.requestTemplate && config.requestTemplate.trim()) {
          // Replace template placeholders like {{phone}} or {{countryCode}}
          let templated = config.requestTemplate
            .replace(/\{\{phone\}\}/g, phone)
            .replace(/\{\{countryCode\}\}/g, countryCode)
            .replace(/\{\{country\}\}/g, countryCode);
          requestBody = templated;
        } else {
          // Default JSON payload
          const bodyPayload: Record<string, any> = {};
          bodyPayload[config.phoneParameter || "phone"] = phone;
          bodyPayload["countryCode"] = countryCode;
          requestBody = JSON.stringify(bodyPayload);
        }
      }

      // Execute fetch with abort controller for timeout
      const controller = new AbortController();
      const timeoutMs = config.timeout || 10000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      httpStatus = response.status;
      latencyMs = Date.now() - startTime;

      let responseData: any;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = { rawText: text };
        }
      }

      // Evaluate success condition
      const { isSuccess, message } = this.evaluateSuccess(responseData, httpStatus, {
        successField: config.successField,
        successValues: config.successValues,
        messageField: config.messageField,
      });

      // Extract result field if specified
      let targetedResult = responseData;
      if (config.resultField && responseData[config.resultField]) {
        targetedResult = responseData[config.resultField];
      }

      const cleanSummary = extractKeyValueSummary(targetedResult);
      const sanitizedRaw = sanitizeData(responseData, secret);

      return {
        success: isSuccess,
        httpStatus,
        latencyMs,
        rawResponse: sanitizedRaw,
        sanitizedResult: cleanSummary,
        message: secret && message.includes(secret) ? message.replaceAll(secret, "••••••••••••••••") : message,
        apiName: config.name,
        cost: config.cost,
      };
    } catch (err: any) {
      latencyMs = Date.now() - startTime;
      let errorMsg = err.message || "Failed to communicate with external provider";
      if (err.name === "AbortError") {
        errorMsg = `API request timed out after ${config.timeout || 10000}ms`;
        httpStatus = 504;
      }

      // Ensure secret is never leaked in error messages or response dumps
      if (secret && typeof errorMsg === "string" && errorMsg.includes(secret)) {
        errorMsg = errorMsg.replaceAll(secret, "••••••••••••••••");
      }

      return {
        success: false,
        httpStatus: httpStatus || 500,
        latencyMs,
        rawResponse: { error: errorMsg },
        sanitizedResult: { Error: errorMsg },
        message: errorMsg,
        error: errorMsg,
        apiName: config.name,
        cost: config.cost,
      };
    }

  }

  /**
   * Test an API configuration in the admin panel
   */
  static async testConfiguration(config: any, testPhone = "+919876543210") {
    const result = await this.execute(config, testPhone, "+91");

    // Update health metrics in database if existing config
    if (config.id) {
      await prisma.apiConfig.update({
        where: { id: config.id },
        data: {
          lastTestedAt: new Date(),
          lastTestStatus: result.success ? "HEALTHY" : "ERROR",
          lastTestLatencyMs: result.latencyMs,
          lastTestError: result.error || null,
        },
      }).catch(() => {});
    }

    return result;
  }
}
