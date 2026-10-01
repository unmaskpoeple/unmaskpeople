import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export interface CreateAuditLogParams {
  adminId?: string;
  action: string;
  targetType: "USER" | "WALLET" | "API_CONFIG" | "PRICING" | "SETTINGS" | "SYSTEM";
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export class AuditService {
  static async record(params: CreateAuditLogParams) {
    if (db) {
      try {
        await addDoc(collection(db, "audit_logs"), {
          adminId: params.adminId || null,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId || null,
          metadata: params.metadata || {},
          ipAddress: params.ipAddress || "127.0.0.1",
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        // Safe Firestore logging fallback
      }
    }

    try {
      return await prisma.auditLog.create({
        data: {
          adminId: params.adminId,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
          ipAddress: params.ipAddress || "127.0.0.1",
        },
      });
    } catch (err) {
      return null;
    }
  }

  static async getLogs(options: { page?: number; limit?: number; action?: string }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.action) {
      where.action = options.action;
    }

    let logs: any[] = [];
    let total = 0;

    try {
      const [pLogs, pTotal] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            admin: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);
      logs = pLogs;
      total = pTotal;
    } catch (e) {
      // Prisma missing on serverless
    }

    return { logs, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }
}
