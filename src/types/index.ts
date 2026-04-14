// ============================================================
// Queue / Visit Status
// ============================================================

export type QueueStatusCode =
  | "startQueue"
  | "waiting"
  | "in_progress"
  | "on_hold"
  | "resume_queue"
  | "next_room"
  | "complete"
  | "exit";

export const STATUS_MAP: Record<QueueStatusCode, string> = {
  startQueue: "Registered",
  waiting: "Waiting",
  in_progress: "Being Served",
  on_hold: "On Hold",
  resume_queue: "Back in Queue",
  next_room: "Moving to Next Station",
  complete: "Visit Complete",
  exit: "Checked Out",
};

export const QUEUE_STATIONS = [
  { key: "registration", label: "Registration" },
  { key: "triage", label: "Triage / Vitals" },
  { key: "consultation", label: "Consultation" },
  { key: "laboratory", label: "Laboratory" },
  { key: "pharmacy", label: "Pharmacy" },
  { key: "cashier", label: "Cashier" },
];

export interface QueueStatusData {
  queueCode: string;
  station: string;
  stationLabel: string;
  status: QueueStatusCode;
  numOfCall: number;
  friendlyStatus: string;
  waitingAhead: number;
  estimatedWait?: number; // minutes
  lastUpdated: string;
}

// ============================================================
// Visit
// ============================================================

export interface Service {
  id: number;
  code: string;
  name: string;
  amount: number;
}

export interface Doctor {
  id: number;
  code: string;
  name: string;
  specialty?: string;
}

export interface Visit {
  id: number;
  code: string;
  date: string;
  status: QueueStatusCode;
  patientCode: string;
  services: Service[];
  doctor?: Doctor;
  department?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  totalAmount: number;
  isPaid: boolean;
}

export interface VisitListItem {
  id: number;
  code: string;
  date: string;
  status: QueueStatusCode;
  friendlyStatus: string;
  doctor?: string;
  department?: string;
  totalAmount: number;
  isPaid: boolean;
}

export interface VisitDetail extends Visit {
  queueStatus?: QueueStatusData;
  hasResults: boolean;
  hasVitals: boolean;
  prescription?: string;
}

// ============================================================
// Lab Results
// ============================================================

export type ResultType = "lab" | "imaging" | "pathology" | "other";

export interface LabResult {
  id: number;
  transNo: string;
  queueCode: string;
  date: string;
  type: ResultType;
  description: string;
  hasPdf: boolean;
  pdfPath?: string;
  status: "pending" | "released" | "verified";
  releasedAt?: string;
  requestedBy?: string;
}

export interface ResultDetail extends LabResult {
  parameters?: ResultParameter[];
  remarks?: string;
  verifiedBy?: string;
}

export interface ResultParameter {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  flag?: "H" | "L" | "N";
}

// ============================================================
// Vitals
// ============================================================

export interface Vitals {
  id: number;
  queueCode: string;
  date: string;
  bp?: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  temp?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  pulse?: number;
  respiratoryRate?: number;
  o2sat?: number;
  painScale?: number;
  recordedBy?: string;
  recordedAt?: string;
}

// ============================================================
// Payments
// ============================================================

export type PaymentMethod =
  | "CASH"
  | "GCASH"
  | "MAYA"
  | "CARD"
  | "BANK_TRANSFER"
  | "HMO"
  | "PHILHEALTH";

export interface PaymentItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
}

export interface Payment {
  id: number;
  queueCode: string;
  date: string;
  amount: number;
  discount?: number;
  discountLabel?: string;
  coverage?: number;
  coverageLabel?: string;
  tax?: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  receiptNo: string;
  status: "pending" | "paid" | "refunded" | "partial";
  items: PaymentItem[];
  cashier?: string;
  paidAt?: string;
}

export interface PaymentListItem {
  id: number;
  queueCode: string;
  date: string;
  receiptNo: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: "pending" | "paid" | "refunded" | "partial";
}

// ============================================================
// Notifications
// ============================================================

export type NotificationType = "info" | "success" | "warning" | "alert";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ============================================================
// User / Profile
// ============================================================

export interface UserProfile {
  id: string;
  patientCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dob: string;
  isVerified: boolean;
  emailVerifiedAt?: string;
  mobileVerifiedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
}

// ============================================================
// API Response
// ============================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// Dashboard
// ============================================================

export interface DashboardData {
  activeVisit?: VisitListItem;
  recentResults: LabResult[];
  pendingPayments: PaymentListItem[];
  recentVisits: VisitListItem[];
  unreadNotifications: number;
}
