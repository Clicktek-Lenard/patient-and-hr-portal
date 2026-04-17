"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Package, Loader2, Check, X, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Slot = { id: string; date: string; time: string; packageType: string; available: number; total: number };
type Appointment = { id: string; appointmentDate: string; packageType: string; branch: string; status: string; notes: string | null };

const BRANCHES = ["Main Branch", "Makati Branch", "Pasig Branch", "Quezon City Branch", "Mandaluyong Branch"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  const { data, isLoading } = useQuery<{ data: { appointments: Appointment[]; slots: Slot[] } }>({
    queryKey: ["appointments"],
    queryFn: () => fetch("/api/appointments").then((r) => r.json()),
    staleTime: 60_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/appointments/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Failed to cancel appointment"),
  });

  const slots = data?.data?.slots ?? [];
  const appointments = (data?.data?.appointments ?? []).filter((a) => a.status !== "cancelled");

  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentDate: selectedSlot.date,
          appointmentTime: selectedSlot.time,
          packageType: selectedSlot.packageType,
          branch,
          notes,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Appointment booked successfully!");
      setSelectedSlot(null);
      setNotes("");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    } catch {
      toast.error("Failed to book appointment");
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ borderRadius: 14, background: "linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <CalendarPlus style={{ width: 16, height: 16, color: "rgba(255,255,255,0.8)" }} />
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Main</span>
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>Appointments</h1>
          <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", marginTop: 6 }}>Book and manage your lab appointments</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Available Slots */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">Available Slots</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border p-4 animate-pulse">
                  <div className="h-4 w-32 rounded bg-muted mb-2" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 32, textAlign: "center", boxShadow: "0 1px 3px var(--ui-shadow)" }}>
              <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No available slots at the moment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => {
                const isSelected = selectedSlot?.id === slot.id;
                const isFull = slot.available === 0;
                return (
                  <button
                    key={slot.id}
                    disabled={isFull}
                    onClick={() => setSelectedSlot(isSelected ? null : slot)}
                    style={{
                      background: isFull ? "var(--ui-bg)" : isSelected ? "var(--ui-active-bg)" : "var(--ui-card)",
                      border: isSelected ? "1.5px solid var(--ui-active-text)" : "1px solid var(--ui-border)",
                      borderRadius: 12, padding: 16, boxShadow: isSelected ? "0 2px 8px var(--ui-shadow)" : "0 1px 3px var(--ui-shadow)",
                      opacity: isFull ? 0.5 : 1, cursor: isFull ? "not-allowed" : "pointer",
                      transition: "all 0.15s", textAlign: "left", width: "100%",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{formatDate(slot.date)}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {slot.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Package className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground">{slot.packageType}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={cn(
                          "text-xs font-semibold",
                          isFull ? "text-red-500" : slot.available <= 2 ? "text-orange-500" : "text-green-500"
                        )}>
                          {isFull ? "Full" : `${slot.available} slots left`}
                        </span>
                        {isSelected && (
                          <div className="mt-1 flex justify-end">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking form + Upcoming */}
        <div className="space-y-4">
          {/* Booking form */}
          {selectedSlot && (
            <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px var(--ui-shadow)" }} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Confirm Booking</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(selectedSlot.date)} at {selectedSlot.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-3.5 w-3.5" />
                  <span>{selectedSlot.packageType}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border bg-background text-sm px-3 text-foreground"
                >
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any special requests or concerns…"
                  className="w-full rounded-xl border border-border bg-background text-sm px-3 py-2 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <button
                onClick={handleBook}
                disabled={booking}
                className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: "var(--gradient-primary)" }}
              >
                {booking
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Booking…</>
                  : <><Check className="h-4 w-4" />Confirm Appointment</>
                }
              </button>
            </div>
          )}

          {/* Upcoming appointments */}
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-3">
              Upcoming Appointments
            </h2>
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="rounded-2xl bg-card border border-border p-4 animate-pulse">
                    <div className="h-4 w-40 rounded bg-muted mb-2" />
                    <div className="h-3 w-28 rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 32, textAlign: "center", boxShadow: "0 1px 3px var(--ui-shadow)" }}>
                <CalendarPlus className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                <p className="text-xs text-muted-foreground mt-1">Select a slot above to book one</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div key={appt.id} style={{ background: "var(--ui-card)", border: "1px solid var(--ui-border)", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px var(--ui-shadow)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{appt.packageType}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />{formatDate(appt.appointmentDate)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />{formatTime(appt.appointmentDate)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />{appt.branch}
                          </span>
                        </div>
                        {appt.notes && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">{appt.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => cancelMutation.mutate(appt.id)}
                        disabled={cancelMutation.isPending}
                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/20 bg-destructive/5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-3 w-3" /> Cancel
                      </button>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-full px-2 py-0.5">
                        <Check className="h-2.5 w-2.5" /> Confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
