import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const searchParams = req.nextUrl.searchParams;

    const status = searchParams.get("status") || "ALL";
    const apiConfigId = searchParams.get("apiConfigId") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    let logs: any[] = [];
    let total = 0;

    // 1. Try Cloud Firestore (primary cloud live logs)
    if (db) {
      try {
        const snap = await getDocs(collection(db, "requests"));
        if (!snap.empty) {
          const fsLogs: any[] = [];
          snap.forEach((doc) => {
            const d = doc.data();
            const logStatus = d.status || (d.isRefunded ? "REFUNDED" : "SUCCESSFUL");
            fsLogs.push({
              id: doc.id,
              userId: d.userId || "",
              maskedPhone: d.phone || d.maskedPhone || "Search Target",
              countryCode: d.countryCode || "+91",
              status: logStatus,
              amountCharged: Number(d.amountCharged || 0),
              isRefunded: Boolean(d.isRefunded),
              latencyMs: Number(d.latencyMs || 0),
              httpStatus: d.httpStatus || 200,
              ipAddress: d.ipAddress || "127.0.0.1",
              createdAt: d.createdAt || new Date().toISOString(),
              user: {
                id: d.userId || "",
                name: d.userName || "Subscriber",
                email: d.userEmail || "",
              },
              apiConfig: {
                id: d.apiConfigId || "api_core",
                name: d.apiUsed || d.apiName || "Telecom Core API",
              },
              result: d.result || null,
              rawResponse: d.rawResponse || null,
            });
          });

          let filtered = fsLogs;
          if (status !== "ALL") {
            filtered = filtered.filter((l) => l.status === status);
          }
          if (apiConfigId !== "ALL") {
            filtered = filtered.filter((l) => l.apiConfig?.id === apiConfigId);
          }

          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          total = filtered.length;
          logs = filtered.slice(skip, skip + limit);
        }
      } catch (fsErr) {
        console.warn("Firestore admin logs read warning:", fsErr);
      }
    }

    // 2. Try Prisma fallback if Firestore returned nothing
    if (logs.length === 0) {
      try {
        const where: any = {};
        if (status !== "ALL") where.status = status;
        if (apiConfigId !== "ALL") where.apiConfigId = apiConfigId;

        const [pLogs, pTotal] = await Promise.all([
          prisma.apiRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
              user: { select: { id: true, name: true, email: true } },
              apiConfig: { select: { id: true, name: true } },
            },
          }),
          prisma.apiRequest.count({ where }),
        ]);

        if (pLogs && pLogs.length > 0) {
          logs = pLogs;
          total = pTotal;
        }
      } catch (e) {
        // Prisma missing on serverless
      }
    }

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
