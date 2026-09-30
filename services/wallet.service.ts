import prisma from "@/lib/prisma";

export interface WalletOperationResult {
  success: boolean;
  balanceBefore: number;
  balanceAfter: number;
  transactionId?: string;
  error?: string;
}

export class WalletService {
  /**
   * Get user wallet by userId
   */
  static async getWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0.0,
          currency: "INR",
        },
      });
    }

    return wallet;
  }

  /**
   * Atomically charge wallet for an API request within a database transaction
   */
  static async chargeForApiRequest(params: {
    userId: string;
    amount: number;
    referenceId: string;
    description: string;
  }): Promise<WalletOperationResult> {
    const { userId, amount, referenceId, description } = params;

    return await prisma.$transaction(async (tx) => {
      // Find wallet
      let wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0.0, currency: "INR" },
        });
      }

      if (wallet.balance < amount) {
        return {
          success: false,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance,
          error: `Insufficient wallet balance. Required: ₹${amount.toFixed(2)}, Available: ₹${wallet.balance.toFixed(2)}. Please recharge your wallet.`,
        };
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = Number((balanceBefore - amount).toFixed(2));

      // Update wallet balance atomically
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      // Record transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: "API_CHARGE",
          amount,
          balanceBefore,
          balanceAfter,
          referenceId,
          description,
          status: "SUCCESS",
        },
      });

      return {
        success: true,
        balanceBefore,
        balanceAfter,
        transactionId: transaction.id,
      };
    });
  }

  /**
   * Atomically deposit funds into wallet (e.g. from payment gateway)
   */
  static async depositFunds(params: {
    userId: string;
    amount: number;
    referenceId: string;
    description: string;
    gateway?: string;
  }): Promise<WalletOperationResult> {
    const { userId, amount, referenceId, description } = params;

    if (amount <= 0) {
      return {
        success: false,
        balanceBefore: 0,
        balanceAfter: 0,
        error: "Deposit amount must be greater than zero.",
      };
    }

    return await prisma.$transaction(async (tx) => {
      // Check for duplicate payment transaction
      const existingTx = await tx.walletTransaction.findFirst({
        where: { referenceId, type: "DEPOSIT" },
      });

      if (existingTx) {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        return {
          success: true,
          balanceBefore: existingTx.balanceBefore,
          balanceAfter: existingTx.balanceAfter,
          transactionId: existingTx.id,
        };
      }

      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0.0, currency: "INR" },
        });
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = Number((balanceBefore + amount).toFixed(2));

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: "DEPOSIT",
          amount,
          balanceBefore,
          balanceAfter,
          referenceId,
          description,
          status: "SUCCESS",
        },
      });

      return {
        success: true,
        balanceBefore,
        balanceAfter,
        transactionId: transaction.id,
      };
    });
  }

  /**
   * Atomically credit wallet balance (for referrals, bonuses, or verified gateway top-ups)
   */
  static async creditBalance(params: {
    userId: string;
    amount: number;
    referenceId: string;
    description: string;
    type?: string;
  }): Promise<WalletOperationResult> {
    const { userId, amount, referenceId, description, type = "DEPOSIT" } = params;

    if (amount <= 0) {
      return {
        success: false,
        balanceBefore: 0,
        balanceAfter: 0,
        error: "Credit amount must be greater than zero.",
      };
    }

    return await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0.0, currency: "INR" },
        });
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = Number((balanceBefore + amount).toFixed(2));

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          referenceId,
          description,
          status: "SUCCESS",
        },
      });

      return {
        success: true,
        balanceBefore,
        balanceAfter,
        transactionId: transaction.id,
      };
    });
  }

  /**
   * Refund an API charge atomically
   */
  static async refundApiCharge(params: {
    userId: string;
    amount: number;
    referenceId: string;
    reason: string;
  }): Promise<WalletOperationResult> {
    const { userId, amount, referenceId, reason } = params;

    return await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0.0, currency: "INR" },
        });
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = Number((balanceBefore + amount).toFixed(2));

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: "REFUND",
          amount,
          balanceBefore,
          balanceAfter,
          referenceId,
          description: `Refund: ${reason}`,
          status: "SUCCESS",
        },
      });

      return {
        success: true,
        balanceBefore,
        balanceAfter,
        transactionId: transaction.id,
      };
    });
  }

  /**
   * Manual admin adjustment (credit or debit) with required audit reason
   */
  static async adminManualAdjustment(params: {
    userId: string;
    type: "MANUAL_CREDIT" | "MANUAL_DEBIT";
    amount: number;
    reason: string;
    adminId: string;
  }): Promise<WalletOperationResult> {
    const { userId, type, amount, reason, adminId } = params;

    return await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId, balance: 0.0, currency: "INR" },
        });
      }

      const balanceBefore = wallet.balance;
      let balanceAfter = balanceBefore;

      if (type === "MANUAL_CREDIT") {
        balanceAfter = Number((balanceBefore + amount).toFixed(2));
      } else {
        if (balanceBefore < amount) {
          return {
            success: false,
            balanceBefore,
            balanceAfter,
            error: "Cannot deduct more than user current balance.",
          };
        }
        balanceAfter = Number((balanceBefore - amount).toFixed(2));
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          referenceId: `ADMIN_ADJ_${adminId.slice(0, 8)}`,
          description: `Admin adjustment: ${reason}`,
          status: "SUCCESS",
        },
      });

      return {
        success: true,
        balanceBefore,
        balanceAfter,
        transactionId: transaction.id,
      };
    });
  }

  /**
   * Get paginated transactions with optional filters
   */
  static async getTransactions(options: {
    userId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.userId) where.userId = options.userId;
    if (options.type && options.type !== "ALL") where.type = options.type;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
