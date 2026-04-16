"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Settings, Building2, Bell, Check, User, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NotifSetting = { id: string; label: string; description: string };

const NOTIF_SETTINGS: NotifSetting[] = [
  { id: "overdue_pe",      label: "Overdue PE Alerts",         description: "Monthly reminder when employees are overdue for Annual PE" },
  { id: "new_results",     label: "New Results Available",     description: "Alert when employee lab results are released" },
  { id: "compliance_drop", label: "Compliance Rate Drop",      description: "Notify when compliance rate drops below 85%" },
  { id: "bulk_complete",   label: "Bulk Schedule Confirmed",   description: "Confirmation when a bulk PE scheduling request is processed" },
];

export default function HrSettingsPage() {
  const { data: session } = useSession();

  const firstName = session?.user?.firstName ?? "";
  const lastName  = session?.user?.lastName  ?? "";

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    overdue_pe: true, new_results: true, compliance_drop: false, bulk_complete: true,
  });

  const [companyName,  setCompanyName]  = useState("NWD Corporation");
  const [contactPerson, setContactPerson] = useState(`${firstName} ${lastName}`.trim() || "HR Administrator");
  const [primaryBranch, setPrimaryBranch] = useState("Main Branch");
  const [editingCompany, setEditingCompany] = useState(false);

  function toggle(id: string) {
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  }

  function saveCompany() {
    setEditingCompany(false);
    toast.success("Company profile updated");
  }

  function saveNotifications() {
    toast.success("Notification settings saved");
  }

  const BRANCHES = ["Main Branch", "Makati Branch", "Pasig Branch", "Quezon City Branch", "Mandaluyong Branch"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-400/20">
            <Settings className="h-4 w-4 text-violet-500" />
          </div>
          <span className="text-xs font-semibold text-violet-500 tracking-widest uppercase">Configuration</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage HR account and notification preferences</p>
      </div>

      {/* Company Profile */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-foreground">Company Profile</h2>
          </div>
          <button
            onClick={() => editingCompany ? saveCompany() : setEditingCompany(true)}
            className={cn(
              "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors",
              editingCompany
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {editingCompany ? <><Check className="h-3 w-3" />Save</> : "Edit"}
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="h-3 w-3" /> Company Name
              </label>
              {editingCompany ? (
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{companyName}</p>
                  <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-full px-2 py-0.5">Corporate</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <User className="h-3 w-3" /> Contact Person
              </label>
              {editingCompany ? (
                <input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">{contactPerson}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Email
              </label>
              <p className="text-sm text-foreground">{session?.user?.email ?? "—"}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> HR Staff ID
              </label>
              <p className="text-sm font-mono text-muted-foreground">{(session?.user as { hrCode?: string })?.hrCode ?? "—"}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Primary NWD Branch</label>
            {editingCompany ? (
              <select
                value={primaryBranch}
                onChange={(e) => setPrimaryBranch(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background text-sm px-3 text-foreground"
              >
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            ) : (
              <p className="text-sm font-medium text-foreground">{primaryBranch}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-foreground">Notification Settings</h2>
          </div>
        </div>
        <div className="divide-y divide-border">
          {NOTIF_SETTINGS.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </div>
              <button
                onClick={() => toggle(s.id)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors",
                  prefs[s.id]
                    ? "bg-violet-600 border-violet-600"
                    : "bg-muted border-border"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                    prefs[s.id] ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end">
          <button
            onClick={saveNotifications}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors"
          >
            <Check className="h-3.5 w-3.5" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
