# Patient Portal Architecture
**Based on CMS v1 (BAESA Clinical Management System)**
**Date:** 2026-03-25

---

## 1. Executive Summary

The current CMS is an **internal staff-facing clinical workflow system**. It does NOT have a patient-facing portal. Patients cannot log in, view their results, book appointments, or access their health records directly.

This document defines a full architecture to implement a **Patient Portal** — a self-service web/mobile-accessible interface where patients can:

- Register and authenticate with their own credentials
- View lab/imaging results (PDF from HCLAB)
- Track their current queue/visit status in real-time
- View appointment history and upcoming schedules
- Access their vital signs history
- Receive SMS/email notifications
- Download official receipts

---

## 2. Current System Analysis

### 2.1 Existing Databases

| Database | Engine | Purpose |
|---|---|---|
| `mysql` (auth) | MySQL | Users, roles, LDAP auth |
| `CMS` | MySQL | Queue, transactions, vitals, payments |
| `Queuing` | MySQL | Kiosk queue positions, workstation registry |
| `Eros` | Oracle/MySQL | Master patient, physician, company, pricing |
| `HCLab` | Oracle | External laboratory system |
| `Notification` | MySQL | SMS/email notification queue |

### 2.2 Patient Data Locations

| Data | Location | Key Fields |
|---|---|---|
| Patient demographics | `Eros.Patient` | Code, FullName, DOB, Gender, Email, Address |
| Visit/queue records | `CMS.Queue` | Status, Code, Date, IdPatient |
| Services per visit | `CMS.Transactions` | IdQueue, CodeItemPrice, Amount |
| Vital signs | `CMS.Vitals` | IdQueue, BP, Temp, Weight, Height |
| Payment records | `CMS.PaymentHistory` | IdQueue, Amount, PaymentMethod, ReceiptNo |
| Lab PDFs | AWS S3 (`nwdi-pdf-bucket`) | `{YYYY-MM-DD}/{TransNo}_{YYYYMMDD}_{PatientId}.pdf` |
| Queue position | `Queuing.Kiosk` | IdQueueCMS, Station, Status, numOfCall |

### 2.3 Existing Assets That Can Be Reused

- `HclabController.php` — PDF retrieval from S3 (adapt for patient-facing)
- `Notification` DB — SMS/email queue already exists
- `LoginRequest.php` — Authentication pattern (adapt for patient credentials)
- HL7 routes — Existing data exchange layer
- `CheckCMS` middleware — Pattern for role-based auth

---

## 3. Patient Portal Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PATIENT DEVICES                          │
│   [Web Browser]          [Mobile (PWA)]        [SMS Link]       │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼─────────────────────────────────┐
│                    PATIENT PORTAL FRONTEND                      │
│              Laravel Blade + Vue.js / React SPA                 │
│                                                                 │
│  [Login/Register] [Dashboard] [Results] [Queue Tracker]        │
│  [Visit History]  [Payments]  [Profile]  [Notifications]       │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Internal API (REST)
┌───────────────────────────────▼─────────────────────────────────┐
│                 PATIENT PORTAL BACKEND MODULE                   │
│                  Laravel (New Module in CMS)                    │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐  │
│  │ Auth Service │ │ Queue Service│ │  Results Service       │  │
│  │              │ │              │ │                        │  │
│  │ - Register   │ │ - Live Queue │ │ - Lab PDFs (S3)       │  │
│  │ - Login      │ │   Status     │ │ - Imaging results     │  │
│  │ - OTP verify │ │ - Call notif.│ │ - Vitals history      │  │
│  │ - JWT tokens │ │ - History    │ │ - Visit summary       │  │
│  └──────────────┘ └──────────────┘ └────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐  │
│  │ Payment Svc  │ │ Notif. Svc   │ │  Profile Service       │  │
│  │              │ │              │ │                        │  │
│  │ - Receipts   │ │ - SMS        │ │ - Demographics        │  │
│  │ - Statements │ │ - Email      │ │ - Medical cards       │  │
│  │ - Balance    │ │ - Push notif │ │ - Company/HMO info    │  │
│  └──────────────┘ └──────────────┘ └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │               │              │              │
         ▼               ▼              ▼              ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌──────────┐
   │  Eros DB │   │  CMS DB  │   │  AWS S3  │  │Notif. DB │
   │ (Patient │   │(Queue,   │   │  (Lab    │  │(SMS/Email│
   │  Master) │   │ Vitals,  │   │  PDFs)   │  │  Queue)  │
   │          │   │ Payment) │   │          │  │          │
   └──────────┘   └──────────┘   └──────────┘  └──────────┘
                       │
                       ▼
                ┌──────────┐
                │Queuing DB│
                │(Real-time│
                │  Queue)  │
                └──────────┘
```

---

## 4. New Database Tables

### 4.1 `portal_users` (New — in `mysql` auth DB)

Separate from staff `users` table to avoid conflicts.

```sql
CREATE TABLE portal_users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_code    VARCHAR(50) UNIQUE NULL,          -- Links to Eros.Patient.Code
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(191) UNIQUE NOT NULL,
    mobile          VARCHAR(20) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,            -- bcrypt
    dob             DATE NOT NULL,
    is_verified     TINYINT(1) DEFAULT 0,             -- OTP verified
    is_active       TINYINT(1) DEFAULT 1,
    email_verified_at TIMESTAMP NULL,
    mobile_verified_at TIMESTAMP NULL,
    remember_token  VARCHAR(100) NULL,
    last_login_at   TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL
);
```

### 4.2 `portal_otp` (New — in `mysql` auth DB)

```sql
CREATE TABLE portal_otp (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    type        ENUM('email', 'mobile') NOT NULL,
    code        VARCHAR(10) NOT NULL,                -- 6-digit OTP
    purpose     ENUM('register', 'login', 'reset') NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used_at     TIMESTAMP NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES portal_users(id)
);
```

### 4.3 `portal_tokens` (New — Personal Access Tokens for API)

```sql
-- Use Laravel Sanctum (already installed per composer.json)
-- personal_access_tokens table already exists from migrations
-- Tag tokens with `portal` to distinguish from staff tokens
```

### 4.4 `portal_result_access_log` (New — Audit trail for result access)

```sql
CREATE TABLE portal_result_access_log (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    portal_user_id  BIGINT UNSIGNED NOT NULL,
    queue_code      VARCHAR(50) NOT NULL,
    access_type     ENUM('lab_pdf', 'vitals', 'receipt', 'summary') NOT NULL,
    file_path       VARCHAR(500) NULL,
    accessed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address      VARCHAR(45) NULL,
    FOREIGN KEY (portal_user_id) REFERENCES portal_users(id)
);
```

---

## 5. New Migrations

```
database/migrations/
├── 2026_03_25_000001_create_portal_users_table.php
├── 2026_03_25_000002_create_portal_otp_table.php
└── 2026_03_25_000003_create_portal_result_access_log_table.php
```

---

## 6. New Routes

### 6.1 File: `routes/portal.php`

```php
// Guest routes
Route::prefix('portal')->name('portal.')->group(function () {

    // Authentication
    Route::get('/login',    [PortalAuthController::class, 'showLogin'])->name('login');
    Route::post('/login',   [PortalAuthController::class, 'login']);
    Route::get('/register', [PortalAuthController::class, 'showRegister'])->name('register');
    Route::post('/register',[PortalAuthController::class, 'register']);
    Route::post('/verify-otp', [PortalAuthController::class, 'verifyOtp'])->name('verify-otp');
    Route::post('/resend-otp', [PortalAuthController::class, 'resendOtp'])->name('resend-otp');
    Route::get('/forgot-password', [PortalAuthController::class, 'showForgotPassword']);
    Route::post('/forgot-password',[PortalAuthController::class, 'sendResetOtp']);
    Route::post('/reset-password', [PortalAuthController::class, 'resetPassword']);

    // Queue status (shareable link — no auth required)
    Route::get('/queue-status/{code}', [PortalQueueController::class, 'publicStatus'])
        ->name('queue.public');
});

// Authenticated patient routes
Route::prefix('portal')->name('portal.')->middleware(['portal.auth'])->group(function () {

    Route::get('/logout', [PortalAuthController::class, 'logout'])->name('logout');

    // Dashboard
    Route::get('/dashboard', [PortalDashboardController::class, 'index'])->name('dashboard');

    // Queue / Visit tracker
    Route::get('/visits',                    [PortalVisitController::class, 'index'])->name('visits.index');
    Route::get('/visits/{code}',             [PortalVisitController::class, 'show'])->name('visits.show');
    Route::get('/visits/{code}/queue-status',[PortalVisitController::class, 'queueStatus'])->name('visits.queue');

    // Lab Results
    Route::get('/results',                   [PortalResultController::class, 'index'])->name('results.index');
    Route::get('/results/{queueCode}',       [PortalResultController::class, 'show'])->name('results.show');
    Route::get('/results/{queueCode}/pdf',   [PortalResultController::class, 'downloadPdf'])->name('results.pdf');

    // Vital Signs History
    Route::get('/vitals',                    [PortalVitalsController::class, 'index'])->name('vitals.index');
    Route::get('/vitals/{queueCode}',        [PortalVitalsController::class, 'show'])->name('vitals.show');

    // Payments / Receipts
    Route::get('/payments',                  [PortalPaymentController::class, 'index'])->name('payments.index');
    Route::get('/payments/{queueCode}',      [PortalPaymentController::class, 'show'])->name('payments.show');
    Route::get('/payments/{queueCode}/receipt', [PortalPaymentController::class, 'receipt'])->name('payments.receipt');

    // Profile
    Route::get('/profile',                   [PortalProfileController::class, 'show'])->name('profile.show');
    Route::put('/profile',                   [PortalProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/change-password',  [PortalProfileController::class, 'changePassword']);
    Route::post('/profile/change-mobile',    [PortalProfileController::class, 'changeMobile']);

    // Notifications
    Route::get('/notifications',             [PortalNotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read',  [PortalNotificationController::class, 'markRead']);
});
```

### 6.2 Register in `bootstrap/app.php` or `RouteServiceProvider.php`

```php
Route::middleware('web')
    ->group(base_path('routes/portal.php'));
```

---

## 7. New Controllers

```
app/Http/Controllers/portal/
├── PortalAuthController.php          -- Login, register, OTP, reset
├── PortalDashboardController.php     -- Summary widgets
├── PortalVisitController.php         -- Visit list + queue tracker
├── PortalResultController.php        -- Lab/imaging PDFs from S3
├── PortalVitalsController.php        -- Vitals history
├── PortalPaymentController.php       -- Payment records + receipts
├── PortalProfileController.php       -- Demographics, password, mobile
└── PortalNotificationController.php  -- In-app notifications
```

### 7.1 `PortalAuthController` — Key Logic

```php
// Registration: Match to Eros.Patient by Name + DOB + Mobile
// If no match: create unlinked account, link later at clinic
// If match: store patient_code

// OTP: 6-digit, expires in 10 minutes
// Send via Notification DB queue (existing SMS infrastructure)

// Login: Email/password + OTP (2FA optional, configurable)
// Session: Store portal_user_id, patient_code
// Token: Laravel Sanctum personal access token tagged 'portal'
```

### 7.2 `PortalResultController` — Key Logic

```php
// 1. Verify the queue belongs to this patient
//    CMS.Queue WHERE IdPatient = session patient_code AND Code = $queueCode

// 2. Fetch HCLab accession numbers
//    HCLab.ORD_HDR WHERE PatientId = $patientCode

// 3. Build S3 path: {YYYY-MM-DD}/{TransNo}_{YYYYMMDD}_{PatientId}.pdf

// 4. Generate pre-signed URL (15-minute expiry) — do NOT expose direct S3 URL
//    Storage::disk('s3')->temporaryUrl($path, now()->addMinutes(15))

// 5. Log access to portal_result_access_log

// 6. Return URL to frontend (redirect or embedded iframe)
```

### 7.3 `PortalVisitController` — Queue Status Logic

```php
// Real-time queue status from Queuing.Kiosk:
// Kiosk WHERE IdQueueCMS = $queueId

// Status mapping for patient-friendly display:
$statusMap = [
    'startQueue'   => 'Registered',
    'waiting'      => 'Waiting',
    'in_progress'  => 'Being Served',
    'on_hold'      => 'On Hold',
    'resume_queue' => 'Back in Queue',
    'next_room'    => 'Moving to Next Station',
    'complete'     => 'Visit Complete',
    'exit'         => 'Checked Out',
];

// Remaining stations: parse Kiosk.Station pipe-separated value
// numOfCall: how many times called (for wait time estimation)
```

---

## 8. New Models

```
app/Models/portal/
├── PortalUser.php               -- Authenticatable, HasApiTokens (Sanctum)
├── PortalOtp.php                -- OTP management
└── PortalResultAccessLog.php    -- Audit trail
```

### 8.1 `PortalUser.php`

```php
class PortalUser extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

    protected $connection = 'mysql'; // auth DB
    protected $table = 'portal_users';

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'dob'                  => 'date',
        'is_verified'          => 'boolean',
        'email_verified_at'    => 'datetime',
        'mobile_verified_at'   => 'datetime',
    ];

    // Fetch linked Eros patient record
    public function erosPatient()
    {
        return $this->hasOne(\App\Models\eros\ErosPatient::class, 'Code', 'patient_code');
    }
}
```

---

## 9. Middleware

### 9.1 `CheckPortalAuth` (New)

```
app/Http/Middleware/CheckPortalAuth.php
```

```php
// Check session('portal_user_id') exists
// Redirect to portal.login if not authenticated
// Different from staff CheckCMS middleware — no role/tab validation needed
```

### 9.2 Register in `app/Http/Kernel.php`

```php
protected $routeMiddleware = [
    // ... existing ...
    'portal.auth' => \App\Http\Middleware\CheckPortalAuth::class,
];
```

---

## 10. Frontend Views

```
resources/views/portal/
├── layouts/
│   └── portal.blade.php          -- Main layout (navbar, footer, notifications bell)
├── auth/
│   ├── login.blade.php
│   ├── register.blade.php
│   ├── verify-otp.blade.php
│   └── forgot-password.blade.php
├── dashboard/
│   └── index.blade.php           -- Summary: active visit, recent results, pending payments
├── visits/
│   ├── index.blade.php           -- Visit history list
│   └── show.blade.php            -- Visit detail + real-time queue tracker
├── results/
│   ├── index.blade.php           -- All lab/imaging results
│   └── show.blade.php            -- Result detail + PDF viewer/download
├── vitals/
│   ├── index.blade.php           -- Vitals history list
│   └── show.blade.php            -- Vitals detail per visit
├── payments/
│   ├── index.blade.php           -- Payment history
│   ├── show.blade.php            -- Payment detail per visit
│   └── receipt.blade.php         -- Printable receipt
├── profile/
│   └── show.blade.php            -- Profile edit, password, mobile change
└── notifications/
    └── index.blade.php           -- Notification inbox
```

### 10.1 Queue Tracker Component (Vue.js)

Real-time queue status widget using Laravel Echo / Pusher or polling:

```javascript
// QueueTracker.vue
// Polls GET /portal/visits/{code}/queue-status every 30s
// Shows: station progress bar, current status, call count
// Alerts patient when status changes to 'in_progress'
```

---

## 11. Security Architecture

### 11.1 Patient Data Isolation

| Rule | Implementation |
|---|---|
| Patients only see own data | All queries filter by `patient_code` from auth session |
| PDF access controlled | Pre-signed S3 URLs (15-min expiry), no direct bucket access |
| Audit trail | `portal_result_access_log` records every PDF/result access |
| No staff data exposed | Portal controllers use only patient-relevant query scopes |

### 11.2 Authentication Security

| Feature | Implementation |
|---|---|
| Password hashing | `bcrypt` via Laravel `Hash::make()` |
| OTP expiry | 10-minute window, single-use |
| Brute force protection | `throttle:6,1` middleware on login/OTP routes |
| Session isolation | Portal uses `portal_guard` (separate auth guard) |
| CSRF | Laravel CSRF tokens on all forms |
| HTTPS | Enforced via `TrustProxies` + HSTS header |

### 11.3 Auth Guards Configuration (`config/auth.php`)

```php
'guards' => [
    'web' => [                          // Existing staff guard
        'driver' => 'session',
        'provider' => 'users',
    ],
    'portal' => [                       // New patient guard
        'driver' => 'session',
        'provider' => 'portal_users',
    ],
],

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model'  => App\Models\User::class,
    ],
    'portal_users' => [                 // New
        'driver' => 'eloquent',
        'model'  => App\Models\Portal\PortalUser::class,
    ],
],
```

---

## 12. Notification Integration

Reuse the existing `Notification` database to queue portal notifications.

### 12.1 Trigger Points for Patient Notifications

| Event | Notification | Channel |
|---|---|---|
| OTP request | "Your OTP is: {code}" | SMS |
| Queue created | "Your queue code is: {code}. Track at: {url}" | SMS + Email |
| Patient called at station | "You are being called at {station}" | SMS + Push |
| Lab results ready | "Your lab results are now available in the portal" | SMS + Email |
| Payment confirmed | "Payment of PHP {amount} received. Receipt: {no}" | SMS + Email |
| Visit complete | "Your visit is complete. View summary: {url}" | SMS + Email |

### 12.2 Notification Service

```
app/Services/Portal/PortalNotificationService.php
```

```php
class PortalNotificationService
{
    public function sendSms(PortalUser $user, string $message): void
    {
        DB::connection('Notification')->table('sms_queue')->insert([
            'mobile'     => $user->mobile,
            'message'    => $message,
            'status'     => 'pending',
            'created_at' => now(),
        ]);
    }

    public function sendEmail(PortalUser $user, string $subject, string $view): void
    {
        // Use Laravel Mail with existing mail configuration
        Mail::to($user->email)->queue(new PortalMailable($subject, $view));
    }
}
```

---

## 13. Patient Account Linking Flow

Since patients already exist in `Eros.Patient`, we need a way to link portal accounts to existing records.

```
Patient registers with: First Name + Last Name + DOB + Mobile

  ┌─────────────────────────────────────────────┐
  │         REGISTRATION FLOW                   │
  └─────────────────────────────────────────────┘
           │
           ▼
  Search Eros.Patient WHERE
    UPPER(FullName) LIKE '%{lastname}%'
    AND DOB = {dob}
    AND Mobile = {mobile}
           │
    ┌──────┴──────┐
    │             │
  MATCH        NO MATCH
    │             │
    ▼             ▼
  Link to     Create portal_users
  patient_    with patient_code = NULL
  code        (Staff will manually link
              at next clinic visit)
    │             │
    └──────┬──────┘
           ▼
  Verify mobile via OTP
           │
           ▼
  Portal account active
```

### 13.1 Manual Linking by Staff (CMS side)

Add a simple view in CMS for staff to link unmatched portal accounts:

```
/cms/portal/link-accounts
```

- List portal users with `patient_code = NULL`
- Search Eros.Patient
- Assign patient code

---

## 14. Implementation Phases

### Phase 1 — Foundation (Week 1-2)
- [ ] Create migrations (`portal_users`, `portal_otp`, `portal_result_access_log`)
- [ ] Create `PortalUser` model + Sanctum integration
- [ ] Configure `portal` auth guard in `config/auth.php`
- [ ] Create `CheckPortalAuth` middleware
- [ ] Build `PortalAuthController` (register, login, OTP, reset)
- [ ] Create auth views (login, register, OTP verify)
- [ ] Register `routes/portal.php`
- [ ] OTP → SMS via existing Notification DB

### Phase 2 — Core Features (Week 3-4)
- [ ] `PortalVisitController` + visit history views
- [ ] Real-time queue tracker (polling endpoint)
- [ ] `PortalResultController` + S3 pre-signed PDF URLs
- [ ] `PortalVitalsController` + vitals history views
- [ ] `PortalDashboardController` + dashboard widgets
- [ ] Patient account linking flow

### Phase 3 — Payments & Notifications (Week 5)
- [ ] `PortalPaymentController` + receipt views
- [ ] `PortalNotificationService` + trigger points
- [ ] In-app notification inbox
- [ ] Email templates (Laravel Mailable)
- [ ] SMS triggers at queue stage changes

### Phase 4 — Polish & Security (Week 6)
- [ ] Result access audit logging
- [ ] Rate limiting on all auth endpoints
- [ ] Input validation hardening
- [ ] Mobile-responsive CSS/UI polish
- [ ] PWA manifest + service worker (optional, for mobile install)
- [ ] Staff CMS page for manual account linking
- [ ] End-to-end testing

---

## 15. File Summary — New Files to Create

```
app/
├── Http/
│   ├── Controllers/portal/
│   │   ├── PortalAuthController.php
│   │   ├── PortalDashboardController.php
│   │   ├── PortalVisitController.php
│   │   ├── PortalResultController.php
│   │   ├── PortalVitalsController.php
│   │   ├── PortalPaymentController.php
│   │   ├── PortalProfileController.php
│   │   └── PortalNotificationController.php
│   └── Middleware/
│       └── CheckPortalAuth.php
├── Models/portal/
│   ├── PortalUser.php
│   ├── PortalOtp.php
│   └── PortalResultAccessLog.php
└── Services/Portal/
    └── PortalNotificationService.php

database/migrations/
├── 2026_03_25_000001_create_portal_users_table.php
├── 2026_03_25_000002_create_portal_otp_table.php
└── 2026_03_25_000003_create_portal_result_access_log_table.php

resources/views/portal/
├── layouts/portal.blade.php
├── auth/login.blade.php
├── auth/register.blade.php
├── auth/verify-otp.blade.php
├── auth/forgot-password.blade.php
├── dashboard/index.blade.php
├── visits/index.blade.php
├── visits/show.blade.php
├── results/index.blade.php
├── results/show.blade.php
├── vitals/index.blade.php
├── vitals/show.blade.php
├── payments/index.blade.php
├── payments/show.blade.php
├── payments/receipt.blade.php
├── profile/show.blade.php
└── notifications/index.blade.php

routes/
└── portal.php
```

---

## 16. Key Design Decisions

| Decision | Rationale |
|---|---|
| Separate `portal_users` table | Avoids collisions with staff `users` table; different auth requirements |
| Separate auth guard (`portal`) | Staff and patients never share session scope |
| Laravel Sanctum for API tokens | Already installed in the project |
| OTP via existing Notification DB | No new infrastructure; reuses SMS queue already in place |
| S3 pre-signed URLs for PDFs | Never expose bucket directly; 15-min expiry for security |
| Polling for queue status (not WebSocket) | Simpler, no additional infrastructure (Pusher/Redis) needed |
| Match patient to Eros by Name+DOB+Mobile | No username in Eros; this is the most reliable identifier |
| Blade + Vue for queue tracker | Consistent with existing CMS frontend stack |
| No appointment booking in v1 | Current CMS has no appointment scheduler; out of scope |

---

## 17. Out of Scope (Future Phases)

- Online appointment booking (requires scheduler module)
- Teleconsultation / video calls
- Online payment (e-wallet, online banking)
- Doctor messaging / inbox
- Prescription download
- Push notifications (requires FCM/APNs setup)
- Mobile native apps (iOS/Android)
- PHR (Personal Health Record) full history import

---

*Architecture designed for CMS v1 — BAESA. Compatible with Laravel 8/9, MySQL, Oracle (Eros/HCLab), AWS S3.*
