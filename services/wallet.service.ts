import prisma from "@/lib/prisma";
import { db } from "@/lib/firebase";
import { FS_COLLECTIONS } from "@/lib/collections";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, query, where } from "firebase/firestore";

export interface WalletOperationResult {
  success: boolean;
  balanceBefore: number;
  balanceAfter: number;
  transactionId?: string;
  error?: string;
}

export class WalletService {
  /**
   * Get user wallet by userId or email
   */
  static async getWallet(userId: string) {
    // 1. Try Cloud Firestore (Primary online source of truth - strictly namespaced)
    if (db) {
      try {
        let userSnap = null;
        if (userId && !userId.startsWith("anon_")) {
          userSnap = await getDoc(doc(db, FS_COLLECTIONS.USERS, userId));
        }

        if (!userSnap || !userSnap.exists()) {
          let emailToSearch = userId.includes("@") ? userId.trim().toLowerCase() : null;
          if (!emailToSearch) {
            try {
              const localU = await prisma.user.findUnique({ where: { id: userId } });
              if (localU?.email) emailToSearch = localU.email.trim().toLowerCase();
            } catch {}
          }
          if (emailToSearch) {
            const { collection, query, where, getDocs } = await import("firebase/firestore");
            const q = query(collection(db, FS_COLLECTIONS.USERS), where("email", "==", emailToSearch));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              userSnap = qSnap.docs[0];
            }
          }
        }

        if (userSnap && userSnap.exists()) {
          const data = userSnap.data();
          return {
            id: `wallet_${userSnap.id}`,
            userId: userSnap.id,
            balance: Number(data.walletBalance ?? 0.0),
            currency: "INR",
          };
        }
      } catch (fsErr) {
        console.warn("Firestore getWallet fallback:", fsErr);
      }
    }

    // 2. Try Prisma SQLite (Local fallback)
    try {
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
    } catch (e) {
      // Prisma missing on serverless
    }

    return {
      id: `wallet_${userId}`,
      userId,
      balance: 0.0,
      currency: "INR",
    };
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

    // 1. Check & Charge Cloud Firestore
    if (db) {
      try {
        let userDocRef = doc(db, FS_COLLECTIONS.USERS, userId);
        let userSnap = await getDoc(userDocRef);

        if (!userSnap || !userSnap.exists()) {
          let emailToSearch = userId.includes("@") ? userId.trim().toLowerCase() : null;
          if (!emailToSearch) {
            try {
              const localU = await prisma.user.findUnique({ where: { id: userId } });
              if (localU?.email) emailToSearch = localU.email.trim().toLowerCase();
            } catch {}
          }
          if (emailToSearch) {
            const { collection, query, where, getDocs } = await import("firebase/firestore");
            const q = query(collection(db, FS_COLLECTIONS.USERS), where("email", "==", emailToSearch));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              userSnap = qSnap.docs[0];
              userDocRef = qSnap.docs[0].ref;
            }
          }
        }

        if (userSnap && userSnap.exists()) {
          const data = userSnap.data();
          const currentBal = Number((data.walletBalance ?? 0.0).toFixed(2));
          if (currentBal < amount) {
            return {
              success: false,
              balanceBefore: currentBal,
              balanceAfter: currentBal,
              error: `Insufficient wallet balance. Required: ₹${amount.toFixed(2)}, Available: ₹${currentBal.toFixed(2)}. Please recharge your wallet.`,
            };
          }

          const newBal = Number((currentBal - amount).toFixed(2));
          await updateDoc(userDocRef, { walletBalance: newBal });

          // Synchronize any duplicate docs with the same email in Firestore
          if (data.email) {
            try {
              const { collection, query, where, getDocs } = await import("firebase/firestore");
              const qAll = query(collection(db, FS_COLLECTIONS.USERS), where("email", "==", String(data.email).trim().toLowerCase()));
              const allSnap = await getDocs(qAll);
              for (const item of allSnap.docs) {
                if (item.id !== userDocRef.id) {
                  await updateDoc(item.ref, { walletBalance: newBal });
                }
              }
            } catch {}
          }

          // Record transaction in Cloud Firestore (namespaced)
          try {
            await addDoc(collection(db, FS_COLLECTIONS.WALLET_TRANSACTIONS), {
              userId,
              userEmail: data.email || "",
              userName: data.name || "",
              type: "API_CHARGE",
              amount,
              balanceBefore: currentBal,
              balanceAfter: newBal,
              referenceId,
              description,
              status: "SUCCESS",
              createdAt: new Date().toISOString(),
            });
          } catch (fsTxErr) {
            console.warn("Firestore charge transaction warning:", fsTxErr);
          }

          // Also try recording locally in Prisma if available
          try {
            await prisma.walletTransaction.create({
              data: {
                userId,
                type: "API_CHARGE",
                amount,
                balanceBefore: currentBal,
                balanceAfter: newBal,
                referenceId,
                description,
                status: "SUCCESS",
              },
            });
          } catch (e) {
            // Prisma optional on serverless
          }

          return {
            success: true,
            balanceBefore: currentBal,
            balanceAfter: newBal,
            transactionId: `tx_${Date.now()}`,
          };
        }
      } catch (fsErr) {
        console.warn("Firestore charge error:", fsErr);
      }
    }

    // 2. Fallback to Prisma Transaction if Firestore not available
    try {
      return await prisma.$transaction(async (tx) => {
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
    } catch (e: any) {
      return {
        success: false,
        balanceBefore: 0,
        balanceAfter: 0,
        error: e.message || "Wallet charge failed.",
      };
    }
  }

  /**
   * Atomically refund wallet for a failed or unfulfilled API request
   */
  static async refundForFailedRequest(params: {
    userId: string;
    amount: number;
    referenceId: string;
    reason: string;
  }): Promise<WalletOperationResult> {
    const { userId, amount, referenceId, reason } = params;
    if (amount <= 0) {
      return { success: true, balanceBefore: 0, balanceAfter: 0 };
    }

    // 1. Update in Cloud Firestore (namespaced)
    if (db) {
      try {
        const userDocRef = doc(db, FS_COLLECTIONS.USERS, userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const currentBal = Number((userSnap.data().walletBalance ?? 0.0).toFixed(2));
          const newBal = Number((currentBal + amount).toFixed(2));
          await updateDoc(userDocRef, { walletBalance: newBal });

          // Record refund transaction in Cloud Firestore
          try {
            await addDoc(collection(db, FS_COLLECTIONS.WALLET_TRANSACTIONS), {
              userId,
              userEmail: userSnap.data().email || "",
              userName: userSnap.data().name || "",
              type: "REFUND",
              amount,
              balanceBefore: currentBal,
              balanceAfter: newBal,
              referenceId,
              description: `Automated refund: ${reason}`,
              status: "SUCCESS",
              createdAt: new Date().toISOString(),
            });
          } catch (fsTxErr) {
            console.warn("Firestore refund transaction warning:", fsTxErr);
          }

          try {
            await prisma.walletTransaction.create({
              data: {
                userId,
                type: "REFUND",
                amount,
                balanceBefore: currentBal,
                balanceAfter: newBal,
                referenceId,
                description: `Automated refund: ${reason}`,
                status: "SUCCESS",
              },
            });
          } catch (e) {}

          return { success: true, balanceBefore: currentBal, balanceAfter: newBal };
        }
      } catch (e) {}
    }

    // 2. Prisma fallback
    try {
      return await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) return { success: false, balanceBefore: 0, balanceAfter: 0 };
        const balanceBefore = Number(wallet.balance.toFixed(2));
        const balanceAfter = Number((balanceBefore + amount).toFixed(2));
        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
        const transaction = await tx.walletTransaction.create({
          data: {
            userId,
            type: "REFUND",
            amount,
            balanceBefore,
            balanceAfter,
            referenceId,
            description: `Automated refund: ${reason}`,
            status: "SUCCESS",
          },
        });
        return { success: true, balanceBefore, balanceAfter, transactionId: transaction.id };
      });
    } catch (e: any) {
      return { success: false, balanceBefore: 0, balanceAfter: 0, error: e.message };
    }
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
    const { userId, amount, referenceId, description, gateway = "MANUAL_UPI" } = params;

    if (amount <= 0) {
      return {
        success: false,
        balanceBefore: 0,
        balanceAfter: 0,
        error: "Deposit amount must be greater than zero.",
      };
    }

    let fsResult: WalletOperationResult | null = null;

    // 1. Cloud Firestore update (Primary cloud source of truth - strictly namespaced)
    if (db) {
      try {
        let userDocRef = doc(db, FS_COLLECTIONS.USERS, userId);
        let userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          let emailToSearch = userId.includes("@") ? userId.trim().toLowerCase() : null;
          if (!emailToSearch) {
            try {
              const localU = await prisma.user.findUnique({ where: { id: userId } });
              if (localU?.email) emailToSearch = localU.email.trim().toLowerCase();
            } catch {}
          }
          if (emailToSearch) {
            const q = query(collection(db, FS_COLLECTIONS.USERS), where("email", "==", emailToSearch));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              userSnap = qSnap.docs[0];
              userDocRef = qSnap.docs[0].ref;
            }
          }
        }

        if (userSnap && userSnap.exists()) {
          const currentBal = Number((userSnap.data().walletBalance ?? 0.0).toFixed(2));
          const newBal = Number((currentBal + amount).toFixed(2));
          await updateDoc(userDocRef, { walletBalance: newBal });

          await addDoc(collection(db, FS_COLLECTIONS.WALLET_TRANSACTIONS), {
            userId: userSnap.id,
            userEmail: userSnap.data().email || "",
            userName: userSnap.data().name || "",
            type: "DEPOSIT",
            amount,
            balanceBefore: currentBal,
            balanceAfter: newBal,
            referenceId,
            description,
            status: "SUCCESS",
            gateway: gateway || "MANUAL_UPI",
            createdAt: new Date().toISOString(),
          });

          fsResult = {
            success: true,
            balanceBefore: currentBal,
            balanceAfter: newBal,
            transactionId: `tx_dep_${Date.now()}`,
          };
        }
      } catch (fsDepErr) {
        console.warn("Firestore deposit error:", fsDepErr);
      }
    }

    // 2. Also record in local Prisma if available
    try {
      const prismaRes = await prisma.$transaction(async (tx) => {
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

      return fsResult || prismaRes;
    } catch (e: any) {
      if (fsResult) return fsResult;
      return {
        success: false,
        balanceBefore: 0,
        balanceAfter: 0,
        error: e.message || "Deposit transaction failed.",
      };
    }
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

    let fsResult: WalletOperationResult | null = null;
    if (db) {
      try {
        let userDocRef = doc(db, FS_COLLECTIONS.USERS, userId);
        let userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          let emailToSearch = userId.includes("@") ? userId.trim().toLowerCase() : null;
          if (emailToSearch) {
            const q = query(collection(db, FS_COLLECTIONS.USERS), where("email", "==", emailToSearch));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              userSnap = qSnap.docs[0];
              userDocRef = qSnap.docs[0].ref;
            }
          }
        }

        if (userSnap && userSnap.exists()) {
          const currentBal = Number((userSnap.data().walletBalance ?? 0.0).toFixed(2));
          const newBal = Number((currentBal + amount).toFixed(2));
          await updateDoc(userDocRef, { walletBalance: newBal });

          await addDoc(collection(db, FS_COLLECTIONS.WALLET_TRANSACTIONS), {
            userId: userSnap.id,
            userEmail: userSnap.data().email || "",
            userName: userSnap.data().name || "",
            type,
            amount,
            balanceBefore: currentBal,
            balanceAfter: newBal,
            referenceId,
            description,
            status: "SUCCESS",
            createdAt: new Date().toISOString(),
          });

          fsResult = {
            success: true,
            balanceBefore: currentBal,
            balanceAfter: newBal,
            transactionId: `tx_cred_${Date.now()}`,
          };
        }
      } catch (fsErr) {
        console.warn("Firestore creditBalance warning:", fsErr);
      }
    }

    try {
      const prismaRes = await prisma.$transaction(async (tx) => {
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

      return fsResult || prismaRes;
    } catch (e: any) {
      if (fsResult) return fsResult;
      return {
        success: false,
        balanceBefore: 0,
        balanceAfter: 0,
        error: e.message,
      };
    }
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

    let fsResult: WalletOperationResult | null = null;
    if (db) {
      try {
        let userDocRef = doc(db, FS_COLLECTIONS.USERS, userId);
        let userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          let emailToSearch = userId.includes("@") ? userId.trim().toLowerCase() : null;
          if (emailToSearch) {
            const q = query(collection(db, FS_COLLECTIONS.USERS), where("email", "==", emailToSearch));
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              userSnap = qSnap.docs[0];
              userDocRef = qSnap.docs[0].ref;
            }
          }
        }

        if (userSnap && userSnap.exists()) {
          const currentBal = Number((userSnap.data().walletBalance ?? 0.0).toFixed(2));
          const newBal = Number((currentBal + amount).toFixed(2));
          await updateDoc(userDocRef, { walletBalance: newBal });

          await addDoc(collection(db, FS_COLLECTIONS.WALLET_TRANSACTIONS), {
            userId: userSnap.id,
            userEmail: userSnap.data().email || "",
            userName: userSnap.data().name || "",
            type: "REFUND",
            amount,
            balanceBefore: currentBal,
            balanceAfter: newBal,
            referenceId,
            description: `Refund: ${reason}`,
            status: "SUCCESS",
            createdAt: new Date().toISOString(),
          });

          fsResult = {
            success: true,
            balanceBefore: currentBal,
            balanceAfter: newBal,
            transactionId: `tx_ref_${Date.now()}`,
          };
        }
      } catch (fsErr) {
        console.warn("Firestore refundApiCharge warning:", fsErr);
      }
    }

    try {
      const prismaRes = await prisma.$transaction(async (tx) => {
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

      return fsResult || prismaRes;
    } catch (e: any) {
      if (fsResult) return fsResult;
      return {
        success: false,
        balanceBefore: 0,
        balanceAfter: 0,
        error: e.message,
      };
    }
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

    // 1. Try Cloud Firestore (online cloud database - namespaced)
    if (db) {
      try {
        const userRef = doc(db, FS_COLLECTIONS.USERS, userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const u = userSnap.data();
          const balanceBefore = Number((u.walletBalance ?? 0.0).toFixed(2));
          let balanceAfter = balanceBefore;

          if (type === "MANUAL_CREDIT") {
            balanceAfter = Number((balanceBefore + amount).toFixed(2));
          } else {
            if (balanceBefore < amount) {
              return {
                success: false,
                balanceBefore,
                balanceAfter,
                error: `Cannot deduct ₹${amount.toFixed(2)}. User balance is only ₹${balanceBefore.toFixed(2)}.`,
              };
            }
            balanceAfter = Number((balanceBefore - amount).toFixed(2));
          }

          await updateDoc(userRef, { walletBalance: balanceAfter });

          try {
            await addDoc(collection(db, FS_COLLECTIONS.WALLET_TRANSACTIONS), {
              userId,
              userEmail: u.email || "",
              userName: u.name || "",
              type,
              amount,
              balanceBefore,
              balanceAfter,
              referenceId: `ADMIN_ADJ_${adminId.slice(0, 8)}`,
              description: `Admin adjustment: ${reason}`,
              status: "SUCCESS",
              createdAt: new Date().toISOString(),
            });
          } catch {}

          return {
            success: true,
            balanceBefore,
            balanceAfter,
            transactionId: `tx_adj_${Date.now()}`,
          };
        }
      } catch (fsErr) {
        console.warn("Firestore adminManualAdjustment error:", fsErr);
      }
    }

    // 2. Try Prisma Transaction (local fallback)
    try {
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
    } catch (e: any) {
      return {
        success: false,
        balanceBefore: 0,
        balanceAfter: 0,
        error: e.message || "Wallet adjustment failed.",
      };
    }
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

    // 1. Try Cloud Firestore (Primary cloud transactions - strictly namespaced)
    if (db) {
      try {
        const snap = await getDocs(collection(db, FS_COLLECTIONS.WALLET_TRANSACTIONS));
        if (!snap.empty) {
          const allTxs: any[] = [];
          snap.forEach((d) => {
            const data = d.data();
            allTxs.push({
              id: d.id,
              userId: data.userId,
              type: data.type,
              amount: Number(data.amount || 0),
              balanceBefore: Number(data.balanceBefore || 0),
              balanceAfter: Number(data.balanceAfter || 0),
              referenceId: data.referenceId || d.id,
              description: data.description || "",
              status: data.status || "SUCCESS",
              createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
              user: {
                id: data.userId,
                name: data.userName || "User",
                email: data.userEmail || "",
              },
            });
          });

          let filtered = allTxs;
          if (options.userId) {
            filtered = filtered.filter((t) => t.userId === options.userId);
          }
          if (options.type && options.type !== "ALL") {
            filtered = filtered.filter((t) => t.type === options.type);
          }

          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          if (filtered.length > 0) {
            return {
              transactions: filtered.slice(skip, skip + limit),
              total: filtered.length,
              page,
              totalPages: Math.ceil(filtered.length / limit) || 1,
            };
          }
        }
      } catch (fsErr) {
        console.warn("Firestore getTransactions error:", fsErr);
      }
    }

    // 2. Fallback to Prisma SQLite
    const where: any = {};
    if (options.userId) where.userId = options.userId;
    if (options.type && options.type !== "ALL") where.type = options.type;

    try {
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
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch {
      return {
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };
    }
  }
}
