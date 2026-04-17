/**
 * HR Employee Filter
 *
 * An employee is any patient who has at least one visit (queue record).
 * No company name filtering — all patients with visits are shown.
 */

/**
 * Prisma `where` fragment for cmsTransaction — any transaction.
 */
export const EMPLOYEE_TRANSACTION_WHERE = {
  status: { not: 2 },
} as const;

/**
 * Prisma `where` for cmsPatient — patients with at least one visit.
 */
export const EMPLOYEE_PATIENT_WHERE = {
  isActive: 1,
  queues: {
    some: {},
  },
} as const;

/**
 * Prisma `where` for cmsQueue — any queue with transactions.
 */
export const EMPLOYEE_QUEUE_WHERE = {
  transactions: {
    some: EMPLOYEE_TRANSACTION_WHERE,
  },
} as const;
