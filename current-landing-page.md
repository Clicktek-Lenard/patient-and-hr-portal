# Current Landing Page Architecture

> Backup of original design is at `src/components/landing-page.original.tsx`
> Active enhanced design is at `src/components/landing-page.tsx`

---

## Original Design Structure

### File
`src/components/landing-page.tsx` (original backed up as `landing-page.original.tsx`)

### Components
| Component | Description |
|---|---|
| `PrivacyModal` | Full-screen privacy/terms modal shown on first load. Requires checkbox agreement before dismissing. |
| `LandingPage` | Main export. Single-page layout with header + hero only. |

### Sections (Original)
1. **PrivacyModal** — Fixed overlay, dark blue backdrop, scrollable terms, accept button
2. **Header** — Sticky, NWDI blue/red gradient, logo + brand name + desktop nav + hamburger
3. **Hero** — Full remaining height, dark blue gradient, badge + heading + subtitle + 2 portal cards + copyright

### State
| State | Type | Purpose |
|---|---|---|
| `hovering` | `"patient" \| "hr" \| null` | Card hover highlight |
| `showPrivacy` | `boolean` | Controls privacy modal visibility |
| `mobileMenuOpen` | `boolean` | Mobile nav toggle |
| `isMobile` | `boolean` | Responsive layout flag (`<= 639px`) |

### Colors (Brand)
- `NWD_BLUE = "#1006A0"` — primary brand blue
- `NWD_RED  = "#E00500"` — primary brand red
- `GOLD     = "#F0B429"` — accent gold on hero heading

### Portal Cards
- **Patient Portal** — Blue accent, Activity icon, links to `/login?portal=patient`
- **HR Portal** — Red accent, ShieldCheck icon, links to `/login?portal=hr`

---

## Enhanced Design Structure (Current Active)

### New Components
| Component | Description |
|---|---|
| `PrivacyModal` | Same as original, improved styling (blur backdrop, gold lock icon, colored border-left on sections) |
| `StatCounter` | Animated number counter using IntersectionObserver. Counts up when scrolled into view. |
| `LandingPage` | Multi-section full landing page |

### Sections (Enhanced)
1. **PrivacyModal** — Glassmorphism backdrop blur, improved typography
2. **Header** — Transparent → solid on scroll (glassmorphism), `Sign In` button added to desktop nav
3. **Hero** — Full viewport height, layered radial gradients, fine grid overlay, diagonal light streak, spring-animated portal cards, stats row with counters
4. **Features Section** — Light `#f8faff` background, 3-column grid of 6 feature cards with hover lift
5. **CTA Strip** — NWDI blue gradient, two CTA buttons (Patient + HR)
6. **Footer** — Dark `#02011A`, logo, contact links, legal links

### New State
| State | Type | Purpose |
|---|---|---|
| `scrolled` | `boolean` | Controls header glass effect on scroll |

### Features Grid Content
| Icon | Title |
|---|---|
| TrendingUp | Health Trend Charts |
| Cpu | AI Result Explanations |
| Share2 | Secure Physician Sharing |
| Calendar | Online Appointment Booking |
| FileText | Complete Medical Records |
| Heart | Vital Signs History |

### Stats Row
| Value | Label |
|---|---|
| 50,000+ | Patients Served |
| 98% | Satisfaction Rate |
| 15+ | Years of Excellence |
| 24/7 | Portal Access |

---

## To Revert to Original
```bash
cp src/components/landing-page.original.tsx src/components/landing-page.tsx
```
