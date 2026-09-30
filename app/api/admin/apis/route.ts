import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { AuditService } from "@/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const apis = await prisma.apiConfig.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { requests: true },
        },
      },
    });

    // Mask secrets before sending to frontend! Never leak raw credentials!
    const sanitizedApis = apis.map((api) => ({
      ...api,
      encryptedSecret: api.encryptedSecret ? maskSecret(api.encryptedSecret) : "",
      hasSecret: !!api.encryptedSecret,
    }));

    return NextResponse.json({ apis: sanitizedApis });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();

    const {
      name,
      description,
      endpoint,
      method,
      authType,
      authKeyName,
      secret,
      headers,
      requestTemplate,
      phoneParameter,
      cost,
      timeout,
      isActive,
      successField,
      successValues,
      messageField,
      resultField,
    } = body;

    if (!name || !endpoint) {
      return NextResponse.json(
        { error: "API Name and Endpoint URL are required." },
        { status: 400 }
      );
    }

    // Encrypt secret server-side
    const encryptedSecret = secret ? encryptSecret(secret.trim()) : null;

    const newConfig = await prisma.apiConfig.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        endpoint: endpoint.trim(),
        method: (method || "POST").toUpperCase(),
        authType: authType || "NONE",
        authKeyName: authKeyName?.trim() || null,
        encryptedSecret,
        headers: headers ? (typeof headers === "string" ? headers : JSON.stringify(headers)) : null,
        requestTemplate: requestTemplate || null,
        phoneParameter: phoneParameter?.trim() || "phone",
        cost: Number(cost) >= 0 ? Number(cost) : 3.5,
        timeout: Number(timeout) > 0 ? Number(timeout) : 10000,
        isActive: isActive !== false,
        successField: successField?.trim() || "status",
        successValues: successValues?.trim() || "success,true,200,OK,valid",
        messageField: messageField?.trim() || "message",
        resultField: resultField?.trim() || "data",
      },
    });

    await AuditService.record({
      adminId: admin.id,
      action: "CREATE_API_CONFIG",
      targetType: "API_CONFIG",
      targetId: newConfig.id,
      metadata: { name: newConfig.name, endpoint: newConfig.endpoint, cost: newConfig.cost },
    });

    return NextResponse.json({
      success: true,
      message: "API configuration created successfully.",
      api: {
        ...newConfig,
        encryptedSecret: newConfig.encryptedSecret ? maskSecret(newConfig.encryptedSecret) : "",
        hasSecret: !!newConfig.encryptedSecret,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
