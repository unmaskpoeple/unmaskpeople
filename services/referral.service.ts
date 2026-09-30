import prisma from "@/lib/prisma";
import crypto from "crypto";
import { SettingsService } from "./settings.service";
import { WalletService } from "./wallet.service";

export class ReferralService {
  /**
   * Generates a unique referral code (e.g. NV8F29A)
   */
  static async generateUniqueCode(): Promise<string> {
    let code = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
      code = `NV${randomHex}`;

      const existing = await prisma.user.findUnique({
        where: { referralCode: code },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    return code;
  }

  /**
   * Links a new user to a referrer during registration
   */
  static async recordReferralSignup(newUserId: string, referralCodeRaw?: string) {
    if (!referralCodeRaw) return null;

    const referralCode = referralCodeRaw.trim().toUpperCase();
    const settings = await SettingsService.getAllSettings();

    if (!settings.referral_enabled) return null;

    const referrer = await prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer || referrer.id === newUserId) {
      return null;
    }

    // Check if referral already exists
    const existingReferral = await prisma.referral.findUnique({
      where: { referredUserId: newUserId },
    });

    if (existingReferral) return null;

    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: newUserId,
        referralCode,
        status: "PENDING",
        successfulSearchCount: 0,
        requiredSearches: settings.referral_required_searches || 2,
        rewardAmount: settings.referral_bonus || 9.0,
      },
      include: {
        referrer: { select: { id: true, name: true, email: true } },
      },
    });

    return referral;
  }

  /**
   * Called whenever a user completes a successful search.
   * Only SUCCESSFUL searches count (failed/refunded do NOT count).
   * Once the referred user completes 2 successful searches, ₹9.00 is credited to the referrer!
   */
  static async recordSuccessfulSearch(userId: string) {
    try {
      // 1. Increment user's total successful search count
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          successfulSearchCount: { increment: 1 },
        },
      });

      // 2. Check if this user was referred by someone and referral is still PENDING
      const referral = await prisma.referral.findUnique({
        where: { referredUserId: userId },
        include: {
          referrer: { select: { id: true, name: true, email: true } },
          referredUser: { select: { id: true, name: true, email: true } },
        },
      });

      if (!referral || referral.status !== "PENDING") {
        return {
          totalSearches: updatedUser.successfulSearchCount,
          rewardUnlocked: false,
        };
      }

      const newCount = referral.successfulSearchCount + 1;
      const required = referral.requiredSearches || 2;
      const isComplete = newCount >= required;

      if (isComplete) {
        // Unlock ₹9.00 referral bonus to the referrer!
        const bonusAmount = referral.rewardAmount || 9.0;

        await WalletService.creditBalance({
          userId: referral.referrerId,
          amount: bonusAmount,
          description: `Referral Reward: ${referral.referredUser.name} completed ${required} successful searches`,
          referenceId: `ref_${referral.id}`,
        });

        // Update referral record as COMPLETED
        await prisma.referral.update({
          where: { id: referral.id },
          data: {
            status: "COMPLETED",
            successfulSearchCount: newCount,
            rewardedAt: new Date(),
          },
        });

        // Log audit
        await prisma.auditLog.create({
          data: {
            action: "REFERRAL_BONUS_DISBURSED",
            targetType: "WALLET",
            targetId: referral.referrerId,
            metadata: JSON.stringify({
              referrerId: referral.referrerId,
              referredUserId: userId,
              amount: bonusAmount,
              successfulSearches: newCount,
            }),
          },
        });

        return {
          totalSearches: updatedUser.successfulSearchCount,
          rewardUnlocked: true,
          bonusAmount,
          referrerName: referral.referrer.name,
        };
      } else {
        // Increment progress towards required searches
        await prisma.referral.update({
          where: { id: referral.id },
          data: {
            successfulSearchCount: newCount,
          },
        });

        return {
          totalSearches: updatedUser.successfulSearchCount,
          rewardUnlocked: false,
          progress: `${newCount}/${required}`,
        };
      }
    } catch (err: any) {
      console.error("Error in ReferralService.recordSuccessfulSearch:", err);
      return { rewardUnlocked: false, error: err.message };
    }
  }

  /**
   * Fetch referral summary for a specific user
   */
  static async getUserReferralData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        successfulSearchCount: true,
      },
    });

    if (!user) throw new Error("User not found");

    // Ensure user has a referral code
    let code = user.referralCode;
    if (!code) {
      code = await this.generateUniqueCode();
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });
    }

    const settings = await SettingsService.getAllSettings();

    // Fetch all referrals initiated by this user
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: {
          select: {
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReferrals = referrals.length;
    const completedReferrals = referrals.filter((r) => r.status === "COMPLETED").length;
    const pendingReferrals = referrals.filter((r) => r.status === "PENDING").length;
    const totalEarned = referrals
      .filter((r) => r.status === "COMPLETED")
      .reduce((sum, r) => sum + r.rewardAmount, 0);

    const formattedList = referrals.map((r) => {
      // Mask email for privacy: e.g. a***v@domain.com
      const emailParts = r.referredUser.email.split("@");
      const maskedEmail =
        emailParts[0].length > 2
          ? `${emailParts[0][0]}***${emailParts[0].slice(-1)}@${emailParts[1]}`
          : r.referredUser.email;

      return {
        id: r.id,
        userName: r.referredUser.name,
        userEmailMasked: maskedEmail,
        status: r.status,
        successfulSearchCount: r.successfulSearchCount,
        requiredSearches: r.requiredSearches,
        rewardAmount: r.rewardAmount,
        rewardedAt: r.rewardedAt,
        joinedAt: r.createdAt,
      };
    });

    return {
      referralCode: code,
      welcomeBonus: settings.welcome_bonus || 15.0,
      rewardPerReferral: settings.referral_bonus || 9.0,
      requiredSearches: settings.referral_required_searches || 2,
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      totalEarned,
      referrals: formattedList,
    };
  }

  /**
   * Admin: Fetch all referrals with complete statistics
   */
  static async getAllReferralsAdmin() {
    const settings = await SettingsService.getAllSettings();
    const referrals = await prisma.referral.findMany({
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        referredUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReferrals = referrals.length;
    const completedCount = referrals.filter((r) => r.status === "COMPLETED").length;
    const pendingCount = referrals.filter((r) => r.status === "PENDING").length;
    const totalBonusPaid = referrals
      .filter((r) => r.status === "COMPLETED")
      .reduce((acc, r) => acc + r.rewardAmount, 0);

    return {
      settings: {
        referral_enabled: settings.referral_enabled,
        welcome_bonus: settings.welcome_bonus || 15.0,
        referral_bonus: settings.referral_bonus || 9.0,
        referral_required_searches: settings.referral_required_searches || 2,
      },
      stats: {
        totalReferrals,
        completedCount,
        pendingCount,
        totalBonusPaid,
        conversionRate: totalReferrals > 0 ? Math.round((completedCount / totalReferrals) * 100) : 0,
      },
      referrals: referrals.map((r) => ({
        id: r.id,
        referralCode: r.referralCode,
        referrerName: r.referrer.name,
        referrerEmail: r.referrer.email,
        referrerId: r.referrer.id,
        referredUserName: r.referredUser.name,
        referredUserEmail: r.referredUser.email,
        referredUserId: r.referredUser.id,
        successfulSearchCount: r.successfulSearchCount,
        requiredSearches: r.requiredSearches,
        status: r.status,
        rewardAmount: r.rewardAmount,
        rewardedAt: r.rewardedAt,
        createdAt: r.createdAt,
      })),
    };
  }

  /**
   * Admin: Manually force-credit a referral reward
   */
  static async manuallyCreditReferral(referralId: string) {
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: { referrer: true, referredUser: true },
    });

    if (!referral) throw new Error("Referral record not found");
    if (referral.status === "COMPLETED") {
      throw new Error("This referral has already been completed and rewarded.");
    }

    const amount = referral.rewardAmount || 9.0;
    await WalletService.creditBalance({
      userId: referral.referrerId,
      amount,
      description: `Manual Referral Reward: Referred ${referral.referredUser.name} (Admin Override)`,
      referenceId: `admin_ref_${referral.id}`,
    });

    const updated = await prisma.referral.update({
      where: { id: referralId },
      data: {
        status: "COMPLETED",
        rewardedAt: new Date(),
        successfulSearchCount: referral.requiredSearches,
      },
    });

    return { success: true, message: `₹${amount.toFixed(2)} credited to ${referral.referrer.name}` };
  }
}
