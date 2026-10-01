import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { AuditService } from "@/services/audit.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req);

    // 1. Try Firestore
    if (db) {
      try {
        const snap = await getDoc(doc(db, "api_configs", params.id));
        if (snap.exists()) {
          const api = snap.data();
          return NextResponse.json({
            api: {
              id: params.id,
              ...api,
              encryptedSecret: api.encryptedSecret ? maskSecret(api.encryptedSecret) : "",
              hasSecret: !!api.encryptedSecret,
            },
          });
        }
      } catch (e) {
        // Fallback
      }
    }

    // 2. Try Prisma
    try {
      const api = await prisma.apiConfig.findUnique({
        where: { id: params.id },
      });

      if (api) {
        return NextResponse.json({
          api: {
            ...api,
            encryptedSecret: api.encryptedSecret ? maskSecret(api.encryptedSecret) : "",
            hasSecret: !!api.encryptedSecret,
          },
        });
      }
    } catch (e) {
      // Prisma missing
    }

    return NextResponse.json({ error: "API config not found" }, { status: 404 });
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
    if (body.successField) updates.successField = body.successField.trim();
    if (body.successValues) updates.successValues = body.successValues.trim();
    if (body.messageField) updates.messageField = body.messageField.trim();
    if (body.resultField) updates.resultField = body.resultField.trim();

    if (body.secret && !body.secret.includes("••••")) {
      updates.encryptedSecret = encryptSecret(body.secret.trim());
    }

    // 1. Update in Firestore
    if (db) {
      try {
        await updateDoc(doc(db, "api_configs", params.id), updates);
      } catch (e) {
        // Fallback
      }
    }

    // 2. Update in Prisma
    let updated: any = null;
    try {
      updated = await prisma.apiConfig.update({
        where: { id: params.id },
        data: updates,
      });
    } catch (e) {
      // Prisma optional
    }

    await AuditService.record({
      adminId: admin.id,
      action: "UPDATE_API_CONFIG",
      targetType: "API_CONFIG",
      targetId: params.id,
      metadata: { name: body.name || params.id },
    });

    const resultApi = updated || { id: params.id, ...updates };
    return NextResponse.json({
      success: true,
      message: "API configuration updated successfully.",
      api: {
        ...resultApi,
        encryptedSecret: resultApi.encryptedSecret ? maskSecret(resultApi.encryptedSecret) : "",
        hasSecret: !!resultApi.encryptedSecret,
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

    // 1. Delete in Firestore
    if (db) {
      try {
        await deleteDoc(doc(db, "api_configs", params.id));
      } catch (e) {
        // Fallback
      }
    }

    // 2. Delete in Prisma
    try {
      await prisma.apiConfig.delete({
        where: { id: params.id },
      });
    } catch (e) {
      // Prisma optional
    }

    await AuditService.record({
      adminId: admin.id,
      action: "DELETE_API_CONFIG",
      targetType: "API_CONFIG",
      targetId: params.id,
    });

    return NextResponse.json({
      success: true,
      message: "API configuration deleted successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
