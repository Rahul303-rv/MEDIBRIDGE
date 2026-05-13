# MediBridge — Technical Specification

This document is the working technical reference for building MediBridge. It complements `plan.md` (which covers product scope and flows) and goes deep on stack, schema, API contract, frontend structure, and conventions. Feed this file plus `plan.md` into the Claude VS Code extension when starting a development session.

---

## 1. Tech Stack

### Backend (`backend/`)
- **Python 3.11+**
- **Django 5.0+**
- **Django REST Framework 3.15+**
- **MySQL 8.0+**, driver: **`PyMySQL`** (pure-Python; no Visual C++ Build Tools needed on Windows). Used as a drop-in for `mysqlclient` via a one-line shim in `backend/medibridge/__init__.py`:
  ```python
  import pymysql
  pymysql.install_as_MySQLdb()
  ```
  Django then talks to MySQL through PyMySQL with no further config changes.
- **djangorestframework-simplejwt** — JWT auth, customized to use httpOnly cookies
- **django-cors-headers** — CORS for the Next.js origin
- **Pillow** — image handling
- **xhtml2pdf** (which uses **ReportLab** under the hood) — PDF generation for prescriptions and surgery vouchers. Chosen over WeasyPrint specifically for Windows: pure pip install, no GTK/Pango/Cairo system dependencies. Trade-off: xhtml2pdf supports a useful subset of CSS, not the full spec — templates should stick to tables, plain text, and simple block layouts (no flexbox/grid). For a prescription and a voucher, that's plenty.
- **qrcode** — dummy QR codes on vouchers
- **python-decouple** — `.env` config loading
- **drf-spectacular** — OpenAPI schema and Swagger UI for the API

### Frontend (`frontend/`)
- **Next.js 14+** with the **App Router**
- **TypeScript** (strict mode)
- **Tailwind CSS 3.x**
- **shadcn/ui** — component primitives (Radix + Tailwind)
- **TanStack Query (React Query) v5** — server state, cache, retries
- **React Hook Form + Zod** — form state and validation
- **axios** — HTTP client (with credentials and interceptors)
- **date-fns** + **date-fns-tz** — date and timezone formatting
- **next-themes** — light/dark theming (light only for MVP, but wire it up)
- **lucide-react** — icons
- **sonner** — toast notifications
- **react-dropzone** — file uploads (passport, intake attachments)

### Optional / deferred
- **Celery + Redis** — async email; defer until volume justifies it (Phase 1 sends email synchronously)
- **Sentry** — error tracking (Phase 2)
- **Stripe / Razorpay** — real payments (Phase 2)
- **WebRTC stack (Daily.co / Twilio / Jitsi)** — embedded video (Phase 2)

### Deliberately not chosen (and why)
- PostgreSQL — client requested MySQL.
- Server-rendered Django templates for the user UI — Next.js gives a much better UX for international patients and aligns with the team's Next.js experience.
- NextAuth.js — DRF SimpleJWT with httpOnly cookies keeps auth state on the backend, which is the correct boundary for a medical app.

---

## 2. Repository Structure (Monorepo)

```
medibridge/
|-- README.md
|-- plan.md
|-- technical.md
|-- .gitignore
|-- docker-compose.yml          (optional, dev-only: MySQL + maildev)
|
|-- backend/
|   |-- manage.py
|   |-- requirements.txt
|   |-- requirements-dev.txt
|   |-- pyproject.toml          (black, ruff, isort config)
|   |-- .env.example
|   |-- medibridge/             (project package, NOT an app)
|   |   |-- __init__.py
|   |   |-- settings/
|   |   |   |-- __init__.py
|   |   |   |-- base.py
|   |   |   |-- dev.py
|   |   |   |-- prod.py         (stub, Phase 2)
|   |   |-- urls.py
|   |   |-- wsgi.py
|   |   |-- asgi.py
|   |-- apps/
|   |   |-- accounts/           (custom User, auth views)
|   |   |-- patients/           (PatientProfile, patient endpoints)
|   |   |-- doctors/            (DoctorProfile, education, slots, public + private endpoints)
|   |   |-- consultations/      (SymptomIntake, DoctorSuggestion, Appointment, Prescription)
|   |   |-- payments/           (dummy Payment)
|   |   |-- hospitals/          (Hospital, SurgeryPackage, public endpoints)
|   |   |-- surgery/            (SurgeryPackageBooking, TravelDocument, PatientTravelInfo, SurgeryCoupon)
|   |   |-- notifications/      (EmailNotification log + send helper)
|   |   |-- core/               (shared mixins, permissions, AuditLog, public endpoints)
|   |-- templates/
|   |   |-- emails/
|   |   `-- pdf/
|   |-- media/                  (gitignored)
|   `-- tests/
|
`-- frontend/
    |-- package.json
    |-- next.config.mjs
    |-- tsconfig.json
    |-- tailwind.config.ts
    |-- postcss.config.mjs
    |-- components.json         (shadcn/ui config)
    |-- .env.local.example
    |-- app/
    |   |-- layout.tsx
    |   |-- page.tsx            (landing)
    |   |-- (public)/
    |   |   |-- about/page.tsx
    |   |   |-- doctors/
    |   |   |-- packages/
    |   |   `-- contact/page.tsx
    |   |-- auth/
    |   |   |-- login/page.tsx
    |   |   |-- signup/page.tsx
    |   |   |-- signup/doctor/[token]/page.tsx
    |   |   |-- verify-email/[token]/page.tsx
    |   |   |-- forgot-password/page.tsx
    |   |   `-- reset-password/[token]/page.tsx
    |   |-- patient/
    |   |-- doctor/
    |   `-- admin/
    |-- components/
    |   |-- ui/                 (shadcn primitives: button, dialog, form, etc.)
    |   |-- layout/             (header, sidebar, footer)
    |   |-- doctor/             (DoctorCard, SlotPicker, etc.)
    |   |-- patient/
    |   |-- surgery/            (PackageCard, TravelDocUpload)
    |   |-- consultation/       (SymptomIntakeForm, MedicineRow, PrescriptionPreview)
    |   `-- payment/            (DummyPaymentDialog)
    |-- lib/
    |   |-- api.ts              (axios instance, interceptors)
    |   |-- auth.ts             (server-side cookie helpers)
    |   |-- queries/            (TanStack Query keys + fetchers per resource)
    |   |-- mutations/
    |   |-- schemas/            (Zod schemas mirroring API)
    |   `-- utils.ts
    |-- hooks/
    |   |-- use-auth.ts
    |   |-- use-toast.ts
    |   `-- ...
    |-- types/
    |   `-- api.ts              (TypeScript interfaces for all API responses)
    |-- middleware.ts           (route protection by role)
    `-- public/
```

---

## 3. Backend: Django Apps

Each app follows: `models.py`, `serializers.py`, `views.py`, `urls.py`, `permissions.py`, `services.py` (non-trivial business logic), `selectors.py` (read-only query helpers), `admin.py`, `apps.py`, `migrations/`. Tests live in `tests/` mirroring the app structure.

| App           | Responsibility                                                                              |
| ------------- | ------------------------------------------------------------------------------------------- |
| accounts      | Custom `User` model, signup, login, JWT cookie issuing, email verification, password reset  |
| patients      | `PatientProfile`, patient profile endpoints                                                 |
| doctors       | `DoctorProfile`, `Specialization`, education, slots, doctor invites, public directory       |
| consultations | `SymptomIntake`, `DoctorSuggestion`, `Appointment`, `Prescription`, `PrescriptionMedicine`, `PrescribedTest` |
| payments      | Dummy `Payment` model and endpoint                                                          |
| hospitals     | `Hospital`, `SurgeryPackage`, public package endpoints                                      |
| surgery       | `SurgeryPackageBooking`, `PatientTravelInfo`, `TravelDocument`, `SurgeryCoupon`             |
| notifications | `EmailNotification` log, `send_email` service, email templates                              |
| core          | `AuditLog`, base permission classes, custom JWT cookie auth, admin-panel endpoints, contact |

---

## 4. Database Schema

All tables use Django's default integer PKs unless noted. Timestamps are stored as UTC `DateTimeField(auto_now_add=True)` / `auto_now=True`. Soft-delete is **not** used in MVP — `is_active` flags handle deactivation. All tables that filter by status or by user have explicit `Meta.indexes`.

### 4.1 `accounts`

#### `User` (extends `AbstractBaseUser`, `PermissionsMixin`)
| Field             | Type                       | Notes                                  |
| ----------------- | -------------------------- | -------------------------------------- |
| email             | EmailField, unique         | `USERNAME_FIELD = "email"`             |
| role              | CharField(20), choices     | `patient`, `doctor`, `admin`           |
| is_active         | BooleanField, default True |                                        |
| is_staff          | BooleanField, default False| `True` for admin role                  |
| is_email_verified | BooleanField, default False|                                        |
| date_joined       | DateTimeField, auto_now_add|                                        |
| last_login        | DateTimeField, null        |                                        |

`username` is dropped (`REQUIRED_FIELDS = []`).

#### `EmailVerificationToken`
| Field      | Type                | Notes                          |
| ---------- | ------------------- | ------------------------------ |
| user       | FK User             |                                |
| token      | CharField(64)       | uuid4 hex, indexed             |
| expires_at | DateTimeField       | 24 hours from creation         |
| used_at    | DateTimeField, null |                                |

#### `PasswordResetToken`
Same shape as `EmailVerificationToken` (token, user, expiry, used_at).

### 4.2 `patients`

#### `PatientProfile`
| Field                   | Type                                 |
| ----------------------- | ------------------------------------ |
| user                    | OneToOne User                        |
| first_name, last_name   | CharField(100)                       |
| date_of_birth           | DateField                            |
| gender                  | CharField(10) — male/female/other    |
| height_cm               | PositiveSmallIntegerField, null      |
| weight_kg               | DecimalField(5,2), null              |
| blood_group             | CharField(5), null                   |
| phone                   | CharField(20)                        |
| alt_phone               | CharField(20), blank                 |
| country                 | CharField(80)                        |
| state                   | CharField(80)                        |
| city                    | CharField(80)                        |
| address_line            | CharField(255)                       |
| postal_code             | CharField(20)                        |
| timezone                | CharField(64) — IANA, e.g. America/Toronto |
| emergency_contact_name  | CharField(150), blank                |
| emergency_contact_phone | CharField(20), blank                 |
| existing_conditions     | TextField, blank                     |
| allergies               | TextField, blank                     |
| current_medications     | TextField, blank                     |
| profile_image           | ImageField, null                     |
| created_at, updated_at  | timestamps                           |

### 4.3 `doctors`

#### `Specialization`
| Field | Type                   |
| ----- | ---------------------- |
| name  | CharField(100), unique |
| slug  | SlugField, unique      |

Seeded via fixture: Cardiology, Dermatology, Endocrinology, ENT, Family Medicine, Gastroenterology, General Surgery, Gynecology, Internal Medicine, Nephrology, Neurology, Oncology, Ophthalmology, Orthopedics, Pediatrics, Psychiatry, Pulmonology, Urology.

#### `DoctorProfile`
| Field                     | Type                                |
| ------------------------- | ----------------------------------- |
| user                      | OneToOne User                       |
| first_name, last_name     | CharField(100)                      |
| slug                      | SlugField, unique                   |
| phone                     | CharField(20)                       |
| profile_image             | ImageField                          |
| signature_image           | ImageField, null                    |
| bio                       | TextField                           |
| medical_council_reg_no    | CharField(100), unique              |
| years_of_experience       | PositiveSmallIntegerField           |
| consultation_fee_usd      | DecimalField(8,2)                   |
| consultation_duration_min | PositiveSmallIntegerField, default 30 |
| languages                 | CharField(255) — comma-separated    |
| hospital_affiliation      | CharField(255), blank               |
| timezone                  | CharField(64), default Asia/Kolkata |
| specializations           | M2M Specialization                  |
| is_verified               | BooleanField, default False         |
| is_available              | BooleanField, default True          |
| created_at, updated_at    | timestamps                          |

#### `DoctorEducation`
| Field          | Type                                       |
| -------------- | ------------------------------------------ |
| doctor         | FK DoctorProfile, related_name="education" |
| degree         | CharField(100)                             |
| institution    | CharField(255)                             |
| year_completed | PositiveSmallIntegerField                  |

#### `DoctorAvailabilitySlot`
| Field         | Type                                                    |
| ------------- | ------------------------------------------------------- |
| doctor        | FK DoctorProfile, related_name="slots"                  |
| slot_type     | CharField — `recurring_weekly` or `specific_date`       |
| day_of_week   | PositiveSmallIntegerField, null — 0=Mon..6=Sun          |
| specific_date | DateField, null                                         |
| start_time    | TimeField (in doctor's timezone)                        |
| end_time      | TimeField                                               |
| is_active     | BooleanField, default True                              |

Indexes: `(doctor, day_of_week, is_active)`, `(doctor, specific_date, is_active)`.

#### `DoctorInvite`
| Field       | Type                  |
| ----------- | --------------------- |
| email       | EmailField            |
| token       | CharField(64), unique |
| invited_by  | FK User (admin)       |
| created_at  | timestamp             |
| accepted_at | DateTimeField, null   |
| expires_at  | DateTimeField         |

### 4.4 `consultations`

#### `SymptomIntake`
| Field                  | Type                                            |
| ---------------------- | ----------------------------------------------- |
| patient                | FK PatientProfile, related_name="intakes"       |
| chief_complaint        | CharField(255)                                  |
| symptoms               | TextField — free text or comma-separated tags   |
| duration               | CharField(80) — "3 days", "2 weeks"             |
| severity               | PositiveSmallIntegerField — 1..10               |
| medication_tried       | TextField, blank                                |
| additional_notes       | TextField, blank                                |
| attachment             | FileField, null                                 |
| status                 | CharField — `pending_review`, `doctors_suggested`, `booked`, `completed`, `cancelled` |
| created_at, updated_at | timestamps                                      |

Index: `(status, created_at)`.

#### `DoctorSuggestion`
| Field         | Type                                              |
| ------------- | ------------------------------------------------- |
| intake        | FK SymptomIntake, related_name="suggestions"      |
| doctor        | FK DoctorProfile                                  |
| admin_note    | TextField, blank — visible to patient             |
| internal_note | TextField, blank — admin-only                     |
| suggested_by  | FK User (admin)                                   |
| suggested_at  | DateTimeField, auto_now_add                       |

Unique together: `(intake, doctor)`.

#### `Appointment`
| Field                  | Type                                          |
| ---------------------- | --------------------------------------------- |
| patient                | FK PatientProfile                             |
| doctor                 | FK DoctorProfile                              |
| intake                 | FK SymptomIntake, null                        |
| parent_appointment     | FK self, null                                 |
| scheduled_start        | DateTimeField (UTC)                           |
| scheduled_end          | DateTimeField (UTC)                           |
| meeting_link           | URLField, blank                               |
| status                 | CharField — `scheduled`, `in_progress`, `completed`, `cancelled`, `no_show` |
| amount_usd             | DecimalField(8,2)                             |
| payment                | OneToOne Payment, null                        |
| created_at, updated_at | timestamps                                    |

Indexes: `(doctor, scheduled_start)`, `(patient, scheduled_start)`, `(status, scheduled_start)`.

#### `Prescription`
| Field                  | Type                            |
| ---------------------- | ------------------------------- |
| appointment            | OneToOne Appointment            |
| diagnosis              | TextField                       |
| general_notes          | TextField, blank                |
| follow_up_required     | BooleanField, default False     |
| follow_up_after_days   | PositiveSmallIntegerField, null |
| pdf_file               | FileField, null                 |
| created_at, updated_at | timestamps                      |

#### `PrescriptionMedicine`
| Field         | Type                                                         |
| ------------- | ------------------------------------------------------------ |
| prescription  | FK Prescription, related_name="medicines"                    |
| medicine_name | CharField(150)                                               |
| dosage        | CharField(50) — "500mg", "10ml"                              |
| morning       | BooleanField, default False                                  |
| afternoon     | BooleanField, default False                                  |
| evening       | BooleanField, default False                                  |
| night         | BooleanField, default False                                  |
| meal_timing   | CharField — `before_meal`, `after_meal`, `with_meal`, `any`  |
| duration_days | PositiveSmallIntegerField                                    |
| instructions  | TextField, blank                                             |

Boolean flags render cleanly in the prescription table:
```
| Medicine | Dosage | M | A | E | N | Timing | Days |
```

#### `PrescribedTest`
| Field        | Type                                       |
| ------------ | ------------------------------------------ |
| prescription | FK Prescription, related_name="tests"      |
| test_name    | CharField(150)                             |
| urgency      | CharField — `routine`, `urgent`            |
| instructions | TextField, blank                           |

### 4.5 `payments`

#### `Payment` (dummy)
| Field                | Type                                                |
| -------------------- | --------------------------------------------------- |
| user                 | FK User                                             |
| amount               | DecimalField(10,2)                                  |
| currency             | CharField(3), default "USD"                         |
| method               | CharField — `card`, `upi`, `wallet`                 |
| dummy_transaction_id | CharField(64) — generated via `secrets.token_hex`   |
| dummy_card_last4     | CharField(4), blank                                 |
| status               | CharField — `pending`, `success`, `failed`          |
| context_type         | CharField — `consultation`, `surgery_package`       |
| context_id           | PositiveIntegerField — id of Appointment or Booking |
| created_at           | timestamp                                           |

> The `(context_type, context_id)` pair lets one Payment table serve both contexts. Direct OneToOne back-refs from `Appointment.payment` and `SurgeryPackageBooking.payment` exist for query convenience.

### 4.6 `hospitals`

#### `Hospital`
| Field                  | Type                             |
| ---------------------- | -------------------------------- |
| name                   | CharField(200)                   |
| slug                   | SlugField, unique                |
| city, state, country   | CharField                        |
| description            | TextField                        |
| image                  | ImageField, null                 |
| accreditations         | CharField(255) — comma-separated |
| website                | URLField, blank                  |
| is_partner             | BooleanField, default True       |
| created_at, updated_at | timestamps                       |

#### `SurgeryPackage`
| Field                    | Type                                         |
| ------------------------ | -------------------------------------------- |
| hospital                 | FK Hospital, related_name="packages"         |
| name                     | CharField(200)                               |
| slug                     | SlugField, unique                            |
| surgery_type             | CharField(100) — knee_replacement, cardiac_bypass, etc. |
| description              | TextField                                    |
| total_duration_days      | PositiveSmallIntegerField                    |
| hospital_stay_days       | PositiveSmallIntegerField                    |
| recovery_stay_days       | PositiveSmallIntegerField                    |
| price_usd                | DecimalField(10,2)                           |
| includes_flight          | BooleanField                                 |
| flight_class             | CharField — `economy`, `business`            |
| includes_visa_assistance | BooleanField                                 |
| includes_accommodation   | BooleanField                                 |
| accommodation_type       | CharField — `hotel_3star`, `hotel_4star`, `serviced_apt` |
| includes_transport       | BooleanField                                 |
| includes_meals           | BooleanField                                 |
| inclusions_text          | TextField — bullet list, one per line        |
| exclusions_text          | TextField — bullet list, one per line        |
| image                    | ImageField, null                             |
| is_active                | BooleanField, default True                   |
| created_at, updated_at   | timestamps                                   |

### 4.7 `surgery`

#### `SurgeryPackageBooking`
| Field                  | Type                                                 |
| ---------------------- | ---------------------------------------------------- |
| patient                | FK PatientProfile                                    |
| package                | FK SurgeryPackage                                    |
| status                 | CharField — `info_pending`, `payment_pending`, `confirmed`, `completed`, `cancelled` |
| tentative_date         | DateField                                            |
| total_amount_usd       | DecimalField(10,2) — snapshot of package price       |
| payment                | OneToOne Payment, null                               |
| created_at, updated_at | timestamps                                           |

#### `PatientTravelInfo`
| Field                | Type                                                              |
| -------------------- | ----------------------------------------------------------------- |
| booking              | OneToOne SurgeryPackageBooking                                    |
| passport_number      | CharField(50)                                                     |
| passport_country     | CharField(80)                                                     |
| passport_expiry      | DateField                                                         |
| visa_required        | BooleanField                                                      |
| visa_status          | CharField — `not_applied`, `applied`, `granted`, `not_required`   |
| current_occupation   | CharField(150)                                                    |
| employer             | CharField(200), blank                                             |
| annual_income_usd    | DecimalField(12,2), null                                          |
| companion_count      | PositiveSmallIntegerField, default 0                              |
| companion_details    | TextField, blank — name, relation, passport per line              |
| dietary_requirements | TextField, blank                                                  |
| special_needs        | TextField, blank                                                  |

#### `TravelDocument`
| Field       | Type                                                |
| ----------- | --------------------------------------------------- |
| booking     | FK SurgeryPackageBooking, related_name="documents"  |
| doc_type    | CharField — `passport`, `visa`, `govt_id`, `other`  |
| file        | FileField                                           |
| doc_number  | CharField(80), blank                                |
| issue_date  | DateField, null                                     |
| expiry_date | DateField, null                                     |
| uploaded_at | timestamp                                           |
| is_verified | BooleanField, default False                         |
| verified_by | FK User, null                                       |

#### `SurgeryCoupon`
| Field       | Type                            |
| ----------- | ------------------------------- |
| booking     | OneToOne SurgeryPackageBooking  |
| code        | CharField(32), unique           |
| qr_image    | ImageField                      |
| voucher_pdf | FileField                       |
| issued_at   | timestamp                       |
| valid_from  | DateField                       |
| valid_until | DateField                       |

### 4.8 `notifications`

#### `EmailNotification`
| Field        | Type                                            |
| ------------ | ----------------------------------------------- |
| to_email     | EmailField                                      |
| subject      | CharField(255)                                  |
| body_html    | TextField                                       |
| body_text    | TextField                                       |
| status       | CharField — `pending`, `sent`, `failed`         |
| error        | TextField, blank                                |
| context_type | CharField — appointment, booking, intake, etc.  |
| context_id   | PositiveIntegerField, null                      |
| sent_at      | DateTimeField, null                             |
| created_at   | timestamp                                       |

### 4.9 `core`

#### `AuditLog`
| Field       | Type                                       |
| ----------- | ------------------------------------------ |
| actor       | FK User, null                              |
| action      | CharField — e.g., `intake.suggested_doctors`, `doctor.verified`, `booking.confirmed` |
| target_type | CharField                                  |
| target_id   | PositiveIntegerField, null                 |
| metadata    | JSONField, default dict                    |
| ip_address  | GenericIPAddressField, null                |
| created_at  | timestamp                                  |

---

## 5. API Design

### 5.1 Conventions

- All API endpoints are prefixed with `/api/v1/`.
- Request and response bodies are JSON; file uploads use `multipart/form-data`.
- Pagination: `?page=N&page_size=20` (max 100). Responses use the standard DRF format: `{"count": N, "next": url, "previous": url, "results": [...]}`.
- Filtering: query params use snake_case (e.g., `?specialization=cardiology&status=pending_review`).
- Ordering: `?ordering=-created_at`.
- Errors follow this shape:
  ```json
  {
    "error": {
      "code": "validation_error",
      "message": "Human-readable summary",
      "details": { "field_name": ["specific error"] }
    }
  }
  ```
- Standard HTTP status codes. `400` validation, `401` not authenticated, `403` not allowed, `404` not found, `409` conflict (e.g., slot already booked), `422` business-rule violation.
- Auth: JWT in httpOnly cookies (see section 6). Auth-required endpoints return `401` when missing/expired.
- Timestamps always returned in ISO 8601 UTC; the client renders in `patient.timezone`.
- Money fields return as strings (`"49.00"`) to preserve decimal precision. The frontend parses to number for math, but never round-trips floats.
- IDs are integers. Slugs are used for public lookups (`/api/v1/public/doctors/{slug}`).

### 5.2 Auth endpoints

| Method | Path                                | Body / Notes                                                                  |
| ------ | ----------------------------------- | ----------------------------------------------------------------------------- |
| POST   | `/api/v1/auth/signup/patient`       | `{email, password, profile: {first_name, last_name, date_of_birth, ...}}` — creates User + PatientProfile, sends verification email. Returns `201` with user summary; does **not** auto-login. |
| POST   | `/api/v1/auth/signup/doctor`        | `{invite_token, email, password, profile: {...}}` — invite-gated. Doctor `is_verified=False` until admin verifies. |
| POST   | `/api/v1/auth/login`                | `{email, password}` — sets `access_token` and `refresh_token` cookies. Returns `{user: {...}, profile: {...}}`. |
| POST   | `/api/v1/auth/logout`               | Clears cookies, blacklists refresh token.                                      |
| POST   | `/api/v1/auth/refresh`              | Reads refresh token from cookie, rotates and re-sets both cookies.            |
| GET    | `/api/v1/auth/me`                   | Returns current user + profile based on JWT cookie. `401` if not authed.      |
| POST   | `/api/v1/auth/verify-email`         | `{token}` — marks `is_email_verified=True`.                                   |
| POST   | `/api/v1/auth/resend-verification`  | `{email}` — issues a new token if email is registered.                        |
| POST   | `/api/v1/auth/forgot-password`      | `{email}` — sends reset email.                                                |
| POST   | `/api/v1/auth/reset-password`       | `{token, new_password}`                                                       |

### 5.3 Public endpoints (no auth)

| Method | Path                                          | Notes                                              |
| ------ | --------------------------------------------- | -------------------------------------------------- |
| GET    | `/api/v1/public/specializations`              | List, no pagination.                               |
| GET    | `/api/v1/public/doctors`                      | Filter: `?specialization=`, `?language=`. Paginated. Only verified, available doctors. |
| GET    | `/api/v1/public/doctors/{slug}`               | Detail. Includes upcoming public availability summary, NOT exact slots. |
| GET    | `/api/v1/public/hospitals`                    | Paginated.                                         |
| GET    | `/api/v1/public/packages`                     | Filter: `?surgery_type=`, `?hospital=`. Paginated. |
| GET    | `/api/v1/public/packages/{slug}`              | Detail. Also returns 2-3 related packages of the same `surgery_type`. |
| POST   | `/api/v1/public/contact`                      | `{name, email, message}` — emails admin.           |

### 5.4 Patient endpoints (`role=patient`)

| Method     | Path                                                     | Notes                                                         |
| ---------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| GET / PATCH| `/api/v1/patient/profile`                                | Read/update profile.                                          |
| POST       | `/api/v1/patient/intakes`                                | Create symptom intake. Multipart for `attachment`.            |
| GET        | `/api/v1/patient/intakes`                                | List patient's intakes.                                       |
| GET        | `/api/v1/patient/intakes/{id}`                           | Detail.                                                       |
| GET        | `/api/v1/patient/intakes/{id}/suggestions`               | List suggested doctors with admin notes.                      |
| GET        | `/api/v1/patient/doctors/{id}/available-slots`           | Returns next 14 days of bookable slots (computes from `DoctorAvailabilitySlot` minus booked appointments). |
| POST       | `/api/v1/patient/appointments`                           | `{intake_id, doctor_id, slot_start, slot_end, payment_id}` — books appointment after dummy payment is recorded. |
| GET        | `/api/v1/patient/appointments`                           | List, filter `?status=`.                                      |
| GET        | `/api/v1/patient/appointments/{id}`                      | Detail (includes meeting link if doctor has set it, prescription if written). |
| GET        | `/api/v1/patient/prescriptions`                          | List.                                                         |
| GET        | `/api/v1/patient/prescriptions/{id}`                     | Detail.                                                       |
| GET        | `/api/v1/patient/prescriptions/{id}/pdf`                 | Streams PDF. Auth-checked.                                    |
| GET        | `/api/v1/patient/surgery-bookings`                       | List.                                                         |
| POST       | `/api/v1/patient/surgery-bookings`                       | `{package_id, tentative_date}` — creates booking in `info_pending`. |
| GET        | `/api/v1/patient/surgery-bookings/{id}`                  | Detail (includes voucher if confirmed).                       |
| PUT        | `/api/v1/patient/surgery-bookings/{id}/travel-info`      | Save `PatientTravelInfo`. Moves booking to `payment_pending`. |
| POST       | `/api/v1/patient/surgery-bookings/{id}/documents`        | Upload travel document (multipart).                           |
| DELETE     | `/api/v1/patient/surgery-bookings/{id}/documents/{did}`  | Remove unverified document.                                   |
| POST       | `/api/v1/patient/surgery-bookings/{id}/confirm`          | `{payment_id}` — finalizes; backend generates voucher PDF + emails. |
| GET        | `/api/v1/patient/surgery-bookings/{id}/voucher`          | Streams voucher PDF.                                          |

### 5.5 Doctor endpoints (`role=doctor`)

| Method     | Path                                                          | Notes                                                |
| ---------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| GET / PATCH| `/api/v1/doctor/profile`                                      |                                                      |
| GET / POST | `/api/v1/doctor/education`                                    | List, create.                                        |
| PATCH/DELETE| `/api/v1/doctor/education/{id}`                              |                                                      |
| GET / POST | `/api/v1/doctor/slots`                                        | List, create.                                        |
| PATCH/DELETE| `/api/v1/doctor/slots/{id}`                                  |                                                      |
| GET        | `/api/v1/doctor/appointments`                                 | Filter `?status=`, `?date=`.                         |
| GET        | `/api/v1/doctor/appointments/{id}`                            |                                                      |
| PATCH      | `/api/v1/doctor/appointments/{id}`                            | Update `meeting_link`, `status`.                     |
| POST       | `/api/v1/doctor/appointments/{id}/prescription`               | Create prescription with nested medicines + tests in one request. |
| PATCH      | `/api/v1/doctor/prescriptions/{id}`                           | Edit (until appointment is `completed` + 24h).       |
| POST       | `/api/v1/doctor/appointments/{id}/follow-up`                  | `{after_days, slot_start, slot_end, fee_waived}` — creates a second appointment in `scheduled` status; patient confirms via separate endpoint. |

### 5.6 Admin endpoints (`role=admin`)

| Method     | Path                                                | Notes                                                       |
| ---------- | --------------------------------------------------- | ----------------------------------------------------------- |
| GET        | `/api/v1/admin/dashboard`                           | KPI counters: pending intakes, appointments today, new bookings, etc. |
| GET        | `/api/v1/admin/intakes`                             | Filter `?status=`. Default = pending_review.                |
| GET        | `/api/v1/admin/intakes/{id}`                        | Detail with patient profile snapshot.                       |
| POST       | `/api/v1/admin/intakes/{id}/suggestions`            | `{doctor_ids: [..], admin_note, internal_note}` — replaces existing suggestions, sends email. |
| GET        | `/api/v1/admin/doctors`                             | Filter `?is_verified=`.                                     |
| POST       | `/api/v1/admin/doctors/{id}/verify`                 | Marks `is_verified=True`.                                   |
| POST       | `/api/v1/admin/doctors/invite`                      | `{email}` — creates `DoctorInvite`, emails token link.      |
| GET / POST / PATCH / DELETE | `/api/v1/admin/hospitals[/{id}]`     | CRUD.                                                       |
| GET / POST / PATCH / DELETE | `/api/v1/admin/packages[/{id}]`      | CRUD.                                                       |
| GET        | `/api/v1/admin/bookings`                            | All consultation + surgery bookings.                        |
| GET        | `/api/v1/admin/payments`                            | All payments.                                               |
| GET        | `/api/v1/admin/audit-log`                           | Paginated.                                                  |

### 5.7 Payments (dummy)

| Method | Path                          | Body / Notes                                                                                       |
| ------ | ----------------------------- | -------------------------------------------------------------------------------------------------- |
| POST   | `/api/v1/payments/dummy`      | `{amount, currency, method, card_number, expiry, cvv, context_type, context_id}` — backend ignores card details except `last4`, generates `dummy_transaction_id`, marks `status="success"`, returns `{payment_id, status, transaction_id}`. |

The frontend then references the returned `payment_id` when calling `/api/v1/patient/appointments` (POST) or `/api/v1/patient/surgery-bookings/{id}/confirm`.

### 5.8 OpenAPI / Swagger

`drf-spectacular` is configured to expose:
- `/api/v1/schema/` — OpenAPI JSON
- `/api/v1/schema/swagger/` — Swagger UI (dev only)

This is also the source for generating TypeScript types in the frontend (see section 11).

---

## 6. Authentication: JWT in httpOnly Cookies

### Why this approach
- httpOnly cookies are not accessible to JS, so XSS cannot steal tokens.
- Same-origin cookie policy + `SameSite=Lax` blocks most CSRF; sensitive POSTs additionally require the `X-Requested-With` header (set by axios) which a CSRF attacker cannot forge cross-origin.
- Server components in Next.js can read cookies and forward them to the API for SSR-authed pages.

### Cookies issued on login / refresh
| Name            | Lifetime | Path             | Flags                                |
| --------------- | -------- | ---------------- | ------------------------------------ |
| `access_token`  | 15 min   | `/`              | HttpOnly, Secure (prod), SameSite=Lax|
| `refresh_token` | 7 days   | `/api/v1/auth/`  | HttpOnly, Secure (prod), SameSite=Lax|

### Backend mechanics
- Use `djangorestframework-simplejwt` as the underlying JWT library.
- Wrap `TokenObtainPairView` with a custom view that:
  1. Validates credentials.
  2. Issues access + refresh tokens.
  3. Sets them as cookies on the response with `Set-Cookie`.
  4. Returns `{user, profile}` in the body — never the raw tokens.
- Custom DRF authentication class (`core.authentication.JWTCookieAuthentication`):
  ```
  def authenticate(self, request):
      raw = request.COOKIES.get(settings.SIMPLE_JWT["AUTH_COOKIE"])
      if not raw:
          return None
      validated = JWTAuthentication().get_validated_token(raw)
      return JWTAuthentication().get_user(validated), validated
  ```
- `/api/v1/auth/refresh` reads the refresh cookie, calls `RefreshToken(...)`, issues new pair, rotates (blacklists old refresh — requires `simplejwt.token_blacklist` app installed and migrated).
- Logout clears both cookies and blacklists the refresh token.

### Frontend mechanics
- `lib/api.ts` creates an axios instance with `withCredentials: true`.
- Response interceptor: on `401`, if not already retrying, hit `/api/v1/auth/refresh`. If it succeeds, replay the original request. If it fails, clear local user state and redirect to `/auth/login`.
- Server-side fetches in RSC use `cookies()` from `next/headers` and forward the `Cookie` header to Django:
  ```
  const cookieStore = cookies();
  fetch(`${API}/api/v1/auth/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  });
  ```

### Role-based access
- `core.permissions` provides `IsPatient`, `IsDoctor`, `IsAdmin`, `IsVerifiedDoctor`. Every viewset declares `permission_classes`.
- On the frontend, `middleware.ts` runs on every request to `/patient/*`, `/doctor/*`, `/admin/*`, calls `/api/v1/auth/me`, and redirects to `/auth/login` (or `/` with toast) if role mismatches.

---

## 7. CORS, CSRF, and Security

- `django-cors-headers`:
  - `CORS_ALLOWED_ORIGINS = [SITE_FRONTEND_URL]` (from env).
  - `CORS_ALLOW_CREDENTIALS = True`.
- CSRF: Django's CSRF middleware is bypassed for the API since auth is via httpOnly cookie + SameSite=Lax + custom header check. (Django admin still uses CSRF normally.)
- Rate limiting: DRF throttle classes on auth endpoints (`5/min` for login, `3/min` for password reset).
- Password rules: min 10 chars, validators for common-passwords and numeric-only.
- Sensitive uploads (passport, govt ID): served only via authenticated views in `surgery.views.serve_travel_document` that re-checks ownership; never exposed at `MEDIA_URL` directly.
- Public uploads (doctor photos, hospital images, package images): served from `MEDIA_URL` directly.
- File-size limit: 10 MB per upload, enforced in serializer `validate_<field>`.
- File-type validation: MIME and extension whitelist per field (e.g., passports: jpg/png/pdf only).
- Django settings: `SECURE_BROWSER_XSS_FILTER`, `X_FRAME_OPTIONS = "DENY"`, `SECURE_CONTENT_TYPE_NOSNIFF`, `CSRF_COOKIE_HTTPONLY = True`, `SESSION_COOKIE_HTTPONLY = True`, `SESSION_COOKIE_SAMESITE = "Lax"`. In prod also `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS`, `CSRF_COOKIE_SECURE`, `SESSION_COOKIE_SECURE`.
- Dummy payment endpoint logs a warning at startup if `DEBUG=False`, refusing to run in production.

---

## 8. File Upload Strategy

- All uploads use `multipart/form-data`.
- Frontend uses `react-dropzone` for the UX layer; submission goes through axios with `Content-Type: multipart/form-data` and `withCredentials: true`.
- Uploads land in `MEDIA_ROOT` under topic-specific folders:
  ```
  media/
    doctor_photos/
    doctor_signatures/
    patient_photos/
    intake_attachments/
    travel_docs/{booking_id}/
    coupons/
    prescriptions/
  ```
- `intake_attachments/` and `travel_docs/` are gated behind authenticated download views.
- Phase 2 should migrate to S3 with signed URLs.

---

## 9. PDF Generation

- `xhtml2pdf` renders Django HTML templates in `backend/templates/pdf/` to PDF (uses ReportLab internally). A thin helper `core.services.pdf.render_pdf(template_name: str, context: dict) -> bytes` is the single entry point.
- **Template constraints** because xhtml2pdf is not a full browser engine:
  - Use plain CSS: `font`, `color`, `padding`, `margin`, `border`, `text-align`, `width` in % or px.
  - Use HTML tables for layout (header, medicines table, footer) — flexbox/grid will not render.
  - Embed images as `<img src="...">` with absolute file paths or data URIs. The QR code on the voucher is generated by `qrcode` and embedded as a data URI.
  - Inline styles are most reliable; a single `<style>` block in the template also works.
- `prescription.html` includes:
  - Header: MediBridge logo, doctor name, council reg no, signature image
  - Patient summary (name, age, gender, weight, allergies)
  - Diagnosis
  - Medicines table with M / A / E / N columns, meal timing, duration
  - Tests recommended
  - Follow-up note
  - Footer: disclaimer, contact info
- `surgery_voucher.html` includes:
  - Booking ID, QR (generated via `qrcode` lib, embedded as data URI)
  - Package summary, hospital details, dates, validity
  - Patient name, passport number (last 4 only on voucher)
  - Terms and contact info
- Generation is synchronous on first request, then cached by storing the file path on the model.

---

## 10. Email Service

- `notifications.services.send_email(...)` is the single entry point. It:
  1. Renders HTML and text templates from `backend/templates/emails/`.
  2. Creates an `EmailNotification` row with `status="pending"`.
  3. Sends via Django's `EmailMultiAlternatives`.
  4. Updates the row to `sent` or `failed` with the error message.
- Local dev: `EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"` by default; switch to SMTP via env for testing with MailHog or Mailtrap.
- Trigger points:
  - User signup -> verification email
  - Symptom intake submitted -> confirmation to patient + alert to admin
  - Admin suggests doctors -> notification to patient
  - Appointment booked -> confirmations to patient and doctor (separate templates)
  - Doctor sets meeting link -> notification to patient
  - Prescription written -> notification to patient with PDF link
  - Follow-up proposed -> notification to patient
  - Surgery booking confirmed -> voucher email with PDF attachment
  - Doctor invite -> invite email with token link

---

## 11. Frontend: Next.js App

### 11.1 App Router structure

```
app/
|-- layout.tsx                   <- root layout: providers (TanStack Query, Theme, Toaster)
|-- page.tsx                     <- landing
|-- (public)/                    <- route group for public pages with public layout
|   |-- layout.tsx               <- public header + footer
|   |-- about/page.tsx
|   |-- contact/page.tsx
|   |-- doctors/
|   |   |-- page.tsx             <- directory list (RSC, paginated)
|   |   `-- [slug]/page.tsx      <- doctor detail (RSC)
|   `-- packages/
|       |-- page.tsx
|       `-- [slug]/page.tsx
|-- auth/
|   |-- layout.tsx               <- minimal centered layout
|   |-- login/page.tsx
|   |-- signup/page.tsx
|   |-- signup/doctor/[token]/page.tsx
|   |-- verify-email/[token]/page.tsx
|   |-- forgot-password/page.tsx
|   `-- reset-password/[token]/page.tsx
|-- patient/
|   |-- layout.tsx               <- patient sidebar + header (server-checks role)
|   |-- page.tsx                 <- dashboard
|   |-- profile/page.tsx
|   |-- consultations/
|   |   |-- page.tsx
|   |   |-- new/page.tsx
|   |   `-- [id]/
|   |       |-- page.tsx
|   |       `-- book/[doctorId]/page.tsx
|   |-- appointments/
|   |   |-- page.tsx
|   |   `-- [id]/page.tsx
|   |-- prescriptions/
|   |   |-- page.tsx
|   |   `-- [id]/page.tsx
|   `-- surgery-bookings/
|       |-- page.tsx
|       |-- new/[packageId]/page.tsx
|       `-- [id]/page.tsx
|-- doctor/
|   |-- layout.tsx
|   |-- page.tsx
|   |-- profile/page.tsx
|   |-- availability/page.tsx
|   `-- appointments/
|       |-- page.tsx
|       `-- [id]/
|           |-- page.tsx
|           `-- prescription/
|               |-- new/page.tsx
|               `-- [pid]/page.tsx
`-- admin/
    |-- layout.tsx
    |-- page.tsx
    |-- intakes/
    |-- doctors/
    |-- hospitals/
    |-- packages/
    |-- bookings/
    |-- payments/
    `-- audit-log/
```

### 11.2 Server vs Client components

- **Server components by default.** Use them for any page that fetches data once on load and renders it (e.g., directory listings, profile reads, dashboard summaries). They forward cookies to the API.
- **Client components (`"use client"`) only when needed.** Required for: form pages (React Hook Form is client), interactive pickers (slot picker, file upload), modals, anything using TanStack Query for client-side cache.
- Mixed pages: server component fetches initial data and passes it to a client child as `initialData` for TanStack Query to hydrate.

### 11.3 Data fetching

- **Server components**: native `fetch` with `cache: "no-store"` for user-specific data, default cache for public data.
- **Client components**: TanStack Query.
  - Query keys live in `lib/queries/keys.ts` to avoid drift.
  - Each resource has a query function file: `lib/queries/intakes.ts`, `lib/queries/appointments.ts`, etc.
  - Mutations: `lib/mutations/*.ts`. On success, invalidate the relevant query keys.

### 11.4 Forms

- React Hook Form + Zod resolver.
- Zod schemas live in `lib/schemas/` and mirror API request bodies. Frontend validation is a fast feedback layer; the backend always re-validates.
- shadcn/ui `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` primitives wrap RHF for consistent error display.

### 11.5 UI primitives (shadcn/ui)

Install via CLI as needed:
- `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`
- `dialog`, `sheet`, `popover`, `tooltip`
- `table`, `badge`, `avatar`, `separator`, `skeleton`
- `form`, `label`
- `toast` (via sonner) for notifications
- `tabs`, `accordion`
- `dropdown-menu`, `command` (for autocomplete)
- `calendar`, `date-picker`

### 11.6 TypeScript types

- `types/api.ts` is the source of truth for all API response shapes. Either:
  - Hand-maintain in lockstep with the backend (simpler for MVP), or
  - Generate from `drf-spectacular`'s OpenAPI schema using `openapi-typescript` (preferred — add `npm run gen:types` script that fetches the schema and regenerates `types/api.ts`).
- Form input types are derived from Zod schemas via `z.infer<typeof Schema>`.

### 11.7 Middleware

`frontend/middleware.ts` runs on `/patient/*`, `/doctor/*`, `/admin/*`:
1. If no `access_token` cookie -> redirect to `/auth/login?next=<path>`.
2. Otherwise let the request through. The page's server component will call `/api/v1/auth/me`; if that returns a role mismatch, the layout component renders a 403 panel.

This avoids middleware needing to call the API on every request, which is slow and costs egress in serverless deployments.

### 11.8 Visual style

The brief is "polished and trustworthy, not flashy." shadcn/ui's defaults already land here; three small choices nail it without needing a designer:

- **Font.** Use **Inter** via `next/font/google` in the root layout, applied to `<body>`. It's the de-facto sans-serif for professional SaaS (Vercel, Linear, Stripe, Cal.com). One line of code, zero design work.
- **Color palette.** In `tailwind.config.ts`, define one neutral scale (Tailwind `slate` or `zinc`) plus one accent. Recommended accent for a medical platform: a calm teal or muted blue — Tailwind `teal-600` (`#0d9488`) or `sky-700` (`#0369a1`). Avoid saturated reds, bright greens, and gradients; they undercut trust on a medical site. Wire the accent into shadcn/ui's `--primary` CSS variable in `app/globals.css` and every shadcn component picks it up automatically.
- **Whitespace and density.** Default to larger paddings (`p-6`, `p-8`) and line-heights (`leading-relaxed`) than feel necessary. Cramped layouts read as cheap. Practo, Cal.com, and Stripe's docs are good references for the right density.
- **No animation libraries.** Tailwind's built-in `transition` utilities and shadcn's default components are enough. Anything beyond a fade-in or hover state works against the calm-and-trustworthy brief.

That's the entire visual-polish playbook for the MVP.

---

## 12. Settings & Environment

### 12.1 Backend `.env.example`

```
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=medibridge
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306

EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=
EMAIL_PORT=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=no-reply@medibridge.local

SITE_BACKEND_URL=http://localhost:8000
SITE_FRONTEND_URL=http://localhost:3000
PLATFORM_NAME=MediBridge
ADMIN_NOTIFICATION_EMAIL=admin@medibridge.local

JWT_ACCESS_LIFETIME_MINUTES=15
JWT_REFRESH_LIFETIME_DAYS=7
JWT_COOKIE_SECURE=False
JWT_COOKIE_SAMESITE=Lax
```

### 12.2 Frontend `.env.local.example`

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PLATFORM_NAME=MediBridge
```

`NEXT_PUBLIC_API_URL` is read by the axios instance and by server components.

### 12.3 Settings layout

- `medibridge/settings/base.py` — shared, reads env via `python-decouple`.
- `medibridge/settings/dev.py` — `DEBUG=True`, console email, permissive CORS, Swagger UI on.
- `medibridge/settings/prod.py` — stub for Phase 2 (DEBUG off, hardened cookies, HSTS).

`DJANGO_SETTINGS_MODULE` defaults to `medibridge.settings.dev`.

---

## 13. Local Development Setup

### Prerequisites (Windows-first; macOS/Linux notes inline)

- **Git for Windows** — https://git-scm.com/download/win. Includes Git Bash, which the commands below assume. Alternatively use PowerShell with the activate command swap noted below.
- **Python 3.11+** from python.org. Tick "Add Python to PATH" during install. Verify with `python --version`.
- **Node.js 20+ LTS** from nodejs.org. Verify with `node --version` and `npm --version`.
- **MySQL 8.0+** via the official MySQL Installer for Windows: https://dev.mysql.com/downloads/installer/. Pick "Custom" and select Server + Workbench + Connector. Set a root password you'll remember. (Avoid Docker on Windows for MVP — WSL2 adds another layer of debugging.)
- **VS Code** with the Claude extension, the Python extension, and the ESLint extension installed.

> macOS: install via Homebrew (`brew install python@3.11 node mysql`) and use `brew services start mysql`. Linux: use your package manager. The rest of the setup is identical.

> No system-level libraries are needed — `PyMySQL` and `xhtml2pdf` are pure-pip installs, so nothing requires Visual C++ Build Tools, GTK, Pango, or Cairo.

### Backend setup

```bash
cd backend
python -m venv .venv
```

Activate the venv:
- **Git Bash on Windows:** `source .venv/Scripts/activate`
- **PowerShell on Windows:** `.venv\Scripts\Activate.ps1` (you may need `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once)
- **Command Prompt on Windows:** `.venv\Scripts\activate.bat`
- **macOS/Linux:** `source .venv/bin/activate`

Then:
```bash
pip install -r requirements.txt
cp .env.example .env
# edit .env: set DB_PASSWORD to your MySQL root password, set DJANGO_SECRET_KEY
```

**Confirm the PyMySQL shim is in place.** Open `backend/medibridge/__init__.py` and verify it contains:
```python
import pymysql
pymysql.install_as_MySQLdb()
```
This must run before Django's first import. Without it, Django will look for `mysqlclient` and fail.

**Create the database.** Pick whichever you prefer:

- *Option A (MySQL Workbench, easiest on Windows):* open Workbench, connect to your local instance with the root password you set, and run:
  ```sql
  CREATE DATABASE medibridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- *Option B (CLI, after MySQL bin folder is on PATH):*
  ```bash
  mysql -u root -p -e "CREATE DATABASE medibridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  ```
  On Windows the CLI lives at `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe` — add this folder to your PATH or use Workbench instead.

Migrate, seed, run:
```bash
python manage.py migrate
python manage.py loaddata apps/doctors/fixtures/specializations.json
python manage.py createsuperuser     # then set role='admin' on this user via Django admin or shell
python manage.py seed_demo_data      # custom command, see below
python manage.py runserver           # http://localhost:8000
```

### Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                          # http://localhost:3000
```

### Useful management commands to add

- `seed_demo_data` — creates 3 doctors, 5 patients, 4 hospitals, 8 packages, plus an open intake — for end-to-end demo.
- `send_test_email <to>` — sanity check email config.
- `gen_openapi_schema` — writes the OpenAPI JSON to `frontend/types/openapi.json` for type generation.

### Running both servers (daily workflow)

You need two terminals running side-by-side every day. The cleanest setup in VS Code:

1. Open the repo root in VS Code.
2. Open a terminal: `cd backend`, activate the venv, run `python manage.py runserver`.
3. Click the split-terminal button: `cd frontend`, run `npm run dev`.
4. Both stay running. Hot reload works on both — Django auto-reloads on `.py` saves, Next.js auto-reloads on `.ts`/`.tsx` saves.

Forgetting to start one is the single most common source of confusion ("API requests just hang" or "Network Error" toasts in the UI). If a request fails, glance at both terminals before debugging anything else.

**Optional:** add a `package.json` script at the repo root using `concurrently` so `npm run dev` from the root spins up both. Useful, but having both visible in separate terminals is more debuggable, so save this for later.

---

## 14. Coding Conventions

### Backend (Python)
- **Pylance/Pyright clean.** Type hints on every function signature.
- **Black** + **Ruff** + **isort**, configured in `pyproject.toml`.
- Models: explicit `Meta.ordering`, `__str__`, indexes for known query patterns.
- Views: prefer DRF `GenericAPIView` + mixins or `ViewSet`; use plain `APIView` only for one-off actions.
- Serializers: use `ModelSerializer` with explicit `fields = [...]`. Never `fields = "__all__"`. Never expose `is_verified`, `role`, or `status` on patient-writable serializers.
- Business logic that touches more than one model -> `services.py`, not in views or serializers.
- Read-only complex queries -> `selectors.py`.
- Migrations are checked in. Never edit a committed migration.

### Frontend (TypeScript)
- TypeScript strict mode.
- ESLint + Prettier. Tailwind class sorting via `prettier-plugin-tailwindcss`.
- File naming: `kebab-case.tsx` for files, `PascalCase` for component names.
- No `any`. Use `unknown` and narrow.
- Server components stay server components unless they truly need interactivity.
- Each form has a single Zod schema. RHF's `defaultValues` is fully typed.

### Across both
- No emojis in code (per team preference).
- No business logic in templates / JSX — decisions in services/hooks.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, etc.).

---

## 15. Testing Strategy

### Backend
- **pytest + pytest-django** + **factory-boy** for fixtures.
- Unit tests for serializers (validation rules) and services (business logic).
- API tests using DRF's `APIClient` covering: signup -> login -> create intake -> admin suggests -> book -> dummy pay -> get prescription, end-to-end.
- Aim for 70%+ coverage on services and serializers; views are tested via API tests.

### Frontend
- **Vitest** + **React Testing Library** for components and hooks.
- **Playwright** for one or two end-to-end flows (signup + book consultation, browse + book package).
- Mock the API at the axios layer using MSW for component tests.

---

## 16. Phased Implementation Order

Build vertically, one user story end-to-end at a time, before moving on. Suggested order:

1. **Project skeleton.** Backend Django project + custom User model + base settings + MySQL working. Frontend Next.js app + Tailwind + shadcn/ui set up. Both run with `runserver` and `npm run dev`. CORS verified with a `/api/v1/health` ping.
2. **Auth.** Patient signup, email verification, login (JWT cookies), logout, `me` endpoint. Frontend: login + signup forms, middleware, AuthProvider that exposes `useAuth()`.
3. **Patient profile.** Profile model, GET/PATCH endpoint, profile page on frontend.
4. **Doctor onboarding.** `DoctorInvite`, invite-gated signup, doctor profile, education, specializations. Admin verify endpoint.
5. **Doctor availability.** Slots CRUD, public doctor directory, public doctor detail.
6. **Symptom intake.** Patient form + endpoint + intake list/detail. Admin queue + suggestion endpoint.
7. **Booking & dummy payment.** Available-slots computation, dummy payment endpoint, appointment creation, emails to both parties.
8. **Prescription.** Doctor's appointment detail, write-prescription form (medicines + tests), patient's prescription list and PDF download.
9. **Follow-up.** Doctor proposes, patient confirms, second appointment created.
10. **Hospitals & packages.** Public list/detail, admin CRUD.
11. **Surgery booking flow.** Booking creation, travel-info form, document uploads, dummy payment, voucher PDF generation.
12. **Admin custom panel.** Dashboard, all listings, audit log.
13. **Polish.** Empty states, loading skeletons, error boundaries, mobile responsiveness pass, accessibility audit.

Each step must include backend tests for the new endpoint(s) and at least one frontend integration test.

---

## 17. Future Enhancements

- **Real payments.** Stripe Checkout or Payment Intents for international, Razorpay for INR settlement. Webhook endpoint replaces the current dummy-payment endpoint; the rest of the booking flow stays the same.
- **Embedded video.** Replace `meeting_link` with a generated room URL (Daily.co, Twilio Video, or Jitsi). Add WebRTC pre-call test page.
- **AI-assisted symptom triage.** Run intakes through an LLM with a structured schema (suspected specialization, urgency tier, suggested doctor traits). Admin still reviews but starts from a draft suggestion.
- **Mobile app.** React Native client against the same DRF API. JWT cookie strategy may switch to bearer tokens stored in secure storage on mobile.
- **Hospital coordinator portal.** New role + scoped permissions; coordinators manage their hospital's packages and see only their bookings.
- **Lab / pharmacy partner integrations.** New apps with their own resources and APIs.
- **Multi-language UI.** `next-intl` with translations sourced from a CMS or JSON files; backend already returns ICU-style messages where applicable.
- **Observability.** Sentry on both sides, request logging, slow-query log, basic metrics.

---

## 18. Open Questions

The following are intentionally not pinned down and should be discussed with the client before or during implementation:

1. **Doctor payouts.** MVP records dummy payments to doctors. What is the real settlement model — direct from patient to doctor with a platform fee, or escrow + payout cycle? Affects schema later.
2. **Cancellation and refund policy.** Patient-cancelled vs doctor-cancelled appointments; refund window for surgery bookings.
3. **Time-zone display.** Always show in patient's local timezone, or also show doctor's timezone in parentheses? Default for MVP: patient's local timezone only.
4. **Identity verification depth.** For surgery packages, is uploading scans sufficient, or is a video KYC required before issuing visa support letters?
5. **Email deliverability in production.** Which provider — SES, Postmark, Mailgun? Affects `EMAIL_BACKEND` config and sender domain setup.
6. **Data residency.** International patient data (passports, medical records) — are there contractual or regulatory requirements about where this data is stored?

These questions don't block MVP development but should be answered before the MVP goes to a real user.
