import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { ApiExecutorService } from "@/services/api-executor.service";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();

    const {
      id,
      endpoint,
      method,
      authType,
      authKeyName,
      secret,
      headers,
      requestTemplate,
      phoneParameter,
      timeout,
      successField,
      successValues,
      messageField,
      resultField,
      testPhone,
    } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint URL is required to run test." }, { status: 400 });
    }

    // If testing an existing config and secret wasn't re-typed, fetch encryptedSecret from database
    let encryptedSecret = null;
    if (secret && !secret.includes("••••")) {
      encryptedSecret = encryptSecret(secret.trim());
    } else if (id) {
      const existing = await prisma.apiConfig.findUnique({ where: { id } });
      if (existing) encryptedSecret = existing.encryptedSecret;
    }

    const testConfig = {
      id,
      name: body.name || "Test API",
      endpoint: endpoint.trim(),
      method: (method || "POST").toUpperCase(),
      authType: authType || "NONE",
      authKeyName: authKeyName?.trim() || null,
      encryptedSecret,
      headers: headers ? (typeof headers === "string" ? headers : JSON.stringify(headers)) : null,
      requestTemplate: requestTemplate || null,
      phoneParameter: phoneParameter?.trim() || "phone",
      timeout: Number(timeout) || 10000,
      cost: Number(body.cost) || 0,
      successField: successField?.trim() || "status",
      successValues: successValues?.trim() || "success,true,200,OK,valid",
      messageField: messageField?.trim() || "message",
      resultField: resultField?.trim() || "data",
    };

    const result = await ApiExecutorService.testConfiguration(
      testConfig,
      testPhone?.trim() || "+919876543210"
    );

    return NextResponse.json({
      success: result.success,
      httpStatus: result.httpStatus,
      latencyMs: result.latencyMs,
      sanitizedResult: result.sanitizedResult,
      rawResponse: result.rawResponse,
      message: result.message,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
