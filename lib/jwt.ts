import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "unmaskpeople_jwt_secret_dev_production_quality_key_9876543210";
export const AUTH_COOKIE_NAME = "unmaskpeople_session";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user session from NextRequest headers or cookies
 */
export async function getSessionUser(req?: NextRequest) {
  let token: string | undefined;

  if (req) {
    // 1. Check Authorization Bearer header
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 2. Check Cookie in request
    if (!token) {
      token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    }
  }

  // 3. Check Next.js server cookie store
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // Ignore if not in server action/route handler context
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      wallet: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    wallet: user.wallet,
    createdAt: user.createdAt,
  };
}

/**
 * Require valid Admin user session, throws error if unauthorized
 */
export async function requireAdmin(req?: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    throw new Error("Authentication required. Please log in.");
  }
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden. Admin access required.");
  }
  return user;
}

/**
 * Require valid Active User session
 */
export async function requireUser(req?: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    throw new Error("Authentication required. Please log in.");
  }
  if (user.status !== "ACTIVE") {
    throw new Error("Your account is currently disabled or suspended.");
  }
  return user;
}
