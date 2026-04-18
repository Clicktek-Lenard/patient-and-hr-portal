/* eslint-disable */
/**
 * Seed Health Trends test data for patient BAE162604170003 (LEONEL, TEST).
 *
 * Creates 8 historical visits spread across the past 12 months, each with
 * a vital sign record (BP, HR, weight, height, BMI, temperature) and
 * 1-2 basic lab transactions so Results and Trends both display data.
 */
const { PrismaClient } = require("../src/generated/cms-client");
const prisma = new PrismaClient();

const PATIENT_CODE = "BAE162604170003";

// Realistic vital sign progression — simulates slight variations month over month
const VITALS_TIMELINE = [
  { monthsAgo: 11, bpSys: 118, bpDia: 78, hr: 72, weight: 68.0, height: 170, temp: 36.5, complaint: "Annual physical examination" },
  { monthsAgo:  9, bpSys: 122, bpDia: 80, hr: 75, weight: 68.5, height: 170, temp: 36.6, complaint: "Follow-up check" },
  { monthsAgo:  7, bpSys: 125, bpDia: 82, hr: 78, weight: 69.2, height: 170, temp: 36.7, complaint: "Laboratory workup" },
  { monthsAgo:  6, bpSys: 128, bpDia: 84, hr: 80, weight: 70.0, height: 170, temp: 36.8, complaint: "Routine check-up" },
  { monthsAgo:  4, bpSys: 130, bpDia: 85, hr: 76, weight: 70.5, height: 170, temp: 36.6, complaint: "Lab monitoring" },
  { monthsAgo:  3, bpSys: 126, bpDia: 82, hr: 74, weight: 69.8, height: 170, temp: 36.5, complaint: "Follow-up" },
  { monthsAgo:  1, bpSys: 122, bpDia: 80, hr: 72, weight: 69.0, height: 170, temp: 36.4, complaint: "Periodic exam" },
  { monthsAgo:  0, bpSys: 120, bpDia: 78, hr: 70, weight: 68.5, height: 170, temp: 36.5, complaint: "Health screening" },
];

// Sample lab transactions per visit
const LAB_ITEMS = [
  { desc: "Complete Blood Count (CBC)", group: "Laboratory", amount: 350 },
  { desc: "Fasting Blood Sugar (FBS)", group: "Clinical Chemistry", amount: 180 },
  { desc: "Lipid Profile", group: "Clinical Chemistry", amount: 650 },
  { desc: "Urinalysis", group: "Laboratory", amount: 150 },
  { desc: "Chest X-Ray", group: "Imaging", amount: 450 },
];

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

async function main() {
  const patient = await prisma.cmsPatient.findFirst({
    where: { code: PATIENT_CODE },
    select: { id: true, code: true, fullName: true, firstName: true, lastName: true, gender: true, dob: true },
  });
  if (!patient) {
    console.error("❌ Patient not found:", PATIENT_CODE);
    process.exit(1);
  }
  console.log("✓ Target patient:", patient.code, patient.fullName);

  // Get next queue ID via raw SQL (autoincrement)
  const [{ max: maxQueueId }] = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(MAX(id), 0) AS max FROM queue`
  );
  let nextQueueId = BigInt(maxQueueId) + 1n;

  // Get next transaction ID
  const [{ max: maxTxId }] = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(MAX(id), 0) AS max FROM transactions`
  );
  let nextTxId = BigInt(maxTxId) + 1n;

  // Get next vitals ID
  const [{ max: maxVsId }] = await prisma.$queryRawUnsafe(
    `SELECT COALESCE(MAX(id), 0) AS max FROM vitalsign`
  );
  let nextVsId = BigInt(maxVsId) + 1n;

  for (const [i, v] of VITALS_TIMELINE.entries()) {
    const visitDate = monthsAgo(v.monthsAgo);
    const queueCode = `TEST${String(Date.now() % 1000000).padStart(6, "0")}-${i}`;
    const queueId = nextQueueId++;

    // Insert queue
    await prisma.$executeRawUnsafe(
      `INSERT INTO queue (
        id, code, date, datetime, idpatient, qfullname, qlastname, qfirstname, qgender, qdob,
        status, antedatestatus, patienttype
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      queueId,
      queueCode,
      visitDate,
      visitDate,
      patient.id,
      patient.fullName,
      patient.lastName,
      patient.firstName,
      patient.gender,
      patient.dob,
      500,  // released
      0,
      "OUT-PATIENT"
    );

    // Insert 1-2 transactions (labs) per visit
    const labCount = 1 + (i % 2);
    for (let j = 0; j < labCount; j++) {
      const lab = LAB_ITEMS[(i + j) % LAB_ITEMS.length];
      await prisma.$executeRawUnsafe(
        `INSERT INTO transactions (
          id, idqueue, codeitemprice, descriptionitemprice, amountitemprice,
          transactiontype, groupitemmaster, namecompany, status, date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        nextTxId++,
        queueId,
        `LAB-${j + 1}`,
        lab.desc,
        lab.amount,
        lab.group,
        lab.group,
        "BAESA DEFAULT",
        0,
        visitDate
      );
    }

    // Calculate BMI
    const heightM = v.height / 100;
    const bmi = (v.weight / (heightM * heightM)).toFixed(2);
    const bmiCategory =
      parseFloat(bmi) < 18.5 ? "Underweight" :
      parseFloat(bmi) < 25 ? "Normal" :
      parseFloat(bmi) < 30 ? "Overweight" : "Obese";

    // Insert vital signs (actual column names: bloodpresure, bloodpresureover)
    await prisma.$executeRawUnsafe(
      `INSERT INTO vitalsign (
        id, idqueue, queuecode, chiefcomplaint,
        pulserate, respiratoryrate, bloodpresure, bloodpresureover, temperature,
        height, weight, bmi, bmicategory, inputdate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      nextVsId++,
      queueId,
      queueCode,
      v.complaint,
      String(v.hr),
      String(18 + (i % 3)),
      v.bpSys,
      v.bpDia,
      String(v.temp),
      String(v.height),
      String(v.weight),
      String(bmi),
      bmiCategory,
      visitDate
    );

    console.log(`  ✓ Visit ${i + 1}/${VITALS_TIMELINE.length}: ${visitDate.toISOString().slice(0, 10)} | BP ${v.bpSys}/${v.bpDia} | HR ${v.hr} | BMI ${bmi}`);
  }

  console.log(`\n✓ Created ${VITALS_TIMELINE.length} visits with vitals + labs for ${patient.code}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
