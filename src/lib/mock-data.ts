/**
 * Mock data that mirrors the structure from the external CMS/HCLab databases.
 * In production, these API routes would query MySQL/Oracle via a separate
 * service or direct connection. For the portal demo, we use realistic mock data.
 */

import { STATUS_MAP } from "@/types";
import type {
  VisitListItem,
  VisitDetail,
  LabResult,
  ResultDetail,
  Vitals,
  Payment,
  PaymentListItem,
  QueueStatusData,
  AppNotification,
} from "@/types";

export function getMockVisits(_patientCode?: string): VisitListItem[] {
  return [
    {
      id: 1,
      code: "Q2026-001234",
      date: "2026-03-26T08:00:00Z",
      status: "waiting",
      friendlyStatus: STATUS_MAP["waiting"],
      doctor: "Maria Santos",
      department: "Internal Medicine",
      totalAmount: 2500.0,
      isPaid: false,
    },
    {
      id: 2,
      code: "Q2025-001198",
      date: "2025-03-10T09:30:00Z",
      status: "complete",
      friendlyStatus: STATUS_MAP["complete"],
      doctor: "Juan Reyes",
      department: "General Medicine",
      totalAmount: 1800.5,
      isPaid: true,
    },
    {
      id: 3,
      code: "Q2025-001050",
      date: "2025-02-15T10:00:00Z",
      status: "exit",
      friendlyStatus: STATUS_MAP["exit"],
      doctor: "Ana Dela Cruz",
      department: "Pediatrics",
      totalAmount: 3200.0,
      isPaid: true,
    },
    {
      id: 4,
      code: "Q2025-000987",
      date: "2025-01-20T14:00:00Z",
      status: "complete",
      friendlyStatus: STATUS_MAP["complete"],
      doctor: "Carlos Bautista",
      department: "Cardiology",
      totalAmount: 5000.0,
      isPaid: true,
    },
    {
      id: 5,
      code: "Q2024-003456",
      date: "2024-12-05T09:00:00Z",
      status: "exit",
      friendlyStatus: STATUS_MAP["exit"],
      doctor: "Maria Santos",
      department: "Internal Medicine",
      totalAmount: 1500.0,
      isPaid: true,
    },
  ];
}

export function getMockVisitDetail(code: string): VisitDetail | null {
  const visits = getMockVisits();
  const visit = visits.find((v) => v.code === code);
  if (!visit) return null;

  return {
    id: visit.id,
    code: visit.code,
    date: visit.date,
    status: visit.status,
    patientCode: "P2024-00123",
    services: [
      { id: 1, code: "SVC001", name: "Consultation Fee", amount: 800 },
      { id: 2, code: "SVC002", name: "Blood Chemistry Panel", amount: 1200 },
      { id: 3, code: "SVC003", name: "Urinalysis", amount: 300 },
      { id: 4, code: "SVC004", name: "ECG", amount: 200 },
    ],
    doctor: {
      id: 1,
      code: "DOC001",
      name: visit.doctor ?? "Unknown",
      specialty: visit.department,
    },
    department: visit.department,
    chiefComplaint: "Persistent headache and fatigue for 3 days",
    diagnosis: "Tension-type headache, suspect hypertension",
    totalAmount: visit.totalAmount,
    isPaid: visit.isPaid,
    hasResults: true,
    hasVitals: true,
    prescription: "Paracetamol 500mg PRN, Amlodipine 5mg OD",
  };
}

// Cycles through statuses on each call so status changes are detectable.
// Each step lasts ~30s (one poll interval). Starts at "waiting" → "in_progress" → "next_room" → "complete"
const QUEUE_CYCLE: Array<{
  status: QueueStatusData["status"];
  station: string;
  stationLabel: string;
  friendlyStatus: string;
  numOfCall: number;
  waitingAhead: number;
}> = [
  { status: "waiting",     station: "triage",       stationLabel: "Triage / Vitals",  friendlyStatus: "Waiting",              numOfCall: 0, waitingAhead: 3 },
  { status: "in_progress", station: "triage",       stationLabel: "Triage / Vitals",  friendlyStatus: "Being Served",         numOfCall: 1, waitingAhead: 0 },
  { status: "next_room",   station: "consultation", stationLabel: "Consultation",     friendlyStatus: "Moving to Next Station", numOfCall: 1, waitingAhead: 2 },
  { status: "in_progress", station: "consultation", stationLabel: "Consultation",     friendlyStatus: "Being Served",         numOfCall: 2, waitingAhead: 0 },
  { status: "complete",    station: "cashier",      stationLabel: "Cashier",          friendlyStatus: "Visit Complete",       numOfCall: 2, waitingAhead: 0 },
];

// Track which step each queue code is on (in-memory, resets on server restart)
const queueCycleIndex: Record<string, number> = {};

export function getMockQueueStatus(queueCode: string): QueueStatusData {
  const idx = queueCycleIndex[queueCode] ?? 0;
  const step = QUEUE_CYCLE[idx];

  // Advance to next step for the next poll (wraps back after complete)
  queueCycleIndex[queueCode] = idx < QUEUE_CYCLE.length - 1 ? idx + 1 : 0;

  return {
    queueCode,
    station: step.station,
    stationLabel: step.stationLabel,
    status: step.status,
    numOfCall: step.numOfCall,
    friendlyStatus: step.friendlyStatus,
    waitingAhead: step.waitingAhead,
    estimatedWait: step.waitingAhead * 10,
    lastUpdated: new Date().toISOString(),
  };
}

/** Force-reset a queue code back to step 0 (for testing) */
export function resetMockQueueCycle(queueCode: string) {
  queueCycleIndex[queueCode] = 0;
}

export function getMockResults(_patientCode?: string): LabResult[] {
  return [
    {
      id: 1,
      transNo: "LAB2025-0045678",
      queueCode: "Q2026-001234",
      date: "2025-03-20T11:00:00Z",
      type: "lab",
      description: "Complete Blood Count (CBC)",
      hasPdf: true,
      pdfPath: "results/LAB2025-0045678.pdf",
      status: "released",
      releasedAt: "2025-03-20T14:30:00Z",
      requestedBy: "Maria Santos",
    },
    {
      id: 2,
      transNo: "LAB2025-0045679",
      queueCode: "Q2026-001234",
      date: "2025-03-20T11:00:00Z",
      type: "lab",
      description: "Lipid Profile",
      hasPdf: true,
      pdfPath: "results/LAB2025-0045679.pdf",
      status: "released",
      releasedAt: "2025-03-20T15:00:00Z",
      requestedBy: "Maria Santos",
    },
    {
      id: 3,
      transNo: "IMG2025-0012345",
      queueCode: "Q2025-001198",
      date: "2025-03-10T12:00:00Z",
      type: "imaging",
      description: "Chest X-Ray PA View",
      hasPdf: true,
      pdfPath: "results/IMG2025-0012345.pdf",
      status: "released",
      releasedAt: "2025-03-10T16:00:00Z",
      requestedBy: "Juan Reyes",
    },
    {
      id: 4,
      transNo: "LAB2025-0039876",
      queueCode: "Q2025-001050",
      date: "2025-02-15T11:30:00Z",
      type: "lab",
      description: "Urinalysis",
      hasPdf: false,
      status: "verified",
      releasedAt: "2025-02-15T14:00:00Z",
      requestedBy: "Ana Dela Cruz",
    },
  ];
}

export function getMockResultDetail(queueCode: string): ResultDetail | null {
  const results = getMockResults();
  const result = results.find((r) => r.queueCode === queueCode);
  if (!result) return null;

  return {
    ...result,
    parameters: [
      {
        name: "Hemoglobin",
        value: "14.2",
        unit: "g/dL",
        referenceRange: "12.0 - 16.0",
        flag: "N",
      },
      {
        name: "WBC Count",
        value: "9.8",
        unit: "x10³/μL",
        referenceRange: "4.5 - 11.0",
        flag: "N",
      },
      {
        name: "Platelet Count",
        value: "320",
        unit: "x10³/μL",
        referenceRange: "150 - 400",
        flag: "N",
      },
      {
        name: "Hematocrit",
        value: "42.1",
        unit: "%",
        referenceRange: "36 - 46",
        flag: "N",
      },
      {
        name: "Neutrophils",
        value: "72",
        unit: "%",
        referenceRange: "40 - 70",
        flag: "H",
      },
    ],
    remarks:
      "Slightly elevated neutrophil percentage may indicate mild infection or stress response. Recommend follow-up if symptoms persist.",
    verifiedBy: "Dr. Lab Pathologist",
  };
}

export function getMockVitals(_patientCode?: string): Vitals[] {
  return [
    {
      id: 1,
      queueCode: "Q2026-001234",
      date: "2025-03-20T08:30:00Z",
      bp: "130/85",
      bpSystolic: 130,
      bpDiastolic: 85,
      temp: 36.8,
      weight: 68.5,
      height: 165,
      bmi: 25.2,
      pulse: 82,
      respiratoryRate: 18,
      o2sat: 98,
      painScale: 3,
      recordedBy: "Nurse Ana Lim",
      recordedAt: "2025-03-20T08:30:00Z",
    },
    {
      id: 2,
      queueCode: "Q2025-001198",
      date: "2025-03-10T09:45:00Z",
      bp: "125/80",
      bpSystolic: 125,
      bpDiastolic: 80,
      temp: 37.0,
      weight: 67.0,
      height: 165,
      bmi: 24.6,
      pulse: 76,
      respiratoryRate: 16,
      o2sat: 99,
      painScale: 0,
      recordedBy: "Nurse Maria Cruz",
      recordedAt: "2025-03-10T09:45:00Z",
    },
    {
      id: 3,
      queueCode: "Q2025-001050",
      date: "2025-02-15T10:15:00Z",
      bp: "120/78",
      bpSystolic: 120,
      bpDiastolic: 78,
      temp: 36.6,
      weight: 66.0,
      height: 165,
      bmi: 24.2,
      pulse: 72,
      o2sat: 98,
      recordedBy: "Nurse Rosa Santos",
      recordedAt: "2025-02-15T10:15:00Z",
    },
  ];
}

export function getMockPayments(_patientCode?: string): PaymentListItem[] {
  return [
    {
      id: 1,
      queueCode: "Q2025-001198",
      date: "2025-03-10T15:00:00Z",
      receiptNo: "OR-2025-034567",
      totalAmount: 1800.5,
      paymentMethod: "GCASH",
      status: "paid",
    },
    {
      id: 2,
      queueCode: "Q2025-001050",
      date: "2025-02-15T14:30:00Z",
      receiptNo: "OR-2025-028901",
      totalAmount: 3200.0,
      paymentMethod: "CASH",
      status: "paid",
    },
    {
      id: 3,
      queueCode: "Q2026-001234",
      date: "2025-03-20T00:00:00Z",
      receiptNo: "OR-2025-039876",
      totalAmount: 2500.0,
      paymentMethod: "CASH",
      status: "pending",
    },
  ];
}

export function getMockPaymentDetail(queueCode: string): Payment | null {
  const payments = getMockPayments();
  const payment = payments.find((p) => p.queueCode === queueCode);
  if (!payment) return null;

  return {
    id: payment.id,
    queueCode: payment.queueCode,
    date: payment.date,
    amount: payment.totalAmount * 0.88,
    discount: 0,
    tax: payment.totalAmount * 0.12,
    totalAmount: payment.totalAmount,
    paymentMethod: payment.paymentMethod,
    receiptNo: payment.receiptNo,
    status: payment.status,
    cashier: "Cashier Bella Santos",
    paidAt:
      payment.status === "paid"
        ? new Date(payment.date).toISOString()
        : undefined,
    items: [
      {
        id: 1,
        description: "Consultation Fee",
        quantity: 1,
        unitPrice: 800,
        total: 800,
        category: "Professional Fee",
      },
      {
        id: 2,
        description: "CBC with Differential",
        quantity: 1,
        unitPrice: 600,
        total: 600,
        category: "Laboratory",
      },
      {
        id: 3,
        description: "Urinalysis",
        quantity: 1,
        unitPrice: 250,
        total: 250,
        category: "Laboratory",
      },
      {
        id: 4,
        description: "Blood Chemistry",
        quantity: 1,
        unitPrice: 850.5,
        total: 850.5,
        category: "Laboratory",
      },
    ],
  };
}

export function getMockNotifications(userId: string): AppNotification[] {
  return [
    {
      id: "notif-001",
      userId,
      title: "Lab Results Available",
      message:
        "Your CBC and Lipid Profile results from March 20, 2025 are now available. Please log in to view them.",
      type: "success",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "notif-002",
      userId,
      title: "Pending Payment",
      message:
        "You have an outstanding balance of ₱2,500.00 for your visit on March 20, 2025. Please settle at the cashier.",
      type: "warning",
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "notif-003",
      userId,
      title: "Visit Complete",
      message:
        "Your visit on March 10, 2025 has been completed. Thank you for choosing NWDI Health Services.",
      type: "info",
      isRead: true,
      readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "notif-004",
      userId,
      title: "Welcome to the Patient Portal",
      message:
        "Your account has been verified. You can now access your medical records, results, and more.",
      type: "success",
      isRead: true,
      readAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
