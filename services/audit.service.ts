import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
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
        await addDoc(collection(db, FS_COLLECTIONS.AUDIT_LOGS), {
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

    let logs: any[] = [];
    let total = 0;

    // 1. Try Cloud Firestore (Primary live audit trail)
    if (db) {
      try {
        const { getDocs } = await import("firebase/firestore");
        const snap = await getDocs(collection(db, FS_COLLECTIONS.AUDIT_LOGS));
        if (!snap.empty) {
          const fsAudits: any[] = [];
          snap.forEach((doc) => {
            const d = doc.data();
            fsAudits.push({
              id: doc.id,
              adminId: d.adminId,
              action: d.action || "ADMIN_ACTION",
              targetType: d.targetType || "SYSTEM",
              targetId: d.targetId || "Global",
              metadata: typeof d.metadata === "string" ? d.metadata : JSON.stringify(d.metadata || {}),
              ipAddress: d.ipAddress || "127.0.0.1",
              createdAt: d.createdAt || new Date().toISOString(),
              admin: {
                id: d.adminId || "",
                name: d.adminName || (d.adminId ? "Operator" : "System Operator"),
                email: d.adminEmail || "",
              },
            });
          });

          let filtered = fsAudits;
          if (options.action) {
            filtered = filtered.filter((a) => a.action === options.action);
          }

          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          total = filtered.length;
          logs = filtered.slice(skip, skip + limit);
        }
      } catch (fsErr) {
        console.warn("Firestore audit_logs read error:", fsErr);
      }
    }

    // 2. Fallback to Prisma if Firestore returned no audit logs
    if (logs.length === 0) {
      try {
        const where: any = {};
        if (options.action) {
          where.action = options.action;
        }

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
    }

    return { logs, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }
}
