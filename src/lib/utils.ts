import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return format(d, "MMM d, yyyy h:mm a");
}

export function formatTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCurrency(
  amount: number,
  currency: string = "PHP"
): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateOtp(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  const maskedLocal =
    local.length <= 2
      ? local
      : `${local.charAt(0)}${"*".repeat(local.length - 2)}${local.charAt(local.length - 1)}`;
  return `${maskedLocal}@${domain}`;
}

export function maskMobile(mobile: string): string {
  if (mobile.length < 4) return mobile;
  return `${"*".repeat(mobile.length - 4)}${mobile.slice(-4)}`;
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    waiting: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    exit: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    on_hold: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    startQueue: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    next_room: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    resume_queue: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  };
  return statusColors[status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
