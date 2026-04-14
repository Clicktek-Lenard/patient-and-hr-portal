/**
 * seed-patients.ts
 * Upserts real CMS patient accounts into portal_users WITHOUT wiping existing data.
 * Run with: npx tsx prisma/seed-patients.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Default password for all seeded patients — they can reset later
const DEFAULT_PASSWORD = "Nwdi2024!";

const PATIENTS = [
  {
    patientCode: "I202303300083",
    firstName:   "Medrana",
    lastName:    "Peñamante",
    email:       "medrana.penamante@nwdi.local",
    mobile:      "09000000001",
    dob:         new Date("2000-01-28"),
  },
  {
    patientCode: "L220000266178",
    firstName:   "Jessie James",
    lastName:    "Buatawan",
    email:       "butawan.jay@gmail.com",
    mobile:      "09291348309",
    dob:         new Date("1992-07-21"),
  },
  {
    patientCode: "L220000080101",
    firstName:   "Eleto",
    lastName:    "Aderiz",
    email:       "eleto.aderiz@nwdi.local",
    mobile:      "09000000003",
    dob:         new Date("1988-05-01"),
  },
];

async function main() {
  console.log("Seeding patient portal accounts…\n");

  const hashedPw = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const p of PATIENTS) {
    const existing = await prisma.portalUser.findUnique({
      where: { patientCode: p.patientCode },
    });

    if (existing) {
      console.log(`  SKIP  ${p.patientCode} — already exists (${existing.email})`);
      continue;
    }

    // Also check email uniqueness — use fallback if taken
    const emailTaken = await prisma.portalUser.findUnique({ where: { email: p.email } });
    const email = emailTaken ? `${p.patientCode.toLowerCase()}@nwdi.local` : p.email;

    // Check mobile uniqueness
    const mobileTaken = await prisma.portalUser.findUnique({ where: { mobile: p.mobile } });
    const mobile = mobileTaken ? `0900${Math.floor(Math.random() * 9000000 + 1000000)}` : p.mobile;

    const user = await prisma.portalUser.create({
      data: {
        patientCode:     p.patientCode,
        firstName:       p.firstName,
        lastName:        p.lastName,
        email,
        mobile,
        password:        hashedPw,
        dob:             p.dob,
        isVerified:      true,
        emailVerifiedAt: new Date(),
      },
    });

    console.log(`  CREATED  ${user.patientCode}  →  ${user.email}`);
  }

  console.log("\n=== Done ===");
  console.log(`Default password for all new accounts: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
