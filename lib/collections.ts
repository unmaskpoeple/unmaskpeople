/**
 * Centralized Firestore collection and document names for NumVerge OTP SaaS.
 * 
 * CRITICAL: All collections are strictly namespaced with the "numverge_" prefix
 * to ensure 100% data separation from any other projects or websites (e.g. UnMaskPeople).
 */
export const FS_COLLECTIONS = {
  USERS: "numverge_users",
  SYSTEM: "numverge_system",
  SETTINGS_DOC: "settings", // document inside numverge_system
  UPI_DEPOSITS: "numverge_upi_deposits",
  OTP_ORDERS: "numverge_otp_orders",
  WALLET_TRANSACTIONS: "numverge_wallet_transactions",
  AUDIT_LOGS: "numverge_audit_logs",
  PRICING: "numverge_pricing",
} as const;
