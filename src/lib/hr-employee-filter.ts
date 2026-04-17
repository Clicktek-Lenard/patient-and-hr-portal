/**
 * HR Employee Filter
 *
 * In cms_v2_qa, ALL queues have patientType = "OUT-PATIENT" — that field
 * is NOT useful for distinguishing employees from walk-ins.
 *
 * The correct identifier is transaction.nameCompany:
 *  - "BAESA DEFAULT" (or similar "DEFAULT") = walk-in / cash patient
 *  - Any other non-null nameCompany = corporate employee
 *
 * Employee filter: patients who have at least one transaction with a
 * nameCompany that is NOT null and NOT containing "DEFAULT".
 */

/** Company name substrings that indicate a walk-in / non-corporate patient */
export const DEFAULT_COMPANY_KEYWORDS = ["DEFAULT"];

/**
 * Prisma `where` fragment for cmsTransaction that identifies
 * a corporate (employee) transaction.
 */
export const EMPLOYEE_TRANSACTION_WHERE = {
  nameCompany: { not: null },
  NOT: DEFAULT_COMPANY_KEYWORDS.map((kw) => ({
    nameCompany: { contains: kw, mode: "insensitive" as const },
  })),
} as const;

/**
 * Prisma `where` for cmsPatient — employees only.
 * A patient is an employee if they have at least one corporate transaction.
 */
export const EMPLOYEE_PATIENT_WHERE = {
  isActive: 1,
  queues: {
    some: {
      transactions: {
        some: EMPLOYEE_TRANSACTION_WHERE,
      },
    },
  },
} as const;

/**
 * Prisma `where` for cmsQueue — employee visits only.
 * A queue is an employee visit if it has at least one corporate transaction.
 */
export const EMPLOYEE_QUEUE_WHERE = {
  transactions: {
    some: EMPLOYEE_TRANSACTION_WHERE,
  },
} as const;
