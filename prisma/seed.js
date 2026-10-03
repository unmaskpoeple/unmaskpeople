const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding NumVerge OTP database...");

  // 1. Password Hashes
  const adminPasswordHash = await bcrypt.hash("AdminPassword123!", 10);
  const userPasswordHash = await bcrypt.hash("UserPassword123!", 10);

  // 2. NumVerge Master Admin (zh@gmail.com)
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
      referralCode: "NVMASTER",
      wallet: {
        create: {
          balance: 50000.0,
          currency: "INR",
        },
      },
    },
  });

  // 2b. Secondary Admin (admin@numverge.com)
  const admin = await prisma.user.upsert({
    where: { email: "admin@numverge.com" },
    update: {
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
    },
    create: {
      name: "NumVerge Administrator",
      email: "admin@numverge.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      referralCode: "NVADMIN",
      wallet: {
        create: {
          balance: 10000.0,
          currency: "INR",
        },
      },
    },
  });

  // 3. Demo Standard User
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@numverge.com" },
    update: {
      status: "ACTIVE",
      emailVerified: true,
    },
    create: {
      name: "Demo Subscriber",
      email: "demo@numverge.com",
      passwordHash: userPasswordHash,
      role: "USER",
      status: "ACTIVE",
      emailVerified: true,
      referralCode: "NVDEMO1",
      wallet: {
        create: {
          balance: 750.0,
          currency: "INR",
        },
      },
    },
    include: { wallet: true },
  });

  // 4. Sample OTP Order History for Demo User
  const existingOrder = await prisma.otpOrder.findFirst({
    where: { userId: demoUser.id },
  });

  if (!existingOrder) {
    await prisma.otpOrder.createMany({
      data: [
        {
          userId: demoUser.id,
          fiveSimId: 8812903,
          phone: "+14155552671",
          service: "telegram",
          serviceName: "Telegram",
          country: "usa",
          countryName: "United States",
          operator: "any",
          cost: 19.68,
          costFiveSim: 15.0,
          currency: "INR",
          status: "FINISHED",
          smsCode: "49201",
          smsText: "Your Telegram verification code is: 49201",
          smsSender: "Telegram",
          expiresAt: new Date(Date.now() - 3600000 * 2),
          smsReceivedAt: new Date(Date.now() - 3600000 * 2 + 45000),
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
        {
          userId: demoUser.id,
          fiveSimId: 8813410,
          phone: "+447911123456",
          service: "whatsapp",
          serviceName: "WhatsApp",
          country: "england",
          countryName: "United Kingdom",
          operator: "any",
          cost: 32.81,
          costFiveSim: 25.0,
          currency: "INR",
          status: "FINISHED",
          smsCode: "827103",
          smsText: "Your WhatsApp code: 827-103",
          smsSender: "WhatsApp",
          expiresAt: new Date(Date.now() - 3600000 * 1),
          smsReceivedAt: new Date(Date.now() - 3600000 * 1 + 30000),
          createdAt: new Date(Date.now() - 3600000 * 1),
        },
      ],
    });
  }

  // 5. System Settings for NumVerge OTP
  const defaultSettings = [
    { key: "site_name", value: "NumVerge OTP" },
    { key: "currency_symbol", value: "₹" },
    { key: "currency_code", value: "INR" },
    { key: "min_wallet_balance", value: "0.00" },
    { key: "registration_enabled", value: "true" },
    { key: "maintenance_mode", value: "false" },
    { key: "fivesim_markup_percent", value: "25" },
    { key: "fivesim_exchange_rate_rub_to_inr", value: "1.05" },
    { key: "upi_enabled", value: "true" },
    { key: "upi_id", value: "numverge@upi" },
    { key: "upi_payee_name", value: "NumVerge OTP" },
    { key: "upi_auto_approve", value: "true" },
    { key: "welcome_bonus_amount", value: "15.00" },
    { key: "referral_enabled", value: "true" },
    { key: "referral_bonus", value: "9.00" },
    { key: "referral_required_searches", value: "1" },
    { key: "webhook_secret", value: "whsec_numverge_otp_key_9921" },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 6. Admin Audit Log
  await prisma.auditLog.create({
    data: {
      adminId: masterAdmin.id,
      action: "NUMVERGE_INITIALIZED",
      targetType: "SYSTEM",
      targetId: "SYSTEM_INIT",
      metadata: JSON.stringify({ note: "NumVerge OTP platform baseline and 5SIM protocol synchronized." }),
      ipAddress: "127.0.0.1",
    },
  });

  console.log("NumVerge OTP database seeded successfully!");
  console.log("Master Admin: zh@gmail.com / AdminPassword123!");
  console.log("Secondary Admin: admin@numverge.com / AdminPassword123!");
  console.log("User: demo@numverge.com / UserPassword123!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
