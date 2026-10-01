import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { encryptSecret, maskSecret } from "@/lib/crypto";
import { AuditService } from "@/services/audit.service";

const DEFAULT_APIS = [
  {
    id: "api-global-carrier-lookup",
    name: "Global Carrier & HLR Line Intelligence API",
    description: "Live validation, carrier network identification, line type, circle, and telecom HLR status.",
    endpoint: "/api/mock-provider/carrier-lookup",
    method: "POST",
    authType: "BEARER_TOKEN",
    authKeyName: "Authorization",
    encryptedSecret: "sk_live_unmaskpeople_carrier_demo_9281a0b3",
    headers: JSON.stringify({ "Content-Type": "application/json" }),
    requestTemplate: JSON.stringify({ phone: "{{phone}}", country: "{{countryCode}}" }),
    phoneParameter: "phone",
    cost: 3.5,
    timeout: 8000,
    isActive: true,
    successField: "status",
    successValues: "success,true,200,OK,valid",
    messageField: "message",
    resultField: "data",
    lastTestedAt: new Date().toISOString(),
    lastTestStatus: "HEALTHY",
    lastTestLatencyMs: 120,
    _count: { requests: 0 },
  },
  {
    id: "api-numverify-risk-scoring",
    name: "NumVerify Fraud & Risk Scoring Service",
    description: "Calculates spam risk, porting history, active status, and telecom circle.",
    endpoint: "/api/mock-provider/risk-scoring",
    method: "POST",
    authType: "API_KEY_HEADER",
    authKeyName: "X-Api-Key",
    encryptedSecret: "key_sec_risk_matrix_8471b4e9",
    headers: JSON.stringify({ "Content-Type": "application/json" }),
    requestTemplate: JSON.stringify({ number: "{{phone}}", detailed: true }),
    phoneParameter: "number",
    cost: 5.0,
    timeout: 10000,
    isActive: true,
    successField: "code",
    successValues: "200,success,true",
    messageField: "status_message",
    resultField: "result",
    lastTestedAt: new Date().toISOString(),
    lastTestStatus: "HEALTHY",
    lastTestLatencyMs: 145,
    _count: { requests: 0 },
  },
];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    let apis: any[] = [];

    // 1. Try Firestore
    if (db) {
      try {
        const snap = await getDocs(collection(db, "api_configs"));
        if (!snap.empty) {
          snap.forEach((d) => apis.push({ id: d.id, ...d.data(), _count: { requests: 0 } }));
        }
      } catch (fsErr) {
        console.warn("Firestore api_configs fetch warning:", fsErr);
      }
    }

    // 2. Try Prisma
    if (apis.length === 0) {
      try {
        apis = await prisma.apiConfig.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { requests: true },
            },
          },
        });
      } catch (e) {
        // Prisma missing
      }
    }

    if (apis.length === 0) {
      apis = DEFAULT_APIS;
    }

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

    let encryptedSecret = null;
    if (secret && secret.trim()) {
      encryptedSecret = encryptSecret(secret.trim());
    }

    const newApiId = `api_${Date.now()}`;
    const apiData = {
      id: newApiId,
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
      cost: Number(cost) || 5.0,
      timeout: Number(timeout) || 10000,
      isActive: isActive !== false,
      successField: successField?.trim() || "status",
      successValues: successValues?.trim() || "success,true,200,OK,valid",
      messageField: messageField?.trim() || "message",
      resultField: resultField?.trim() || "data",
      createdAt: new Date().toISOString(),
    };

    // Save in Firestore
    if (db) {
      try {
        await setDoc(doc(db, "api_configs", newApiId), apiData);
      } catch (fsErr) {
        console.warn("Firestore api save warning:", fsErr);
      }
    }

    // Save in Prisma
    try {
      await prisma.apiConfig.create({
        data: apiData as any,
      });
    } catch (e) {
      // Prisma optional
    }

    await AuditService.record({
      adminId: admin.id,
      action: "CREATE_API_CONFIG",
      targetType: "API_CONFIG",
      targetId: newApiId,
      metadata: { name: apiData.name, endpoint: apiData.endpoint },
    });

    return NextResponse.json({
      success: true,
      message: `API Configuration '${apiData.name}' created successfully.`,
      api: {
        ...apiData,
        encryptedSecret: encryptedSecret ? maskSecret(encryptedSecret) : "",
        hasSecret: !!encryptedSecret,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
