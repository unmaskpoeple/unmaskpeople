import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { AuditService } from "@/services/audit.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req);
    const api = await prisma.apiConfig.findUnique({
      where: { id: params.id },
    });

    if (!api) {
      return NextResponse.json({ error: "API config not found" }, { status: 404 });
    }

    return NextResponse.json({
      api: {
        ...api,
        encryptedSecret: api.encryptedSecret ? maskSecret(api.encryptedSecret) : "",
        hasSecret: !!api.encryptedSecret,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();

    const existing = await prisma.apiConfig.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "API config not found" }, { status: 404 });
    }

    const updates: any = {};
    if (body.name) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.endpoint) updates.endpoint = body.endpoint.trim();
    if (body.method) updates.method = body.method.toUpperCase();
    if (body.authType) updates.authType = body.authType;
    if (body.authKeyName !== undefined) updates.authKeyName = body.authKeyName?.trim() || null;
    if (body.headers !== undefined) {
      updates.headers = body.headers ? (typeof body.headers === "string" ? body.headers : JSON.stringify(body.headers)) : null;
    }
    if (body.requestTemplate !== undefined) updates.requestTemplate = body.requestTemplate || null;
    if (body.phoneParameter) updates.phoneParameter = body.phoneParameter.trim();
    if (body.cost !== undefined) updates.cost = Number(body.cost);
    if (body.timeout !== undefined) updates.timeout = Number(body.timeout);
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
    if (body.successField !== undefined) updates.successField = body.successField.trim();
    if (body.successValues !== undefined) updates.successValues = body.successValues.trim();
    if (body.messageField !== undefined) updates.messageField = body.messageField.trim();
    if (body.resultField !== undefined) updates.resultField = body.resultField.trim();

    // Only update secret if user typed a new one and didn't leave placeholder
    if (body.secret && !body.secret.includes("••••")) {
      updates.encryptedSecret = encryptSecret(body.secret.trim());
    }

    const updated = await prisma.apiConfig.update({
      where: { id: params.id },
      data: updates,
    });

    await AuditService.record({
      adminId: admin.id,
      action: "UPDATE_API_CONFIG",
      targetType: "API_CONFIG",
      targetId: params.id,
      metadata: { name: updated.name, endpoint: updated.endpoint, isActive: updated.isActive },
    });

    return NextResponse.json({
      success: true,
      message: "API configuration updated successfully.",
      api: {
        ...updated,
        encryptedSecret: updated.encryptedSecret ? maskSecret(updated.encryptedSecret) : "",
        hasSecret: !!updated.encryptedSecret,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(req);
    const existing = await prisma.apiConfig.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "API config not found" }, { status: 404 });
    }

    await prisma.apiConfig.delete({
      where: { id: params.id },
    });

    await AuditService.record({
      adminId: admin.id,
      action: "DELETE_API_CONFIG",
      targetType: "API_CONFIG",
      targetId: params.id,
      metadata: { name: existing.name },
    });

    return NextResponse.json({
      success: true,
      message: "API configuration deleted successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
