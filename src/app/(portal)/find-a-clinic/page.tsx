"use client";

import { MapPin, Clock, Phone, ExternalLink, Search } from "lucide-react";
import { useState } from "react";

const BRANCHES = [
  { name: "NWD Quezon City (Main)",  address: "123 Timog Avenue, Quezon City, Metro Manila",          hours: "Mon–Sat 6:00 AM – 6:00 PM", phone: "(02) 8-920-1234", maps: "https://maps.google.com/?q=Quezon+City" },
  { name: "NWD Makati",              address: "456 Ayala Avenue, Makati City, Metro Manila",            hours: "Mon–Sat 6:00 AM – 6:00 PM", phone: "(02) 8-888-5678", maps: "https://maps.google.com/?q=Makati+City" },
  { name: "NWD Mandaluyong",         address: "78 Shaw Boulevard, Mandaluyong City, Metro Manila",      hours: "Mon–Sat 6:00 AM – 5:00 PM", phone: "(02) 8-534-9012", maps: "https://maps.google.com/?q=Mandaluyong" },
  { name: "NWD Pasig",               address: "321 Ortigas Avenue, Pasig City, Metro Manila",           hours: "Mon–Sat 6:00 AM – 6:00 PM", phone: "(02) 8-641-3456", maps: "https://maps.google.com/?q=Pasig+City" },
  { name: "NWD Caloocan",            address: "10th Avenue, Caloocan City, Metro Manila",               hours: "Mon–Fri 6:00 AM – 5:00 PM", phone: "(02) 8-362-7890", maps: "https://maps.google.com/?q=Caloocan+City" },
  { name: "NWD Marikina",            address: "Gil Fernando Avenue, Marikina City, Metro Manila",       hours: "Mon–Sat 6:00 AM – 5:00 PM", phone: "(02) 8-682-2345", maps: "https://maps.google.com/?q=Marikina+City" },
  { name: "NWD Taguig (BGC)",        address: "5th Avenue, Bonifacio Global City, Taguig",              hours: "Mon–Sat 6:00 AM – 7:00 PM", phone: "(02) 8-818-6789", maps: "https://maps.google.com/?q=BGC+Taguig" },
  { name: "NWD Parañaque",           address: "Dr. A. Santos Ave., Parañaque City, Metro Manila",       hours: "Mon–Sat 6:00 AM – 5:00 PM", phone: "(02) 8-826-0123", maps: "https://maps.google.com/?q=Paranaque+City" },
];

export default function FindAClinicPage() {
  const [search, setSearch] = useState("");
  const filtered = BRANCHES.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 4, height: 28, background: "#1006A0", borderRadius: 4, flexShrink: 0 }} />
          <h1 style={{
            fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em",
            color: "hsl(var(--foreground))",
            fontFamily: "var(--font-playfair, Georgia, serif)",
          }}>
            Find a Clinic
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", marginLeft: 16 }}>
          Locate your nearest NEW WORLD DIAGNOSTICS, INC. branch.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: 440 }}>
        <Search style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "hsl(var(--muted-foreground))" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by branch name or city…"
          style={{
            width: "100%", height: 44, paddingLeft: 40, paddingRight: 14,
            borderRadius: 12, fontSize: 14, outline: "none",
            border: "1.5px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "hsl(var(--ring))")}
          onBlur={(e)  => (e.currentTarget.style.borderColor = "hsl(var(--border))")}
        />
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {filtered.map((branch) => (
          <div
            key={branch.name}
            style={{
              background: "hsl(var(--card))",
              borderRadius: 16, padding: "20px 22px",
              border: "1px solid hsl(var(--border))",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--primary))";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--border))";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
            }}
          >
            {/* Branch name */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MapPin style={{ width: 16, height: 16, color: "var(--color-info)" }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))", lineHeight: 1.3 }}>{branch.name}</p>
                <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", marginTop: 3, lineHeight: 1.5 }}>{branch.address}</p>
              </div>
            </div>

            {/* Hours & Phone */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock style={{ width: 13, height: 13, color: "hsl(var(--muted-foreground))", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{branch.hours}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Phone style={{ width: 13, height: 13, color: "hsl(var(--muted-foreground))", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{branch.phone}</span>
              </div>
            </div>

            {/* Google Maps link */}
            <a
              href={branch.maps}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)",
                color: "var(--color-info)", textDecoration: "none", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1006A0"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "#1006A0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-info-bg)"; e.currentTarget.style.color = "var(--color-info)"; e.currentTarget.style.borderColor = "var(--color-info-border)"; }}
            >
              <ExternalLink style={{ width: 12, height: 12 }} />
              View on Google Maps
            </a>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 0" }}>
            <MapPin style={{ width: 40, height: 40, color: "hsl(var(--border))", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>No branches found</p>
            <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground) / 0.6)", marginTop: 6 }}>Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div style={{
        padding: "14px 18px",
        background: "hsl(var(--card))", borderRadius: 12,
        border: "1px solid hsl(var(--border))",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success)", flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", margin: 0 }}>
          Branch hours may vary on holidays. Call ahead or visit{" "}
          <a href="https://www.nwdi.com.ph/" target="_blank" rel="noopener noreferrer" style={{ color: "hsl(var(--primary))", fontWeight: 600, textDecoration: "none" }}>nwdi.com.ph</a>
          {" "}for the latest information.
        </p>
      </div>
    </div>
  );
}
