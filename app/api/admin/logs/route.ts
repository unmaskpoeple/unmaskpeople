import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { collection, getDocs } from "firebase/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const searchParams = req.nextUrl.searchParams;

    const status = searchParams.get("status") || "ALL";
    const service = searchParams.get("service") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    let logs: any[] = [];
    let total = 0;

    // 1. Try Cloud Firestore (Primary cloud live logs - Strictly NumVerge OTP Orders)
    if (db) {
      try {
        const snap = await getDocs(collection(db, FS_COLLECTIONS.OTP_ORDERS));
        if (!snap.empty) {
          const fsLogs: any[] = [];
          snap.forEach((doc) => {
            const d = doc.data();
            const logStatus = d.status || (d.isRefunded ? "REFUNDED" : "PENDING");
            fsLogs.push({
              id: doc.id,
              orderId: d.fiveSimId || doc.id,
              phone: d.phone || "Pending Allocation",
              service: d.service || "unknown",
              serviceName: d.serviceName || d.service || "SMS Service",
              country: d.country || "any",
              countryName: d.countryName || d.country || "Global",
              operator: d.operator || "any",
              status: logStatus,
              cost: Number(d.cost || 0),
              costFiveSim: Number(d.costFiveSim || 0),
              currency: d.currency || "INR",
              smsCode: d.smsCode || null,
              smsText: d.smsText || null,
              smsSender: d.smsSender || null,
              isRefunded: Boolean(d.isRefunded || logStatus === "CANCELED" || logStatus === "TIMEOUT"),
              ipAddress: d.ipAddress || "127.0.0.1",
              userAgent: d.userAgent || "Unknown",
              createdAt: d.createdAt || new Date().toISOString(),
              expiresAt: d.expiresAt || null,
              user: {
                id: d.userId || "",
                name: d.userName || "Subscriber",
                email: d.userEmail || "",
              },
            });
          });

          let filtered = fsLogs;
          if (status !== "ALL") {
            if (status === "REFUNDED") {
              filtered = filtered.filter((l) => l.isRefunded || l.status === "CANCELED" || l.status === "TIMEOUT");
            } else if (status === "SUCCESSFUL") {
              filtered = filtered.filter((l) => l.status === "RECEIVED" || l.status === "FINISHED" || l.smsCode);
            } else {
              filtered = filtered.filter((l) => l.status === status);
            }
          }
          if (service !== "ALL") {
            filtered = filtered.filter((l) => l.service?.toLowerCase() === service.toLowerCase());
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
        if (status !== "ALL") {
          if (status === "REFUNDED") {
            where.OR = [{ isRefunded: true }, { status: { in: ["CANCELED", "TIMEOUT"] } }];
          } else if (status === "SUCCESSFUL") {
            where.status = { in: ["RECEIVED", "FINISHED"] };
          } else {
            where.status = status;
          }
        }
        if (service !== "ALL") {
          where.service = service;
        }

        const [pLogs, pTotal] = await Promise.all([
          prisma.otpOrder.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          }),
          prisma.otpOrder.count({ where }),
        ]);

        if (pLogs && pLogs.length > 0) {
          logs = pLogs.map((o) => ({
            id: o.id,
            orderId: o.fiveSimId,
            phone: o.phone,
            service: o.service,
            serviceName: o.serviceName,
            country: o.country,
            countryName: o.countryName,
            operator: o.operator,
            status: o.status,
            cost: o.cost,
            costFiveSim: o.costFiveSim,
            currency: o.currency,
            smsCode: o.smsCode,
            smsText: o.smsText,
            smsSender: o.smsSender,
            isRefunded: o.isRefunded,
            ipAddress: o.ipAddress || "127.0.0.1",
            userAgent: o.userAgent || "Unknown",
            createdAt: o.createdAt.toISOString(),
            expiresAt: o.expiresAt.toISOString(),
            user: {
              id: o.user.id,
              name: o.user.name,
              email: o.user.email,
            },
          }));
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
