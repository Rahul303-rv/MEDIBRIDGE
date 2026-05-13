# MediBridge — Claude Chat Summary

Last updated: 2026-05-09. All 12 phases complete. Project is demo-ready.

---

## All Phases Built

| Phase | Feature | Status |
|---|---|---|
| 0 | Skeleton & environment | Done |
| 1 | Auth (JWT cookies, email verify, password reset) | Done |
| 2 | Patient profile | Done |
| 3 | Doctor onboarding (invite → signup → admin verify) | Done |
| 4 | Doctor availability + public directory | Done |
| 5 | Symptom intake + admin matching | Done |
| 6 | Appointment booking + dummy payment | Done |
| 7 | Prescriptions (PDF, nested medicines/tests, 24h edit) | Done |
| 8 | Follow-up consultations | Done |
| 9 | Hospitals + surgery packages (public directory) | Done |
| 10 | Surgery booking wizard (travel docs, voucher PDF + QR code) | Done |
| 11 | Admin custom panel (KPI dashboard, audit log) | Done |
| 12 | Polish & pre-handover (404/error pages, SEO, README, DEPLOY.md) | Done |

**Test suite: 154/154 passing. TypeScript: 0 errors.**

---

## Architecture

```
backend/   Django 6 + DRF + MySQL 8 + PyMySQL
frontend/  Next.js 16 App Router + TypeScript + Tailwind + shadcn/ui
```

- **Auth:** JWT in httpOnly cookies (`access_token` + `refresh_token`), `JWTCookieAuthentication`
- **Permissions:** `IsPatient`, `IsDoctor`, `IsVerifiedDoctor`, `IsAdmin`
- **Email (dev):** Console backend — auto-verified on signup when `DEBUG=True`
- **Email (prod):** SMTP via `EMAIL_BACKEND` env var
- **Payments:** Dummy endpoint `/api/v1/dev/dummy-pay` (returns 403 in prod)
- **Video:** External Jitsi Meet links (`https://meet.jit.si/medibridge-{token}`)
- **PDFs:** xhtml2pdf — table-based HTML only, inline styles, no flexbox/grid
- **QR codes:** `qrcode` lib → PNG bytes → base64 data URI embedded in PDF `<img>`
- **File storage:** Local `backend/media/` — replace with S3 for production
- **Travel docs:** Served via authenticated view only (not at MEDIA_URL)

---

## How to Run

### Terminal 1 — Backend
```bash
cd "c:\Local Disk-D\MediBridge\backend"
.venv\Scripts\activate
python manage.py runserver
```
- Backend: http://localhost:8000
- Swagger UI: http://localhost:8000/api/v1/schema/swagger/
- Django admin: http://localhost:8000/admin/

### Terminal 2 — Frontend
```bash
cd "c:\Local Disk-D\MediBridge\frontend"
npm run dev
```
- Frontend: http://localhost:3000

### Seed dummy data (run once after setup)
```bash
cd "c:\Local Disk-D\MediBridge\backend"
.venv\Scripts\activate
python manage.py seed_data
```

---

## Demo Login Credentials

**Password for ALL accounts: `Test@1234`**

| Email | Role | Details |
|---|---|---|
| admin@test.local | Admin | Full admin access |
| patient@test.local | Patient | Sarah Johnson — Toronto, Canada |
| patient2@test.local | Patient | John Doe — New York, USA |
| dr.sharma@test.local | Doctor | Rajesh Sharma — Cardiology, 18 yrs, $80 |
| dr.patel@test.local | Doctor | Priya Patel — Orthopedics, 13 yrs, $70 |
| dr.mehta@test.local | Doctor | Amit Mehta — Neurology, 11 yrs, $75 |
| dr.roy@test.local | Doctor | Sunita Roy — Oncology, 15 yrs, $90 |

---

## Backend App Structure

```
backend/apps/
├── accounts/       User model, JWT auth, email verify, password reset
├── core/           Permissions, AuditLog, admin dashboard, health, user management
├── notifications/  Email log + send helpers (send_email, send_email_with_attachment)
├── patients/       PatientProfile CRUD + post_save signal (auto-creates profile on user creation)
├── doctors/        DoctorProfile, education, availability slots, public directory, invites
├── consultations/  SymptomIntake, Appointment, Prescription, follow-ups
├── hospitals/      Hospital, SurgeryPackage (public directory + admin CRUD)
└── surgery/        SurgeryPackageBooking, TravelDocument, PatientTravelInfo, SurgeryCoupon
```

## Frontend App Structure

```
frontend/app/
├── (public)/       Landing, doctor directory, packages directory (no auth required)
├── auth/           Login, signup, email verify, password reset
├── patient/        Dashboard, appointments, prescriptions, surgery bookings
├── doctor/         Dashboard, appointments, prescriptions, availability
└── admin/          KPI dashboard, doctors, users, intakes, hospitals, packages, bookings, audit log
```

---

## Key API Endpoints

### Auth (`/api/v1/auth/`)
- `POST signup/patient` — creates patient user (auto-verified in DEBUG)
- `POST signup/doctor` — creates doctor user via invite token
- `POST login` — sets JWT cookies
- `POST logout` — clears JWT cookies
- `POST refresh` — rotates refresh token
- `GET me` — returns current user
- `POST verify-email/{token}` — marks email verified
- `POST forgot-password` / `POST reset-password/{token}`

### Patient (`/api/v1/patient/`)
- Profile CRUD, symptom intakes, appointments, prescriptions, surgery bookings, travel docs

### Doctor (`/api/v1/doctor/`)
- Profile CRUD, education, availability slots, appointments, prescriptions

### Admin (`/api/v1/admin/`)
- Dashboard KPIs, combined bookings, audit log
- Doctor verify/reject
- Symptom intake matching
- Hospital + package CRUD
- **User management: list, detail, update, set-password** ← added this session

### Public (`/api/v1/public/`)
- Doctor directory (verified + available only)
- Hospital + package directory (active only)

---

## This Session — Changes Made

### RunProject.md
- Created at project root
- Full step-by-step guide: backend setup → frontend setup → env files → URLs
- Quick summary table of 5 commands

### Dummy Data Seeder
- File: `backend/apps/core/management/commands/seed_data.py`
- Creates all 7 demo accounts, 5 specializations, 3 hospitals, 6 surgery packages
- All accounts use `Test@1234`
- Idempotent — safe to re-run; always resets seed account passwords
- `--flush` flag to wipe and re-create everything
- `_fix_null_users()` patches any NULLs in role/is_email_verified columns

### Email Auto-Verification in Dev
- File: `backend/apps/accounts/views.py`
- `signup_patient` and `signup_doctor` now check `settings.DEBUG`
- `DEBUG=True` → email auto-verified, user can log in immediately
- `DEBUG=False` → sends real verification email (unchanged)

### Admin Auth Guard
- File: `frontend/app/admin/layout.tsx` (**new**)
- Uses `useAuth()` — checks `user.role === "admin"`
- Redirects to `/auth/login?next=<path>` if not admin
- Fixes 403 errors on all admin pages caused by non-admin users landing there

### Admin User Management — New Feature

**Backend — `backend/apps/core/views.py` + `urls.py`:**
| Endpoint | Purpose |
|---|---|
| `GET /api/v1/admin/users` | List all users; filter `?role=` `?search=` |
| `GET /api/v1/admin/users/{id}` | Full user + profile detail |
| `PATCH /api/v1/admin/users/{id}` | Update account + profile fields |
| `POST /api/v1/admin/users/{id}/set-password` | Reset password |

**Frontend:**
- `frontend/app/admin/users/page.tsx` — table of all users, role tabs, email search, Edit links
- `frontend/app/admin/users/[id]/page.tsx` — edit email, role, verified/active flags, full profile fields, password reset card
- Added **Users** to the admin dashboard nav pills and quick-links grid

---

## Known Issues Fixed This Session

| Issue | Fix Applied |
|---|---|
| Admin dashboard shows 403 / "Failed to load dashboard" | Added `admin/layout.tsx` auth guard — non-admins redirected to login |
| Intake doctor matching fails | Same root cause — auth guard fix resolves it |
| Seed account passwords were wrong / couldn't login | `seed_data` now always resets passwords on every run |
| New signup stuck on email verification | Auto-verified in `DEBUG=True` mode |
| Admin had no way to view/edit users | New `/admin/users` and `/admin/users/{id}` pages |
| Some users had NULL role or is_email_verified | `_fix_null_users()` in seed_data patches NULLs automatically |

---

## Production Checklist (see DEPLOY.md for full details)

- [ ] Replace dummy payment with Stripe / Razorpay
- [ ] Set `EMAIL_BACKEND` to SMTP (Mailgun / SendGrid / SES)
- [ ] Move media files to S3 (`django-storages` + `boto3`)
- [ ] Use managed MySQL (PlanetScale / RDS) with SSL + backups
- [ ] Rotate `DJANGO_SECRET_KEY`
- [ ] Set `DEBUG=False`, `JWT_COOKIE_SECURE=True`, `JWT_COOKIE_SAMESITE=Strict`
- [ ] Run `python manage.py check --deploy` — fix all warnings
- [ ] Serve via Gunicorn behind Nginx / Caddy with HTTPS
- [ ] Lock `CORS_ALLOWED_ORIGINS` to production domain

---

## Files Reference

| File | Purpose |
|---|---|
| `RunProject.md` | Step-by-step local run guide |
| `README.md` | Full project docs (setup, env vars, test commands, troubleshooting) |
| `DEPLOY.md` | Production deployment gaps and pre-launch checklist |
| `ClaudeChatSummary.md` | This file — full session history |
| `backend/apps/core/management/commands/seed_data.py` | Dummy data seeder |
