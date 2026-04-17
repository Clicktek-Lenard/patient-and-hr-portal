"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Key, Phone, Loader2, Check, Shield,
  BadgeCheck, Fingerprint,
  Eye, EyeOff, Bell, Camera, X,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@/lib/validations/profile";
import { formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types";
import { useAvatar } from "@/hooks/use-avatar";

const AVATAR_STORAGE_KEY = (userId: string) => `nwd_avatar_${userId}`;

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  const json = await res.json();
  return json.data;
}

type NotifPref = { id: string; label: string; description: string };
const NOTIF_PREFS: NotifPref[] = [
  { id: "results_ready",   label: "Results Ready Alert",      description: "Get notified when your lab results are released" },
  { id: "appt_reminder",   label: "Appointment Reminders",    description: "Reminders 24 hours before your scheduled appointment" },
  { id: "abnormal_alert",  label: "Abnormal Value Alerts",    description: "Urgent notification for flagged or abnormal results" },
  { id: "payment_due",     label: "Payment Reminders",        description: "Reminders for pending or overdue payments" },
  { id: "share_viewed",    label: "Share Link Viewed",        description: "Notify when someone views your shared result link" },
];

function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    results_ready: true, appt_reminder: true, abnormal_alert: true, payment_due: false, share_viewed: false,
  });
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
    setSaved(false);
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-(--shadow-xs) overflow-hidden">
      <div className="px-6 py-4 border-b border-border bg-(--surface-1)">
        <h2 className="text-sm font-semibold text-foreground">Notification Preferences</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Choose what you want to be notified about</p>
      </div>
      <div className="divide-y divide-border">
        {NOTIF_PREFS.map((pref) => (
          <div key={pref.id} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{pref.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pref.description}</p>
            </div>
            <button
              onClick={() => toggle(pref.id)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors",
                prefs[pref.id]
                  ? "bg-primary border-primary"
                  : "bg-muted border-border"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                  prefs[pref.id] ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 border-t border-border flex justify-end">
        <Button
          onClick={save}
          className="h-9 rounded-xl px-5 gap-2 text-xs"
          style={{ background: "var(--gradient-primary)" }}
        >
          {saved ? <><Check className="h-3.5 w-3.5" />Saved!</> : <><Check className="h-3.5 w-3.5" />Save Preferences</>}
        </Button>
      </div>
    </div>
  );
}

function FieldRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium text-foreground", mono && "font-data tabular-nums")}>{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const avatarUrl = useAvatar();
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use localAvatarUrl as optimistic update, fall back to hook value
  const displayAvatarUrl = localAvatarUrl ?? avatarUrl;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (session?.user?.id) {
        localStorage.setItem(AVATAR_STORAGE_KEY(session.user.id), dataUrl);
      }
      setLocalAvatarUrl(dataUrl);
      setAvatarUploading(false);
      window.dispatchEvent(new Event("nwd-avatar-changed"));
      toast.success("Photo updated");
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      toast.error("Failed to read image");
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [session?.user?.id]);

  const handleRemoveAvatar = useCallback(() => {
    if (session?.user?.id) {
      localStorage.removeItem(AVATAR_STORAGE_KEY(session.user.id));
    }
    setLocalAvatarUrl(null);
    window.dispatchEvent(new Event("nwd-avatar-changed"));
    toast.success("Photo removed");
  }, [session?.user?.id]);

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName: "", lastName: "", email: "", dob: "" },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName,
        lastName:  profile.lastName,
        email:     profile.email,
        dob:       profile.dob ? profile.dob.split("T")[0] : "",
      });
    }
  }, [profile, profileForm]);

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      passwordForm.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const initials = profile
    ? getInitials(profile.firstName, profile.lastName)
    : "?";

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-(--color-info-bg) border border-(--color-info-border)">
              <User className="h-4 w-4 text-(--color-info)" />
            </div>
            <span className="text-xs font-semibold text-(--color-info) tracking-widest uppercase">My Account</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground leading-tight">Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your personal information and security settings
          </p>
        </div>
      </div>

      {/* Avatar card */}
      <div className="rounded-2xl border border-border bg-card shadow-(--shadow-xs) overflow-hidden">
        <div className="h-20 w-full" style={{ background: "var(--gradient-hero)" }} />
        <div className="px-6 pb-5">
          <div className="-mt-10 flex items-end justify-between gap-4">
            {/* Avatar with upload overlay */}
            <div className="relative shrink-0 group">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card shadow-(--shadow-md) overflow-hidden"
                style={{ background: displayAvatarUrl ? undefined : "var(--gradient-primary)" }}
              >
                {isLoading ? (
                  <div className="skeleton-shimmer h-full w-full rounded-xl" />
                ) : displayAvatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={displayAvatarUrl} alt="Profile photo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{initials}</span>
                )}
              </div>
              {/* Camera overlay — appears on hover */}
              {!isLoading && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-card"
                  title="Change photo"
                >
                  {avatarUploading
                    ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                    : <Camera className="h-5 w-5 text-white" />
                  }
                  <span className="text-[9px] text-white font-semibold mt-1 leading-none">
                    {avatarUploading ? "Uploading…" : "Change"}
                  </span>
                </button>
              )}
              {/* Remove button — shown only when photo is set */}
              {displayAvatarUrl && !isLoading && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive border-2 border-card text-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove photo"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="pb-1 flex flex-col items-end gap-1.5">
              {profile?.isVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-(--color-success-border) bg-(--color-success-bg) px-3 py-1 text-xs font-semibold text-(--color-success)">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified Account
                </span>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading || isLoading}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Camera className="h-3 w-3" />
                {displayAvatarUrl ? "Change photo" : "Upload photo"}
              </button>
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <div className="space-y-2">
                <div className="skeleton-shimmer h-5 w-40 rounded-lg" />
                <div className="skeleton-shimmer h-3.5 w-28 rounded-full" />
              </div>
            ) : (
              <>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">{profile?.email}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="h-10 rounded-xl border border-border bg-muted/40 p-1 gap-1">
          <TabsTrigger value="profile" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-(--shadow-xs) gap-1.5">
            <User className="h-3.5 w-3.5" /> Account &amp; Info
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:shadow-(--shadow-xs) gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* ── Account & Personal Info (combined, read-only) ── */}
        <TabsContent value="profile" className="mt-4 space-y-4">

          {/* Personal Information — read-only */}
          <div className="rounded-2xl border border-border bg-card shadow-(--shadow-xs) overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-(--surface-1) flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Personal Information</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Your registered personal details</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-(--color-info-border) bg-(--color-info-bg) px-2.5 py-1 text-[10px] font-semibold text-(--color-info)">
                <Shield className="h-3 w-3" /> Read-only
              </span>
            </div>
            <div className="px-6 py-2">
              <FieldRow label="First Name"   value={isLoading ? "—" : (profile?.firstName ?? "—")} />
              <FieldRow label="Last Name"    value={isLoading ? "—" : (profile?.lastName ?? "—")} />
              <FieldRow label="Email"        value={isLoading ? "—" : (profile?.email ?? "—")} />
              <FieldRow label="Date of Birth" value={isLoading ? "—" : (profile?.dob ? formatDate(profile.dob) : "—")} />
              <FieldRow label="Mobile"       value={isLoading ? "—" : (profile?.mobile ?? "—")} mono />
            </div>
            <div className="px-6 pb-4 pt-2">
              <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <Shield className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To update your personal information, please contact our clinic or support team. These details are managed by our clinical staff.
                </p>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="rounded-2xl border border-border bg-card shadow-(--shadow-xs) overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-(--surface-1)">
              <h2 className="text-sm font-semibold text-foreground">Account Details</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your account identifiers and status</p>
            </div>
            <div className="px-6 py-2">
              <FieldRow label="Patient Code"   value={profile?.patientCode ?? "Not linked"} mono />
              <FieldRow label="Account Status" value={profile?.isVerified ? "Verified" : "Unverified"} />
              <FieldRow label="Email Verified" value={profile?.emailVerifiedAt ? formatDate(profile.emailVerifiedAt) : "Not verified"} />
              <FieldRow label="Last Login"     value={profile?.lastLoginAt ? formatDate(profile.lastLoginAt) : "—"} />
              <FieldRow label="Member Since"   value={profile?.createdAt ? formatDate(profile.createdAt) : "—"} />
            </div>
          </div>

          {/* Account Security chips */}
          <div className="rounded-2xl border border-border bg-card shadow-(--shadow-xs) overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-(--surface-1)">
              <h2 className="text-sm font-semibold text-foreground">Account Security</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-(--color-success-border) bg-(--color-success-bg) px-4 py-3">
                <BadgeCheck className="h-5 w-5 text-(--color-success) shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-(--color-success)">Email Verified</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Identity confirmed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Mobile</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-data">{profile?.mobile ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <Fingerprint className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Patient Code</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-data">{profile?.patientCode ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>

        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="mt-4">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}
