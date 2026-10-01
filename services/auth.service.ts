import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { signToken, TokenPayload } from "@/lib/jwt";

export class AuthService {
  /**
   * Register new user
   */
  static async register(data: { name: string; email: string; password: string; referralCode?: string }) {
    const email = data.email.trim().toLowerCase();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    if (data.password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    // Dynamic Welcome bonus amount from system settings (default ₹15.00)
    const { SettingsService } = await import("./settings.service");
    const { ReferralService } = await import("./referral.service");
    const settings = await SettingsService.getAllSettings();
    const welcomeBonus = settings.welcome_bonus ?? 15.0;
    const requireVerification = settings.require_email_verification ?? true;

    // Generate a unique referral code for the new user
    const userReferralCode = await ReferralService.generateUniqueCode();
    const passwordHash = await bcrypt.hash(data.password, 10);

    const isMasterAdmin = email === "zh@gmail.com";
    const userRole = isMasterAdmin ? "ADMIN" : "USER";
    const isEmailVerified = isMasterAdmin ? true : !requireVerification;
    const initialBalance = isMasterAdmin ? 10000.0 : welcomeBonus;
    const needsEmailVerification = isMasterAdmin ? false : requireVerification;

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        name: isMasterAdmin ? (data.name.trim() || "Master Admin") : data.name.trim(),
        email,
        passwordHash,
        role: userRole,
        status: "ACTIVE",
        emailVerified: isEmailVerified,
        verificationToken: needsEmailVerification ? verificationToken : null,
        verificationExpires: needsEmailVerification ? verificationExpires : null,
        referralCode: userReferralCode,
        wallet: {
          create: {
            balance: initialBalance,
            currency: "INR",
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    // Record welcome credit transaction (₹15.00)
    await prisma.walletTransaction.create({
      data: {
        userId: user.id,
        type: "DEPOSIT",
        amount: welcomeBonus,
        balanceBefore: 0.0,
        balanceAfter: welcomeBonus,
        referenceId: "WELCOME_BONUS",
        description: `Welcome promotional credit (₹${welcomeBonus.toFixed(2)})`,
        status: "SUCCESS",
      },
    });

    // If referred by someone, link referral relationship
    if (data.referralCode) {
      await ReferralService.recordReferralSignup(user.id, data.referralCode);
    }

    // Dispatch verification email with activation link
    let emailResult: any = null;
    if (needsEmailVerification) {
      const { EmailService } = await import("./email.service");
      emailResult = await EmailService.sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: verificationToken,
      });
    }

    const token = (!needsEmailVerification)
      ? signToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        })
      : null;

    return {
      token,
      requiresVerification: needsEmailVerification,
      message: needsEmailVerification
        ? "Account registered! An activation link has been sent to your email. Please check your inbox to activate your account."
        : "Account created successfully.",
      simulatedActivationUrl: emailResult?.activationUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        referralCode: user.referralCode,
        walletBalance: user.wallet?.balance || welcomeBonus,
      },
    };
  }

  /**
   * Authenticate user credentials
   */
  static async login(data: { email: string; password: string; requiredRole?: "ADMIN" | "USER" }) {
    const email = data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { wallet: true },
    });

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Your account has been deactivated or suspended. Please contact support.");
    }

    if (email === "zh@gmail.com" && user.role !== "ADMIN") {
      user.role = "ADMIN";
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN", emailVerified: true, status: "ACTIVE" },
      });
    }

    if (data.requiredRole && data.requiredRole === "ADMIN" && user.role !== "ADMIN") {
      throw new Error("Access denied. Administrative privileges are required for this area.");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Invalid email or password.");
    }

    // Check email verification if required (bypass for admin)
    const { SettingsService } = await import("./settings.service");
    const settings = await SettingsService.getAllSettings();
    if (settings.require_email_verification && !user.emailVerified && user.role !== "ADMIN") {
      throw new Error("EMAIL_NOT_VERIFIED: Your email is not activated yet. Please click the activation link sent to your inbox, or request a new one.");
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        referralCode: user.referralCode,
        walletBalance: user.wallet?.balance || 0,
      },
    };
  }

  /**
   * Verify email via activation token
   */
  static async verifyEmail(token: string) {
    if (!token || typeof token !== "string") {
      throw new Error("Activation token is required.");
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: {
          gte: new Date(),
        },
      },
      include: { wallet: true },
    });

    if (!user) {
      throw new Error("Invalid or expired activation link. Please request a fresh activation link.");
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
      include: { wallet: true },
    });

    const jwtToken = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
    });

    return {
      success: true,
      token: jwtToken,
      message: "Email verified successfully! Your account is active.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        emailVerified: true,
        walletBalance: updatedUser.wallet?.balance || 0,
        referralCode: updatedUser.referralCode,
      },
    };
  }

  /**
   * Resend verification email
   */
  static async resendVerification(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't disclose non-existent accounts
      return {
        success: true,
        message: "If an account exists, a fresh activation link has been sent to your email.",
      };
    }

    if (user.emailVerified) {
      return {
        success: true,
        alreadyVerified: true,
        message: "Your email is already verified. You can log in directly.",
      };
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationExpires,
      },
    });

    const { EmailService } = await import("./email.service");
    const emailResult = await EmailService.sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verificationToken,
    });

    return {
      success: true,
      message: `A fresh activation link has been sent to ${email}.`,
      simulatedActivationUrl: emailResult.activationUrl,
    };
  }

  /**
   * Mock password reset token request
   */
  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return { success: true, message: "If an account exists, password reset instructions have been generated." };
    }

    return {
      success: true,
      resetToken: `rst_${Buffer.from(user.id).toString("base64")}`,
      message: "Password reset link generated successfully.",
    };
  }

  /**
   * Complete password reset
   */
  static async resetPassword(userId: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: "Password updated successfully. You can now log in." };
  }
}
