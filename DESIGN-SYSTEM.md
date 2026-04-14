# NWDI Patient Portal — Futuristic Medical Design System
**Version:** 2.0 | **Date:** 2026-03-25 | **Stack:** Next.js 15 · Tailwind CSS v4 · shadcn/ui

---

## Design Philosophy

> **"Clinical precision meets human warmth."**
>
> The portal draws from the visual language of next-generation medical interfaces —
> deep navy backgrounds, electric cyan accents, clean biometric data displays,
> and micro-animations that reinforce trust without sacrificing usability.

---

## ★ Design Rules (MUST FOLLOW)

These rules are non-negotiable for every component, page, or feature added to this portal.

### Rule 1 — Always Use CSS Variables, Never Hardcode Hex Colors

❌ **Wrong:**
```tsx
<div className="bg-[#071428] text-[#E8F4FD] border-[#0D2A4E]">
```

✅ **Correct:**
```tsx
<div className="bg-card text-foreground border-border">
```

**Why:** Hard-coded hex values break light/dark mode. Every color MUST reference a CSS variable token so theme switching works automatically. Use Tailwind semantic classes (`bg-card`, `text-primary`, `border-border`) or the CSS variable shorthand (`bg-(--color-success)`, `text-(--color-danger)`).

---

### Rule 2 — Tailwind v4 Canonical Class Syntax

Tailwind CSS v4 introduced shorter canonical forms. Always use these — the linter will warn otherwise.

| ❌ Old / Bracket Form | ✅ Canonical v4 Form |
|---|---|
| `h-[2px]` | `h-0.5` |
| `bg-[var(--color-success)]` | `bg-(--color-success)` |
| `text-[var(--color-danger)]` | `text-(--color-danger)` |
| `shadow-[var(--shadow-card)]` | `shadow-(--shadow-card)` |
| `bg-gradient-to-t` | `bg-linear-to-t` |
| `supports-[backdrop-filter]:bg-card/80` | `supports-backdrop-filter:bg-card/80` |
| `max-w-[120px]` | `max-w-30` (if a scale value exists) |
| `hover:shadow-[var(--glow-primary)]` | `hover:shadow-(--glow-primary)` |

**Rule:** Before committing, fix all `suggestCanonicalClasses` linter warnings. Run `npm run lint` and resolve every warning.

---

### Rule 3 — Every Interactive Element Must Have a Hover + Focus State

Every button, link, card, and input must communicate interactivity.

```tsx
// Card — hover border glow + shadow lift
className="border border-border hover:border-primary/40 hover:shadow-(--glow-primary) transition-all duration-200"

// Link/row — chevron slides right on hover
<ChevronRight className="group-hover:translate-x-0.5 group-hover:text-primary transition-all duration-150" />

// Input — cyan focus ring
className="focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20"
```

---

### Rule 4 — Use `font-data` + `tabular-nums` for All Medical Data

Any number shown to the patient (queue codes, vitals, amounts, counts) must use:

```tsx
<p className="font-data tabular-nums text-2xl font-bold">120/80</p>
<span className="font-data">#{queueCode}</span>
<p className="tabular-nums">{formatCurrency(amount)}</p>
```

**Why:** Proportional fonts cause numbers to shift width as they change — medical data must stay visually stable.

---

### Rule 5 — Status Always Has Three Parts: Color + Dot + Label

Never show status with color alone. Every status badge must have:
1. A colored dot indicator
2. A semantic background tint
3. A text label

```tsx
// ✅ Correct — uses Badge component with variant
<Badge variant="active">Being Served</Badge>    // cyan glow pulse
<Badge variant="success">Complete</Badge>        // green
<Badge variant="warning">Waiting</Badge>         // amber
<Badge variant="hold">On Hold</Badge>            // red
<Badge variant="secondary">Registered</Badge>    // muted

// ❌ Wrong — color alone
<span className="text-green-500">Complete</span>
```

---

### Rule 6 — Active / Live Elements Must Animate

Any element that represents a live or in-progress state must have an animation:

| State | Animation Class | Usage |
|---|---|---|
| Live queue / LIVE badge | `animate-live-blink` | Notification dot, LIVE badge |
| Active queue station | `animate-glow-pulse` | Station node, active banner border |
| Vitals heartbeat icon | `animate-heartbeat` | `HeartPulse` icon |
| ECG decoration | `ecg-path` (SVG class) | Auth page left panel |
| Loading skeleton | `skeleton-shimmer` | All loading placeholders |

**Rule:** Never use a static indicator for something that is live. If it's live, it must move.

---

### Rule 7 — Respect Reduced Motion

All animations must be disabled when the user prefers reduced motion. The `globals.css` already handles this via:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-glow-pulse, .animate-heartbeat,
  .animate-live-blink, .ecg-path, .live-dot,
  .skeleton-shimmer { animation: none; }
}
```

**Rule:** Never add a new animation class without also adding it to the reduced-motion block in `globals.css`.

---

### Rule 8 — Cards Must Use the Standard Panel Pattern

All content cards in the portal must follow this structure:

```tsx
// Section card with header + content
<div className="rounded-xl border border-border bg-card overflow-hidden">
  {/* Header */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="font-semibold text-sm text-foreground tracking-wide">Section Title</h2>
    </div>
    {/* Optional action */}
  </div>
  {/* Body */}
  <div className="p-4">{children}</div>
</div>
```

**Never** use raw `<Card>` with no icon and no divider for data sections — it looks flat and generic.

---

### Rule 9 — Stat Cards Always Have an Accent Color

Every stat card must declare an `accent` prop that drives:
- The top accent bar color
- The icon background + color
- The icon glow

```tsx
// ✅ Correct
<StatCard title="Lab Results" icon={FlaskConical} accent="purple" ... />
<StatCard title="Payments"    icon={CreditCard}   accent="amber"  ... />
<StatCard title="Visits"      icon={Calendar}     accent="cyan"   ... />
<StatCard title="Alerts"      icon={Bell}         accent="green"  ... />

// ❌ Wrong — no accent = generic blue blob
<StatCard title="Lab Results" icon={FlaskConical} iconBg="bg-blue-100" ... />
```

Available accents: `cyan` | `purple` | `amber` | `green` | `red`

---

### Rule 10 — Typography Hierarchy (Strict)

| Element | Classes |
|---|---|
| Page title | `text-2xl font-bold text-foreground` |
| Section heading | `font-semibold text-sm text-foreground uppercase tracking-widest` |
| Card title | `font-semibold text-sm text-foreground tracking-wide` |
| Body text | `text-sm text-foreground` |
| Secondary / caption | `text-xs text-muted-foreground` |
| Label above input | `text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground` |
| Medical data number | `font-data tabular-nums font-bold text-foreground` |
| Queue / transaction code | `font-data text-primary` |
| Muted footnote | `text-[10px] text-muted-foreground/60 tracking-wide` |

---

### Rule 11 — Theme Toggle is Always Visible

The Sun/Moon theme toggle must always be present in the portal header. It must:
- Use `useTheme()` from `next-themes`
- Show Sun icon in dark mode, Moon in light mode
- Animate the icon swap with `transition-all duration-300`
- **Never** be hidden on mobile

```tsx
<Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
</Button>
```

---

### Rule 12 — Left Accent Bar for Active/Live Cards

Any card that represents an active or live state gets a 2px left accent bar:

```tsx
<div className="relative overflow-hidden rounded-xl border border-primary/40 ...">
  {/* Left bar */}
  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
  {/* Content offset */}
  <div className="pl-4">...</div>
</div>
```

---

### Rule 13 — Empty States Must Be Intentional

Never leave an empty container blank. Every list/data section needs a styled empty state:

```tsx
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
        <span className="text-lg opacity-30">—</span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
```

---

### Rule 14 — Skeleton Loading Uses `skeleton-shimmer`, Not `animate-pulse`

```tsx
// ✅ Correct — uses design-system shimmer (theme-aware navy → cyan)
<div className="skeleton-shimmer h-20 w-full rounded-xl" />
// or use the Skeleton component:
<Skeleton className="h-20 w-full" />

// ❌ Wrong — generic grey pulse, not medical-themed
<div className="animate-pulse bg-muted h-20 rounded" />
```

---

### Rule 15 — No Raw Color Classes for Status

Do **not** use Tailwind's default color palette directly for medical status:

| ❌ Don't use | ✅ Use instead |
|---|---|
| `text-green-500` | `text-(--color-success)` |
| `text-red-500` | `text-(--color-danger)` or `text-destructive` |
| `text-yellow-500` | `text-(--color-warning)` |
| `bg-blue-100 dark:bg-blue-900` | `bg-primary/15` |
| `text-blue-600 dark:text-blue-400` | `text-primary` |

**Why:** These hard-code colors and don't adapt to both light and dark themes via the token system.

---

## Color Palette Reference

### Light Mode (`:root`)
| Token | Value | Usage |
|---|---|---|
| `--background` | `#F5F9FF` | Page background |
| `--card` | `#FFFFFF` | Card surfaces |
| `--primary` | `#00AACC` | Actions, links, accent |
| `--border` | `#C8DAEA` | Dividers, card edges |
| `--muted-foreground` | `#5D7A99` | Labels, captions |
| `--color-success` | `#008F4C` | Complete, verified, paid |
| `--color-warning` | `#B45309` | Pending, waiting |
| `--color-danger` | `#DC2626` | Error, on hold |

### Dark Mode (`.dark`)
| Token | Value | Usage |
|---|---|---|
| `--background` | `#030B1A` | Page background |
| `--card` | `#071428` | Card surfaces |
| `--primary` | `#00D4FF` | Biopulse cyan |
| `--border` | `#0D2A4E` | Dividers |
| `--muted-foreground` | `#7BA7CC` | Labels, captions |
| `--color-success` | `#00FF87` | Complete, paid |
| `--color-warning` | `#FFB800` | Pending, waiting |
| `--color-danger` | `#FF3366` | Error, critical |

---

## Animation Reference

| Class | Effect | Use When |
|---|---|---|
| `animate-glow-pulse` | Cyan border glow in/out | Active queue station, live banner |
| `animate-glow-pulse-green` | Green glow in/out | Complete status glow |
| `animate-heartbeat` | Scale pulse (heart) | Vitals `HeartPulse` icon |
| `animate-data-sweep` | Left-to-right clip reveal | ECG line, chart reveals |
| `animate-live-blink` | Opacity 1→0.35 | Live dot, notification badge |
| `animate-slide-up` | Fade + translateY(8px→0) | Page entry, modal open |
| `skeleton-shimmer` | Gradient sweep | All loading placeholders |
| `live-dot` | Blinking dot with glow | Live indicator next to text |
| `ecg-path` (SVG) | Stroke-dashoffset sweep | Auth page decoration |

---

## Component Hierarchy

```
Page
└── SectionCard (rounded-xl border bg-card)
    ├── Header (px-5 py-4 border-b) — icon + title + "View all" link
    └── Body (p-4)
        ├── StatCard      — accent bar top, icon, number, trend
        ├── VisitCard     — active left bar, status badge, amount
        ├── ResultCard    — type icon, description, badges
        ├── VitalsCard    — heartbeat icon, 4-pill grid
        ├── PaymentCard   — receipt no, amount, status
        └── QueueTracker  — station progress, live status banner
```

---

## File Structure

```
src/
├── app/
│   ├── globals.css              ← ALL design tokens live here
│   ├── (auth)/layout.tsx        ← Split panel, ECG decoration
│   └── (portal)/layout.tsx      ← Sidebar + header shell
├── components/
│   ├── ui/
│   │   ├── button.tsx           ← 6 variants (default/secondary/outline/ghost/destructive/link)
│   │   ├── input.tsx            ← Cyan focus glow
│   │   ├── card.tsx             ← Hover glow border
│   │   ├── badge.tsx            ← 9 variants with dot indicator
│   │   └── skeleton.tsx         ← Uses skeleton-shimmer (NOT animate-pulse)
│   └── portal/
│       ├── sidebar.tsx          ← Active: cyan left bar + bg-accent
│       ├── header.tsx           ← Theme toggle + notification bell
│       ├── stat-card.tsx        ← Top accent bar, icon with glow, trend
│       ├── visit-card.tsx       ← Active left bar, status badge
│       ├── result-card.tsx      ← Type icon, PDF badge
│       ├── vitals-card.tsx      ← Heartbeat icon, pill grid
│       ├── queue-tracker.tsx    ← Station progress, live banner
│       └── notification-bell.tsx ← Blinking badge
└── app/globals.css              ← Tokens, animations, utilities
```

---

*NWDI Patient Portal — BAESA Clinical Management System*
*Next.js 15 · Tailwind CSS v4 · shadcn/ui · Prisma · PostgreSQL*
