# MediBridge — Project Plan

## 1. Project Overview

MediBridge is an online doctor-consultation and medical-tourism platform that connects patients in countries with overburdened healthcare systems (primarily Canada, USA, UK) to qualified Indian doctors and partner hospitals.

The platform addresses two pain points:

1. **Long wait times for consultations abroad** — a Canadian patient with a fracture, persistent fever, or any non-emergency illness often waits days to weeks for a GP appointment. MediBridge offers same-day or next-day online consultations with Indian doctors who have availability.
2. **High cost of elective surgery abroad** — for procedures like knee replacement, cardiac surgery, or fertility treatment, MediBridge bundles surgery + flight + visa assistance + accommodation + ground transport into a single package, often at a fraction of the home-country cost.

MediBridge is **not** an emergency service. It is positioned as an alternative pathway for non-critical and elective care.

## 2. Architecture at a Glance

MediBridge is built as a decoupled web application:

- A **Django + Django REST Framework** backend exposes a JSON API and the admin UI, talks to MySQL, sends email, and renders PDFs.
- A **Next.js (App Router) + TypeScript + Tailwind** frontend is the entire user-facing surface for patients, doctors, and the custom admin panel. It calls the backend API.
- Authentication uses **JWT in httpOnly cookies** so server components in Next.js and the browser can both make authenticated calls.
- Everything is a single Git monorepo with `backend/` and `frontend/` folders.

This split is deliberate so that Phase 2 can add a mobile app or third-party integrations against the same API with no backend rewrite.

## 3. Target Personas

### 3.1 International Patient (primary)
- Lives in Canada, USA, UK, EU, or similar
- Has a non-emergency medical issue and cannot get a timely appointment locally
- Comfortable with online forms, video calls, digital payments
- Speaks English
- Either looking for a quick consultation or considering travel for surgery

### 3.2 Indian Doctor
- MBBS / MD / specialist with valid medical council registration
- Wants to take international consultations as a side or primary income stream
- Available for online consultations during defined slots
- Can issue digital prescriptions and recommend tests

### 3.3 Platform Admin
- MediBridge employee
- Reviews patient symptom intakes
- Matches patients to appropriate doctors based on symptoms and specialization
- Verifies doctor credentials before they go live
- Manages hospitals and surgery packages
- Has access to all bookings, payments, and audit logs

### 3.4 (Future) Hospital Coordinator
- Out of scope for MVP. Hospitals are managed by the platform admin in Phase 1.

## 4. Phased Scope

### Phase 1 — MVP (this build)
- Patient registration with detailed profile
- Symptom intake form
- Admin manual review and doctor suggestion
- Doctor profiles, availability slots
- Appointment booking with **dummy payment** (no real gateway)
- Email notifications to patient and doctor
- Doctor side: view appointments, write digital prescription (medicines table, tests, follow-up)
- Surgery packages browsing
- Surgery package booking with travel-document collection and dummy payment
- Auto-generated dummy voucher PDF after surgery payment

### Phase 2 (post-MVP, architecture should not block)
- Real payment integration (Stripe for international, Razorpay for INR settlement)
- Embedded video consultation (WebRTC via Daily.co, Twilio, or Jitsi)
- AI-assisted symptom triage to reduce admin load
- Multi-language support
- Mobile app (React Native against the same API, or PWA)

### Phase 3
- Hospital coordinator portal
- Insurance integration
- Pharmacy delivery for international patients (via partners)
- Lab partner integration for at-home test sample collection in patient's country

## 5. User Roles & Permissions

| Role         | Can do                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Patient      | Register, complete profile, submit symptom intake, view suggested doctors, book appointment, pay (dummy), join consultation, view prescriptions, browse and book surgery packages, upload travel docs |
| Doctor       | Complete profile, set availability, accept/decline assigned consultations, conduct consultations, write prescriptions, recommend tests, schedule follow-ups |
| Admin        | All of the above + verify doctors, review symptom intakes, suggest doctors to patients, manage hospitals and surgery packages, view all bookings and payments, view audit logs |
| Anonymous    | View public landing page, doctor list (read-only), surgery package list (read-only), register, log in                    |

## 6. End-to-End User Flows

### 6.1 Patient Consultation Flow

```
Anonymous user
    |
    v
Lands on home page -> reads value prop -> clicks "Get Consultation"
    |
    v
Sign up (email + password) -> email verification
    |
    v
Complete profile: name, DOB, gender, height, weight, blood group,
                  country, address, phone, emergency contact,
                  allergies, existing conditions, current medications
    |
    v
Dashboard -> "New Consultation"
    |
    v
Symptom Intake Form:
    - Chief complaint (text)
    - Symptoms (multi-select + free text)
    - Duration (days/weeks)
    - Severity (1-10 slider)
    - What has been tried so far?
    - Any recent test reports? (file upload, optional)
    |
    v
Submit -> status "Awaiting doctor match" -> confirmation email
    |
    v
[ADMIN reviews and assigns 1-3 doctors -- see flow 6.3]
    |
    v
Patient gets email "Your suggested doctors are ready"
    |
    v
Patient logs in -> sees suggested doctor profiles
    (each profile: photo, name, qualifications, specialization,
     years of experience, languages, available slots, fee)
    |
    v
Patient picks doctor -> picks slot -> "Confirm & Pay"
    |
    v
Dummy payment popup (card form, marks payment success)
    |
    v
Appointment created -> confirmation emails to patient + doctor
    |
    v
At appointment time -> patient joins via meeting link in dashboard
    |
    v
Doctor conducts consultation -> writes prescription:
    - Diagnosis
    - Medicines table (name, dosage, M/A/E/N flags, before/after meal, duration)
    - Tests recommended
    - Follow-up needed? (yes/no, after how many days)
    - Notes
    |
    v
Patient receives prescription PDF + email
    |
    v
If follow-up: doctor proposes date, patient accepts -> new appointment
              (same flow as above; fee may be waived per doctor's choice)
```

### 6.2 Doctor Workflow

```
Admin invites doctor (manual) -> doctor receives email with sign-up link
    |
    v
Doctor signs up (token-gated) -> completes profile:
    - Personal: name, photo, phone, languages, bio
    - Professional: medical council reg number, specializations,
                    education (multiple), years of experience,
                    consultation fee, hospital affiliation
    - Availability: weekly recurring slots and/or specific dates
    |
    v
Profile in "pending verification" state
    |
    v
Admin verifies credentials -> doctor goes live
    |
    v
Doctor dashboard:
    - Today's appointments
    - Upcoming appointments
    - Past appointments (with prescriptions written)
    - Earnings summary (dummy data based on dummy payments)
    - Edit availability
    - Edit profile
    |
    v
At appointment time -> doctor joins meeting link -> conducts consultation
    |
    v
Doctor opens "Write Prescription" -> fills form -> submits
    |
    v
Optional: doctor schedules follow-up
```

### 6.3 Admin Workflow (Doctor Matching)

```
Admin dashboard -> "Pending Symptom Intakes" queue
    |
    v
Admin opens an intake -> reads symptoms, severity, history
    |
    v
Admin filters doctor list by specialization -> selects 1-3 doctors
    |
    v
Admin can add a private note (why these doctors)
    |
    v
Admin clicks "Suggest" -> patient gets email + suggestions appear in dashboard
```

### 6.4 Surgery Package Flow

```
Patient (logged in or anonymous) -> "Surgery Packages" page
    |
    v
Browse packages by surgery type (knee, cardiac, dental, fertility, etc.)
    |
    v
Click a package -> package detail page:
    - Hospital name, location, accreditations
    - Procedure description
    - Total duration (e.g., 14 days)
    - Inclusions: surgery, hospital stay, recovery stay,
                  flight (economy / business),
                  visa assistance, ground transport, meals
    - Exclusions
    - Total price (USD)
    - 2-3 alternative packages from other hospitals shown side-by-side
    |
    v
Patient clicks "Book Package" -> if not logged in, prompted to register
    |
    v
Tentative date selection -> "Continue"
    |
    v
Travel & document form:
    - Passport number, country, expiry, scan upload
    - Visa status, visa scan upload (if applicable)
    - Government ID upload
    - Current occupation, employer, annual income (for visa support letter)
    - Companion details (if any)
    - Dietary requirements, special needs
    |
    v
Review summary -> "Pay Now"
    |
    v
Dummy payment popup
    |
    v
On success:
    - Booking marked confirmed
    - PDF voucher generated with booking ID, QR code (dummy),
      flight summary, hospital voucher
    - Email sent to patient with PDF attached
    - Admin notified
```

## 7. Frontend Routes (Next.js)

These are user-facing pages. Each calls one or more API endpoints from the backend.

### Public (no auth)
- `/` — Landing page (hero, value prop, how it works, doctor previews, package previews, CTAs)
- `/about`
- `/doctors` — Public doctor directory
- `/doctors/[slug]` — Public doctor profile
- `/packages` — Public surgery package list
- `/packages/[slug]` — Public surgery package detail
- `/contact`
- `/auth/signup`
- `/auth/signup/doctor/[invite_token]`
- `/auth/login`
- `/auth/verify-email/[token]`
- `/auth/forgot-password`
- `/auth/reset-password/[token]`

### Patient (auth required, role=patient)
- `/patient` — Dashboard
- `/patient/profile`
- `/patient/consultations` — list of intakes
- `/patient/consultations/new` — symptom intake form
- `/patient/consultations/[id]` — intake status + suggested doctors
- `/patient/consultations/[id]/book/[doctorId]` — slot picker + payment
- `/patient/appointments`
- `/patient/appointments/[id]` — meeting link, prescription if available
- `/patient/prescriptions`
- `/patient/prescriptions/[id]`
- `/patient/surgery-bookings`
- `/patient/surgery-bookings/new/[packageId]` — booking flow (travel + payment)
- `/patient/surgery-bookings/[id]` — booking detail + voucher

### Doctor (auth required, role=doctor)
- `/doctor` — Dashboard
- `/doctor/profile`
- `/doctor/availability`
- `/doctor/appointments`
- `/doctor/appointments/[id]`
- `/doctor/appointments/[id]/prescription/new`
- `/doctor/appointments/[id]/prescription/[pid]`

### Admin (auth required, role=admin) — custom Next.js panel, separate from Django admin
- `/admin` — KPI dashboard
- `/admin/intakes` — pending symptom intakes queue
- `/admin/intakes/[id]`
- `/admin/doctors`
- `/admin/doctors/[id]`
- `/admin/doctors/invite`
- `/admin/hospitals`
- `/admin/packages`
- `/admin/bookings`
- `/admin/payments`
- `/admin/audit-log`

> Django's built-in `/admin/` (on the backend domain) is also available for raw data editing, but the Next.js admin panel above is for day-to-day operations.

## 8. Database Entities (High-Level)

```
User (custom, with role)
 |- PatientProfile (1:1)
 |    |- SymptomIntake (1:N)
 |         |- DoctorSuggestion (N:M with Doctor)
 |
 |- DoctorProfile (1:1)
 |    |- DoctorEducation (1:N)
 |    |- DoctorSpecialization (M:N via link)
 |    |- DoctorAvailabilitySlot (1:N)
 |
 |- (admin user has no extra profile)

Specialization (lookup) -- e.g., Cardiology, Orthopedics

Appointment
 |- patient (FK PatientProfile)
 |- doctor (FK DoctorProfile)
 |- symptom_intake (FK, nullable -- null for follow-ups)
 |- parent_appointment (FK self, nullable -- for follow-ups)
 |- payment (1:1 Payment)
 |- prescription (1:1 Prescription, nullable)

Prescription
 |- PrescriptionMedicine (1:N)
 |- PrescribedTest (1:N)

Hospital
 |- SurgeryPackage (1:N)

SurgeryPackageBooking
 |- patient (FK PatientProfile)
 |- package (FK SurgeryPackage)
 |- travel_info (1:1 PatientTravelInfo)
 |- travel_documents (1:N TravelDocument)
 |- payment (1:1 Payment)
 |- coupon (1:1 SurgeryCoupon, after payment)

Payment (dummy) -- generic, attached to Appointment OR SurgeryPackageBooking

EmailNotification (log of all emails sent)
AuditLog (admin actions)
```

Full field-level schema is in `technical.md`.

## 9. Non-Goals for MVP (explicit)

To keep scope tight, the MVP will **not** include:

- Real payment gateway (Stripe/Razorpay) — all payments are dummy and just mark the booking as paid
- Embedded video calling — a meeting link (e.g., Google Meet, Zoom) is stored as a plain field that the doctor pastes when accepting the consultation
- AI-powered symptom triage — admin matches doctors manually
- Insurance handling
- Pharmacy delivery
- SMS notifications — email only
- Multi-language UI — English only
- Mobile app — responsive web only
- Lab integration

These constraints are deliberate to ship a usable demo within the initial-phase timeline.

## 10. Success Criteria for MVP

- A patient can sign up, submit symptoms, get matched, book an appointment, "pay" (dummy), receive emails, and download a prescription PDF — end to end with no admin intervention beyond the matching step.
- A doctor can be invited, sign up, set availability, conduct a consultation, write a prescription with a structured medicines table.
- An admin can review intakes and suggest doctors in under 2 minutes per intake.
- A patient can browse surgery packages, book one, upload required documents, "pay", and receive a voucher PDF.
- All flows pass on a fresh local install with documented setup commands (see `technical.md`).

## 11. Repository Layout (Monorepo)

```
medibridge/
|-- README.md
|-- plan.md                 <- this file
|-- technical.md            <- detailed spec
|-- .gitignore
|-- docker-compose.yml      <- (optional, Phase 1.5) MySQL + maildev for local dev
|
|-- backend/                <- Django + DRF API
|   |-- manage.py
|   |-- requirements.txt
|   |-- .env.example
|   |-- medibridge/         <- project package (settings)
|   |-- apps/
|   |   |-- accounts/
|   |   |-- patients/
|   |   |-- doctors/
|   |   |-- consultations/
|   |   |-- payments/
|   |   |-- hospitals/
|   |   |-- surgery/
|   |   |-- notifications/
|   |   |-- core/
|   |-- templates/          <- only for emails + PDFs
|   |   |-- emails/
|   |   |-- pdf/
|   |-- media/              <- user uploads (gitignored)
|   `-- tests/
|
`-- frontend/               <- Next.js App Router
    |-- package.json
    |-- next.config.mjs
    |-- tsconfig.json
    |-- tailwind.config.ts
    |-- .env.local.example
    |-- app/                <- App Router pages and layouts
    |-- components/
    |-- lib/                <- api client, auth helpers, utils
    |-- hooks/
    |-- types/              <- shared TypeScript types
    `-- public/
```

App-level details, models, API endpoints, frontend structure, and dev setup are in `technical.md`.
