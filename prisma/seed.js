const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding initial database...");

  // 1. Password Hashes
  const adminPasswordHash = await bcrypt.hash("AdminPassword123!", 10);
  const userPasswordHash = await bcrypt.hash("UserPassword123!", 10);

  // 2. Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@unmaskpeople.in" },
    update: {},
    create: {
      name: "SaaS Administrator",
      email: "admin@unmaskpeople.in",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      wallet: {
        create: {
          balance: 10000.0,
          currency: "INR",
        },
      },
    },
  });

  // 2b. Master Admin (zh@gmail.com)
  const masterAdmin = await prisma.user.upsert({
    where: { email: "zh@gmail.com" },
    update: {
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
    },
    create: {
      name: "Master Admin",
      email: "zh@gmail.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      wallet: {
        create: {
          balance: 50000.0,
          currency: "INR",
        },
      },
    },
  });

  // 3. Demo Standard User
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@unmaskpeople.in" },
    update: {},
    create: {
      name: "Aarav Sharma",
      email: "demo@unmaskpeople.in",
      passwordHash: userPasswordHash,
      role: "USER",
      status: "ACTIVE",
      emailVerified: true,
      wallet: {
        create: {
          balance: 650.0,
          currency: "INR",
        },
      },
    },
    include: { wallet: true },
  });

  // 4. Initial Wallet Transactions for Demo User
  const existingTx = await prisma.walletTransaction.findFirst({
    where: { userId: demoUser.id },
  });

  if (!existingTx) {
    await prisma.walletTransaction.createMany({
      data: [
        {
          userId: demoUser.id,
          type: "DEPOSIT",
          amount: 500.0,
          balanceBefore: 0.0,
          balanceAfter: 500.0,
          referenceId: "PAY_INIT_500_MOCK",
          description: "Initial wallet top-up via UPI",
          status: "SUCCESS",
          createdAt: new Date(Date.now() - 86400000 * 3),
        },
        {
          userId: demoUser.id,
          type: "DEPOSIT",
          amount: 250.0,
          balanceBefore: 500.0,
          balanceAfter: 750.0,
          referenceId: "PAY_ADD_250_MOCK",
          description: "Wallet recharge via Net Banking",
          status: "SUCCESS",
          createdAt: new Date(Date.now() - 86400000 * 2),
        },
        {
          userId: demoUser.id,
          type: "API_CHARGE",
          amount: 5.0,
          balanceBefore: 750.0,
          balanceAfter: 745.0,
          referenceId: "REQ_LOOKUP_9198765",
          description: "Phone validation fee for +91 98*****3210",
          status: "SUCCESS",
          createdAt: new Date(Date.now() - 86400000 * 1),
        },
      ],
    });
  }

  // 5. Default Configured APIs
  const api1 = await prisma.apiConfig.upsert({
    where: { id: "api-global-carrier-lookup" },
    update: {},
    create: {
      id: "api-global-carrier-lookup",
      name: "Global Carrier & HLR Line Intelligence API",
      description: "Live validation, carrier network identification, line type (mobile/landline/VoIP), and country validation.",
      endpoint: "http://localhost:3000/api/mock-provider/carrier-lookup",
      method: "POST",
      authType: "BEARER_TOKEN",
      authKeyName: "Authorization",
      encryptedSecret: "sk_live_unmaskpeople_carrier_demo_9281a0b3",
      headers: JSON.stringify({ "Content-Type": "application/json", "X-Service-Client": "UnMaskPeople-Core/1.0" }),
      requestTemplate: JSON.stringify({ phone: "{{phone}}", country: "{{countryCode}}", include_carrier: true }),
      phoneParameter: "phone",
      cost: 3.5,
      timeout: 8000,
      isActive: true,
      successField: "status",
      successValues: "success,true,200,OK,valid",
      messageField: "message",
      resultField: "data",
      lastTestedAt: new Date(),
      lastTestStatus: "HEALTHY",
      lastTestLatencyMs: 142,
    },
  });

  const api2 = await prisma.apiConfig.upsert({
    where: { id: "api-numverify-risk-scoring" },
    update: {},
    create: {
      id: "api-numverify-risk-scoring",
      name: "NumVerify Fraud & Risk Scoring Service",
      description: "Calculates spam risk, porting history, active status, and telecom circle.",
      endpoint: "http://localhost:3000/api/mock-provider/risk-scoring",
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
      lastTestedAt: new Date(),
      lastTestStatus: "HEALTHY",
      lastTestLatencyMs: 185,
    },
  });

  // 6. Sample Request History for Demo User
  const existingReq = await prisma.apiRequest.findFirst({
    where: { userId: demoUser.id },
  });

  if (!existingReq) {
    await prisma.apiRequest.createMany({
      data: [
        {
          userId: demoUser.id,
          apiConfigId: api1.id,
          phoneHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          maskedPhone: "+91 98*****3210",
          countryCode: "+91",
          status: "SUCCESSFUL",
          httpStatus: 200,
          amountCharged: 3.5,
          latencyMs: 148,
          rawResponse: JSON.stringify({
            status: "success",
            message: "Phone number resolved successfully",
            data: {
              valid: true,
              country: "India",
              country_code: "IN",
              carrier: "Reliance Jio Infocomm",
              line_type: "Mobile",
              circle: "Maharashtra & Goa",
              mcc_mnc: "405-854",
              porting_status: "Original Network",
              roaming: false,
              risk_level: "LOW"
            }
          }),
          sanitizedResult: JSON.stringify({
            Carrier: "Reliance Jio Infocomm",
            Type: "Mobile",
            Circle: "Maharashtra & Goa",
            Status: "Active",
            SpamScore: "2 / 100"
          }),
          createdAt: new Date(Date.now() - 3600000 * 5),
          completedAt: new Date(Date.now() - 3600000 * 5 + 148),
        },
        {
          userId: demoUser.id,
          apiConfigId: api2.id,
          phoneHash: "9f83c60a92d2925b47b7378ca933b137684039800de83ac0f07340c750f20f04",
          maskedPhone: "+1 415*****89",
          countryCode: "+1",
          status: "SUCCESSFUL",
          httpStatus: 200,
          amountCharged: 5.0,
          latencyMs: 210,
          rawResponse: JSON.stringify({
            code: 200,
            status_message: "Verified successfully",
            result: {
              valid: true,
              country: "United States",
              country_code: "US",
              carrier: "Verizon Wireless",
              line_type: "Cellular",
              region: "San Francisco, CA",
              risk_score: 12,
              reputation: "CLEAN"
            }
          }),
          sanitizedResult: JSON.stringify({
            Carrier: "Verizon Wireless",
            Location: "San Francisco, CA",
            Line: "Cellular",
            Reputation: "CLEAN"
          }),
          createdAt: new Date(Date.now() - 3600000 * 18),
          completedAt: new Date(Date.now() - 3600000 * 18 + 210),
        }
      ]
    });
  }

  // 7. System Settings
  const defaultSettings = [
    { key: "site_name", value: "UnMaskPeople.in" },
    { key: "currency_symbol", value: "₹" },
    { key: "currency_code", value: "INR" },
    { key: "default_cost_per_request", value: "3.50" },
    { key: "min_wallet_balance", value: "0.00" },
    { key: "refund_on_failure", value: "true" },
    { key: "max_requests_per_minute", value: "15" },
    { key: "max_requests_per_day", value: "500" },
    { key: "registration_enabled", value: "true" },
    { key: "maintenance_mode", value: "false" },
    { key: "privacy_mask_phone", value: "true" },
    { key: "data_retention_days", value: "90" },
    { key: "webhook_secret", value: "whsec_unmaskpeople_mock_webhook_key_xyz" },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // 8. Admin Audit Log
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: "SYSTEM_INITIALIZED",
      targetType: "SYSTEM",
      targetId: "SYSTEM_INIT",
      metadata: JSON.stringify({ note: "Initial system bootstrap and security baseline set." }),
      ipAddress: "127.0.0.1",
    },
  });

  console.log("Database seeded successfully!");
  console.log("Admin credentials: admin@unmaskpeople.in / AdminPassword123!");
  console.log("User credentials:  demo@unmaskpeople.in / UserPassword123!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
