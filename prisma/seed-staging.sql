-- ============================================================
-- NWDI Patient Portal — Staging Seed Script
-- Run this in pgAdmin4 Query Tool against the portal database
--
-- Passwords:
--   Patients  →  Nwdi2024!
--   HR        →  HRAdmin2024!
--
-- Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING
-- ============================================================

-- ── 1. ENUM types (create if not already present) ─────────────────────────────
DO $$ BEGIN
  CREATE TYPE "user_role"  AS ENUM ('PATIENT', 'HR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "otp_type"    AS ENUM ('EMAIL', 'SMS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "otp_purpose" AS ENUM ('EMAIL_VERIFY', 'MOBILE_VERIFY', 'PASSWORD_RESET');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "access_type" AS ENUM ('lab_pdf');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. portal_users table (create if not already present) ─────────────────────
CREATE TABLE IF NOT EXISTS portal_users (
  id                  VARCHAR(30)  PRIMARY KEY,
  patient_code        VARCHAR(50)  UNIQUE,
  hr_code             VARCHAR(50)  UNIQUE,
  pin                 VARCHAR(3),
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100) NOT NULL,
  email               VARCHAR(255) NOT NULL UNIQUE,
  mobile              VARCHAR(20)  NOT NULL UNIQUE,
  password            TEXT         NOT NULL,
  dob                 DATE         NOT NULL,
  role                "user_role"  NOT NULL DEFAULT 'PATIENT',
  is_verified         BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  email_verified_at   TIMESTAMPTZ,
  mobile_verified_at  TIMESTAMPTZ,
  last_login_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

-- ── 3. Insert test accounts ────────────────────────────────────────────────────
--
-- Patient 1 — Medrana Peñamante  (Patient Code: I202303300083  DOB: 2000-01-28)
INSERT INTO portal_users (
  id, patient_code, first_name, last_name,
  email, mobile, password, dob,
  role, is_verified, email_verified_at, created_at, updated_at
)
VALUES (
  gen_random_uuid()::text,
  'I202303300083',
  'Medrana', 'Peñamante',
  'medrana.penamante@nwdi.local',
  '09000000001',
  '$2b$12$nrNdshfnrO9I7WOosCZpv.VxKavUhcMexY32wKGNbArEnw6SVvc6e',
  '2000-01-28',
  'PATIENT', TRUE, NOW(), NOW(), NOW()
)
ON CONFLICT (patient_code) DO NOTHING;

-- Patient 2 — Jessie James Buatawan  (Patient Code: L220000266178  DOB: 1992-07-21)
INSERT INTO portal_users (
  id, patient_code, first_name, last_name,
  email, mobile, password, dob,
  role, is_verified, email_verified_at, created_at, updated_at
)
VALUES (
  gen_random_uuid()::text,
  'L220000266178',
  'Jessie James', 'Buatawan',
  'butawan.jay@gmail.com',
  '09291348309',
  '$2b$12$nrNdshfnrO9I7WOosCZpv.VxKavUhcMexY32wKGNbArEnw6SVvc6e',
  '1992-07-21',
  'PATIENT', TRUE, NOW(), NOW(), NOW()
)
ON CONFLICT (patient_code) DO NOTHING;

-- Patient 3 — Eleto Aderiz  (Patient Code: L220000080101  DOB: 1988-05-01)
INSERT INTO portal_users (
  id, patient_code, first_name, last_name,
  email, mobile, password, dob,
  role, is_verified, email_verified_at, created_at, updated_at
)
VALUES (
  gen_random_uuid()::text,
  'L220000080101',
  'Eleto', 'Aderiz',
  'eleto.aderiz@nwdi.local',
  '09000000003',
  '$2b$12$nrNdshfnrO9I7WOosCZpv.VxKavUhcMexY32wKGNbArEnw6SVvc6e',
  '1988-05-01',
  'PATIENT', TRUE, NOW(), NOW(), NOW()
)
ON CONFLICT (patient_code) DO NOTHING;

-- HR — Anna Reyes  (Email: anna.reyes@nwdi.com.ph  DOB: 1988-03-10)
INSERT INTO portal_users (
  id, hr_code, first_name, last_name,
  email, mobile, password, dob,
  role, is_verified, email_verified_at, last_login_at, created_at, updated_at
)
VALUES (
  gen_random_uuid()::text,
  'HR-2024-00001',
  'Anna', 'Reyes',
  'anna.reyes@nwdi.com.ph',
  '09171112222',
  '$2b$12$yFwXHY/RUIWhlTa4b8J0de4hMznZvCVrKAIrNHfdqC3PEp3HMedn.',
  '1988-03-10',
  'HR', TRUE, NOW(), NOW(), NOW(), NOW()
)
ON CONFLICT (hr_code) DO NOTHING;

-- HR — Leonel HR  (Email: leonelHR@hotmail.com  Password: password123)
INSERT INTO portal_users (
  id, hr_code, first_name, last_name,
  email, mobile, password, dob,
  role, is_verified, email_verified_at, created_at, updated_at
)
VALUES (
  gen_random_uuid()::text,
  'HR-2024-00002',
  'Leonel', 'HR',
  'leonelhr@hotmail.com',
  '09000000002',
  '$2b$10$QX7pbWc1QzZGQ.qPrQRNH.G.RCbpyx9ix/pVFpv7oGil/kXWg.As6',
  '1990-01-01',
  'HR', TRUE, NOW(), NOW(), NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ── 4. Verify ─────────────────────────────────────────────────────────────────
SELECT id, patient_code, hr_code, first_name, last_name, email, role, is_verified
FROM portal_users
WHERE patient_code IN ('I202303300083','L220000266178','L220000080101')
   OR hr_code IN ('HR-2024-00001','HR-2024-00002')
ORDER BY role, last_name;
