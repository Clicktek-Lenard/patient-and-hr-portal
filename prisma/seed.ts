/**
 * Portal seed — DEV ONLY.
 *
 * WARNING: This seed WIPES the portal database. It only runs if
 *   ALLOW_DESTRUCTIVE_SEED=true
 * is explicitly set in the environment. Otherwise it aborts safely.
 *
 * Do NOT run this against production. Use prisma/seed-staging.sql
 * (idempotent, ON CONFLICT DO NOTHING) or prisma/seed-patients.ts
 * (upsert pattern) for production seeding.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Safety guard ─────────────────────────────────────────────────────────
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    console.error("\n❌ REFUSING TO RUN: prisma/seed.ts is destructive.\n");
    console.error("This seed deletes ALL portal users, sessions, notifications,");
    console.error("appointments, share links, OTPs, and access logs.\n");
    console.error("If you REALLY want to wipe the portal DB, set:");
    console.error("    ALLOW_DESTRUCTIVE_SEED=true\n");
    console.error("For safe seeding use one of:");
    console.error("  • prisma/seed-staging.sql    (idempotent SQL, recommended)");
    console.error("  • prisma/seed-patients.ts    (upsert-based, safe to re-run)\n");
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("\n❌ REFUSING TO RUN: NODE_ENV=production detected.\n");
    console.error("This destructive seed must never run against production.\n");
    process.exit(1);
  }

  console.log("⚠️  Destructive seed enabled. Wiping portal tables...");

  // Clean up existing data (order matters for FK constraints)
  await prisma.portalResultAccessLog.deleteMany();
  await prisma.portalOtp.deleteMany();
  await prisma.portalNotification.deleteMany();
  await prisma.portalSession.deleteMany();
  await prisma.portalAppointment.deleteMany();
  await prisma.portalShareLink.deleteMany();
  await prisma.portalUser.deleteMany();

  console.log("Creating demo patient account...");

  const hashedPassword = await bcrypt.hash("Password123!", 12);

  const demoUser = await prisma.portalUser.create({
    data: {
      patientCode: "P2024-00123",
      firstName: "Juan",
      lastName: "Dela Cruz",
      email: "juan.delacruz@example.com",
      mobile: "09171234567",
      password: hashedPassword,
      dob: new Date("1990-05-15"),
      isVerified: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  console.log(`Demo user created: ${demoUser.email}`);

  // Create sample notifications
  await prisma.portalNotification.createMany({
    data: [
      {
        userId: demoUser.id,
        title: "Lab Results Available",
        message:
          "Your CBC and Lipid Profile results from March 20, 2025 are now available. Log in to view them.",
        type: "success",
        isRead: false,
      },
      {
        userId: demoUser.id,
        title: "Pending Payment Reminder",
        message:
          "You have an outstanding balance of ₱2,500.00 for your visit on March 20, 2025. Please settle at the cashier.",
        type: "warning",
        isRead: false,
      },
      {
        userId: demoUser.id,
        title: "Visit Complete",
        message:
          "Your visit on March 10, 2025 has been completed. Thank you for choosing NWDI Health Services.",
        type: "info",
        isRead: true,
        readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: demoUser.id,
        title: "Welcome to the Patient Portal",
        message:
          "Your account has been verified successfully. You can now access your medical records, lab results, and more.",
        type: "success",
        isRead: true,
        readAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("Notifications created.");

  // Create a second test user
  const hashedPassword2 = await bcrypt.hash("TestPass123!", 12);

  const testUser2 = await prisma.portalUser.create({
    data: {
      patientCode: "P2024-00456",
      firstName: "Maria",
      lastName: "Santos",
      email: "maria.santos@example.com",
      mobile: "09289876543",
      password: hashedPassword2,
      dob: new Date("1985-08-22"),
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Second test user created: ${testUser2.email}`);

  // Create demo HR account
  const hrPassword = await bcrypt.hash("HRAdmin2024!", 12);

  const hrUser = await prisma.portalUser.create({
    data: {
      hrCode:    "HR-2024-00001",
      firstName: "Anna",
      lastName:  "Reyes",
      email:     "anna.reyes@nwdi.com.ph",
      mobile:    "09171112222",
      password:  hrPassword,
      dob:       new Date("1988-03-10"),
      role:      "HR",
      isVerified:      true,
      emailVerifiedAt: new Date(),
      lastLoginAt:     new Date(),
    },
  });

  console.log(`HR account created: ${hrUser.email}`);

  console.log("\n=== Seed Complete ===");
  console.log("Demo patient accounts:");
  console.log("  Patient ID: P2024-00123 · DOB: 1990-05-15");
  console.log("  Patient ID: P2024-00456 · DOB: 1985-08-22");
  console.log("");
  console.log("Demo HR account:");
  console.log("  Email:    anna.reyes@nwdi.com.ph");
  console.log("  Password: HRAdmin2024!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
