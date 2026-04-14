import { PrismaClient } from "@prisma/client";

const portal = new PrismaClient();

async function seed() {
  // Upsert portal patient user via raw SQL
  await portal.$executeRawUnsafe(`
    INSERT INTO portal_users (id, patient_code, first_name, last_name, email, mobile, dob, role, is_active, created_at, updated_at)
    VALUES (
      'test-patient-001',
      'PT-TEST-001',
      'Juan',
      'Dela Cruz',
      'juan@test.com',
      '09999999001',
      '1990-05-15',
      'PATIENT',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      patient_code = 'PT-TEST-001',
      dob = '1990-05-15',
      role = 'PATIENT',
      is_active = true
  `);
  console.log("Portal patient user upserted: juan@test.com / PT-TEST-001 / DOB 1990-05-15");

  // Update HR user
  const hrUsers = await portal.$queryRawUnsafe(
    `SELECT id, email FROM portal_users WHERE role = 'HR' LIMIT 1`
  );

  if (hrUsers.length > 0) {
    const hrId = hrUsers[0].id;
    await portal.$executeRawUnsafe(
      `UPDATE portal_users SET hr_code = 'HR-TEST-001', pin = '123', dob = '1990-01-01' WHERE id = $1`,
      hrId
    );
    console.log(`HR user updated: ${hrUsers[0].email} -> hrCode=HR-TEST-001, pin=123, dob=1990-01-01`);
  } else {
    await portal.$executeRawUnsafe(`
      INSERT INTO portal_users (id, hr_code, pin, first_name, last_name, email, mobile, dob, role, is_active, created_at, updated_at)
      VALUES ('test-hr-001', 'HR-TEST-001', '123', 'HR', 'Staff', 'hr@nwdi.com', '09000000000', '1990-01-01', 'HR', true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET hr_code = 'HR-TEST-001', pin = '123', dob = '1990-01-01'
    `);
    console.log("HR user created: hr@nwdi.com / HR-TEST-001 / pin=123 / DOB 1990-01-01");
  }

  // Show all users
  const users = await portal.$queryRawUnsafe(
    `SELECT email, role, patient_code, hr_code, pin, dob FROM portal_users ORDER BY created_at`
  );
  console.log("\nAll users:");
  for (const u of users) {
    console.log(` - ${u.email} [${u.role}] patientCode=${u.patient_code} hrCode=${u.hr_code} pin=${u.pin} dob=${u.dob}`);
  }
}

seed().catch(console.error).finally(() => portal.$disconnect());
