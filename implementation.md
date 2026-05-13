# MediBridge — Implementation Plan

This document is the **build playbook**. `plan.md` says *what* to build; `technical.md` says *how* to build it; this file says **in what order, with what tests, and when each phase is allowed to be called done**.

---

## How to use this document

1. Open the repo in VS Code with the Claude extension. Attach `plan.md`, `technical.md`, and this file to the conversation.
2. Work **one phase at a time**. Do not start Phase N+1 until Phase N's exit checklist is fully ticked.
3. At the start of each phase, give Claude the sample prompt at the top of that phase's section. The phase scope is small enough to fit in a single coherent session.
4. Run the manual test script and the automated tests before ticking the exit checklist.
5. Commit at the end of each phase with the message `Phase N: <name>` and tag the commit (`git tag phase-N-complete`). This makes it trivial to roll back if a later phase reveals an issue.

---

## Working agreement (rules of engagement)

These rules exist because the alternative — building the whole thing as one mega-task — is how solo projects collapse.

1. **Vertical slices, not horizontal layers.** Build one user story end-to-end (DB -> API -> UI -> test) before starting the next. Don't build "all the models" then "all the views" then "all the pages". By the end of Phase 2, a real user can sign up, log in, and edit a real profile against MySQL — and that's tested.
2. **No phase is done until tests pass.** Both the manual script and the automated tests. If you skip the test gate, you're building on sand and the bugs compound.
3. **Commit per phase.** Tag with `phase-N-complete`. If Phase 7 reveals that Phase 5 had a design flaw, you can `git diff phase-4-complete..phase-5-complete` to see exactly what changed.
4. **No scope creep within a phase.** If you notice a missing piece outside the current phase, write it down in a `TODO.md` and continue. You will get to it.
5. **Time-box ruthlessly.** If a phase's actual time exceeds 2x its estimate, stop and ask: am I solving the right problem? Don't grind.
6. **One Claude session per phase, ideally.** Long sessions accumulate confusion. Start fresh per phase, attach the three docs, point at the current phase. Claude works best with bounded context.

---

## Phase overview at a glance

| # | Phase | Estimated effort* | Cumulative |
|---|---|---|---|
| 0 | Skeleton & environment | 1-2 days | 1-2 d |
| 1 | Authentication | 3-4 days | 4-6 d |
| 2 | Patient profile | 1-2 days | 5-8 d |
| 3 | Doctor onboarding | 3-4 days | 8-12 d |
| 4 | Doctor availability + public directory | 3-4 days | 11-16 d |
| 5 | Symptom intake + admin matching | 4-5 days | 15-21 d |
| 6 | Booking + dummy payment | 4-5 days | 19-26 d |
| 7 | Prescription | 4-5 days | 23-31 d |
| 8 | Follow-up consultations | 1-2 days | 24-33 d |
| 9 | Hospitals + surgery packages (public) | 3-4 days | 27-37 d |
| 10 | Surgery booking flow | 5-7 days | 32-44 d |
| 11 | Admin custom panel | 3-4 days | 35-48 d |
| 12 | Polish & pre-handover | 4-6 days | 39-54 d |

\* Solo developer with Claude assistance, working full days. New territory adds variance. Treat the upper bound as realistic.

**Realistic total: 8-11 weeks.** Anyone (you or the client) expecting a 2-3 week timeline is wrong about scope, not about pace.

---

## Phase 0: Skeleton & environment validation

**Goal.** A working monorepo where Django runs on `:8000`, Next.js runs on `:3000`, both reach MySQL, and a `/api/v1/health` endpoint returns OK to the frontend through CORS.

**Estimated effort.** 1-2 days.

### Scope
**In:** repo init, both project skeletons, MySQL connection via PyMySQL, CORS, base layout, Inter font, axios client, drf-spectacular, one `/health` endpoint, one health-status component on the landing page.

**Out:** any business logic, any model beyond the custom User stub, any auth.

### Backend deliverables
- Django project `medibridge/` with split settings (`base.py`, `dev.py`)
- PyMySQL shim in `backend/medibridge/__init__.py`
- Custom `User` model in `apps/accounts/` (email login, role field, but no auth views yet)
- MySQL connection working; `python manage.py migrate` succeeds
- `apps/core/` with one viewset exposing `GET /api/v1/health` returning `{"status": "ok", "timestamp": "..."}`
- `django-cors-headers` configured to allow `http://localhost:3000` with credentials
- `drf-spectacular` configured; `/api/v1/schema/swagger/` reachable in dev
- `requirements.txt` with pinned versions
- `.env.example` matching the spec in `technical.md` section 12
- One pytest test for `/health`

### Frontend deliverables
- Next.js 14+ App Router project with TypeScript strict mode
- Tailwind CSS configured with neutral + accent palette per `technical.md` section 11.8
- shadcn/ui initialized; install `button`, `card`
- Inter font wired via `next/font/google` in root layout
- `lib/api.ts` axios instance with `withCredentials: true`
- Landing page (`app/page.tsx`) that calls `/api/v1/health` from a server component and shows a green "API: OK" badge or red "API: unreachable" badge
- `.env.local.example`

### Sample Claude prompt
> Read `plan.md`, `technical.md`, and `implementation.md`. We are starting Phase 0. Set up the monorepo skeleton per `technical.md` section 2. Backend: Django project with custom User model, PyMySQL shim, MySQL connection, `/api/v1/health` endpoint, CORS for localhost:3000, drf-spectacular. Frontend: Next.js App Router, Tailwind, shadcn/ui init, Inter font, axios client, a landing page that pings `/health`. Stop after both servers run with hot reload and the landing page shows the API status. Do not start Phase 1.

### Manual test script
1. Open two terminals in VS Code. Terminal A: `cd backend`, activate venv, `python manage.py runserver`. Confirm it boots without errors.
2. Terminal B: `cd frontend`, `npm run dev`. Confirm it boots without errors.
3. Open `http://localhost:8000/api/v1/health` in the browser. Expect JSON `{"status": "ok", ...}`.
4. Open `http://localhost:8000/api/v1/schema/swagger/`. Expect Swagger UI showing the `/health` endpoint.
5. Open `http://localhost:3000`. Expect the landing page to render with the Inter font and a green "API: OK" badge.
6. Open browser DevTools -> Network. Refresh. Confirm a request to `/api/v1/health` succeeded with status 200 and the response carries CORS headers.
7. Stop the backend (`Ctrl+C` in Terminal A). Refresh the frontend. Expect the badge to flip to red ("API: unreachable") with no app crash. Restart the backend.
8. Open MySQL Workbench. Confirm the `medibridge` database exists with at least the `auth_*` and `accounts_user` tables.

### Automated tests required
- Backend: `pytest backend/tests/` — at minimum, a test for `GET /api/v1/health` returning 200 with the expected shape.

### Phase 0 is complete when
- [ ] Both servers start with no warnings or errors
- [ ] `/api/v1/health` returns 200 from both browser and frontend (CORS works)
- [ ] Swagger UI loads and lists the health endpoint
- [ ] Landing page renders with Inter font and accent color
- [ ] `pytest` passes with at least one test
- [ ] `.env.example` and `.env.local.example` are committed; actual `.env` files are gitignored
- [ ] `README.md` documents the setup commands from `technical.md` section 13
- [ ] Code committed: `git commit -m "Phase 0: skeleton & environment"` and tagged `phase-0-complete`

### Common pitfalls
- Forgetting the PyMySQL shim — Django will fail with "No module named MySQLdb" on first migrate.
- CORS failing silently — check `CORS_ALLOWED_ORIGINS` AND `CORS_ALLOW_CREDENTIALS=True`. Both are required.
- Loading Inter via `<link>` instead of `next/font` — `next/font` self-hosts and avoids layout shift.
- Setting up the custom User model **after** running `migrate` — you must register `AUTH_USER_MODEL = "accounts.User"` before the first migration. If you forget, you'll need to drop the database and start over.

---

## Phase 1: Authentication

**Goal.** A patient can sign up, verify email, log in, log out. JWT cookies are issued and rotated. Protected routes work end-to-end through the axios interceptor and the Next.js middleware.

**Estimated effort.** 3-4 days.

### Scope
**In:** patient signup, email verification, login, logout, refresh, `me`, password reset, `JWTCookieAuthentication`, `IsPatient`/`IsDoctor`/`IsAdmin` permissions, `AuthProvider`, `useAuth` hook, axios interceptor, Next.js middleware on `/patient/*`.

**Out:** doctor signup (Phase 3), profile completion (Phase 2), email-via-real-SMTP (use console backend).

### Backend deliverables
- `EmailVerificationToken` and `PasswordResetToken` models
- Endpoints per `technical.md` section 5.2: signup/patient, login, logout, refresh, me, verify-email, resend-verification, forgot-password, reset-password
- Custom JWT cookie authentication class (`core/authentication.py`)
- Cookies set with `HttpOnly`, `SameSite=Lax`; `Secure=False` in dev
- Refresh token rotation with blacklist
- Email templates: `verification.html` / `.txt`, `password_reset.html` / `.txt`
- `notifications.services.send_email()` working with console backend
- Throttle classes: `5/min` on login, `3/min` on password reset
- Pytest tests covering each endpoint and role enforcement on a stub protected endpoint

### Frontend deliverables
- `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`, `app/auth/verify-email/[token]/page.tsx`, `app/auth/forgot-password/page.tsx`, `app/auth/reset-password/[token]/page.tsx`
- `components/auth/AuthProvider.tsx` exposing user via context (hydrates from `/api/v1/auth/me` on mount)
- `hooks/use-auth.ts`
- `lib/api.ts` interceptor: on 401, call `/api/v1/auth/refresh`; on success replay; on failure clear context and `router.push("/auth/login?next=...")`
- `middleware.ts` redirects `/patient/*` (and later `/doctor/*`, `/admin/*`) to login if `access_token` cookie missing
- Forms use React Hook Form + Zod with shadcn/ui form primitives
- `app/patient/page.tsx` stub: "Welcome, {email}!" with a logout button (proves end-to-end auth)

### Sample Claude prompt
> We are starting Phase 1: authentication. Implement everything in `implementation.md` Phase 1 deliverables. Use `technical.md` sections 5.2 (auth endpoints) and 6 (JWT cookie strategy) as the reference. Build vertically: one endpoint, then the corresponding frontend page, then the test. Start with signup. Stop after the manual test script in `implementation.md` Phase 1 passes end-to-end.

### Manual test script
1. From `/`, click "Sign Up". Fill the form with a test email and password. Submit.
2. Check the backend terminal. Expect a verification email printed to the console with a link.
3. Open the link in the same browser. Expect a "Email verified" success page with a link to login.
4. Go to `/auth/login`. Log in with the same credentials. Expect a redirect to `/patient`.
5. On `/patient`, expect "Welcome, <email>!" and a logout button. Open DevTools -> Application -> Cookies. Confirm `access_token` and `refresh_token` are set, both `HttpOnly`.
6. Hard-refresh the page (Ctrl+Shift+R). Expect to remain on `/patient` (cookie persists, `/auth/me` succeeds).
7. Open `/auth/login` in a private/incognito window. Try to navigate directly to `/patient`. Expect redirect to `/auth/login?next=/patient`.
8. Back in the main window, wait until the access token expires (set `JWT_ACCESS_LIFETIME_MINUTES=1` in `.env` for this test, then revert). Make any authed request. Expect the interceptor to silently refresh and the request to succeed.
9. Click "Logout". Expect redirect to `/`. Confirm cookies are cleared. Try `/patient` again -> redirect to login.
10. Try password reset: from login page click "Forgot password?", enter the email, check console for reset link, click it, set new password, log in with new password.
11. Throttle test: hit login 6 times with wrong password. Expect a 429 on the 6th.

### Automated tests required
- Backend `tests/test_auth.py`:
  - Signup creates user, sends email, returns 201
  - Login with verified user returns 200 with user payload, sets cookies
  - Login with unverified user returns 403 with helpful error
  - Refresh rotates tokens, blacklists old refresh
  - Logout clears cookies and blacklists refresh
  - `/me` returns 401 without cookie, 200 with valid cookie
  - Reset password flow: token consumed, password changes, old password rejected
  - Throttle: 6th login attempt within a minute returns 429
- Frontend (Vitest): one happy-path test of the login form (mocks API, asserts redirect on success).

### Phase 1 is complete when
- [ ] Manual test script passes all 11 steps
- [ ] All backend tests pass
- [ ] Login works after a server restart (cookie auth survives backend restart)
- [ ] Refresh interceptor verified to work (DevTools shows the `/refresh` call only on 401)
- [ ] `JWT_ACCESS_LIFETIME_MINUTES` is set back to 15
- [ ] Code committed and tagged `phase-1-complete`

### Common pitfalls
- `SameSite=Strict` instead of `Lax` — top-level navigations from email links won't carry the cookie. Use `Lax`.
- Forgetting `withCredentials: true` in axios — cookies won't be sent. Symptom: every request returns 401 even right after login.
- Storing the JWT in `localStorage` because "it's easier" — defeats the entire point. Stay with httpOnly cookies.
- Refresh interceptor that retries forever on a failing refresh — guard with a `_retry` flag on the request config.
- Using session middleware alongside JWT — pick one. The API uses JWT only. Django sessions remain only for `/admin/`.

---

## Phase 2: Patient profile

**Goal.** A logged-in patient can view and complete their profile.

**Estimated effort.** 1-2 days.

### Scope
**In:** `PatientProfile` model, GET/PATCH endpoint, profile auto-creation on signup, profile page with form.

**Out:** profile image upload (defer to Phase 12 polish if not finished here).

### Backend deliverables
- `PatientProfile` model per `technical.md` section 4.2
- Signal/handler that creates an empty `PatientProfile` when a `User` with `role="patient"` is created
- `GET /api/v1/patient/profile`, `PATCH /api/v1/patient/profile`
- Permission: only the owning patient can read or write their profile
- Tests for create-on-signup, read, partial update, validation errors

### Frontend deliverables
- `app/patient/page.tsx` updated: dashboard with a "profile completeness" card. If profile is incomplete (missing required fields), show CTA "Complete your profile".
- `app/patient/profile/page.tsx` with full form: name, DOB, gender, height, weight, blood group, phone, address fields, timezone, emergency contact, conditions/allergies/medications
- Server component fetches profile; client component handles the form (RHF + Zod)
- Toast on save success
- Field-level error messages from API validation

### Sample Claude prompt
> Phase 2: patient profile. Per `implementation.md` Phase 2, build the `PatientProfile` model, signal-based auto-creation on patient signup, GET/PATCH endpoint with owner-only permission, and the `/patient/profile` page with a typed RHF + Zod form. Profile fields are in `technical.md` section 4.2. Manual test script is in `implementation.md` Phase 2.

### Manual test script
1. Sign up a fresh patient. Log in. Land on `/patient`.
2. Expect a "Complete your profile" card. Click it.
3. On `/patient/profile`, fill all required fields. Submit. Expect a success toast.
4. Refresh. Expect the values to persist.
5. Edit one field. Submit. Expect success.
6. Open DevTools. Try to `PATCH /api/v1/patient/profile` for a different user's ID — expect 403 (or 404 — never 200).
7. Submit the form with an invalid date of birth (future date). Expect a clear field-level error.

### Automated tests required
- Backend: profile auto-created on signup, GET returns own profile, PATCH updates only allowed fields, cross-user PATCH returns 403, invalid DOB rejected.
- Frontend: form submission test with mocked API.

### Phase 2 is complete when
- [ ] Manual test script passes
- [ ] Backend tests pass
- [ ] Profile completeness CTA appears only when profile is incomplete
- [ ] Code committed and tagged `phase-2-complete`

### Common pitfalls
- Auto-creating profile in a `post_save` signal that also fires on every save — guard with `if created:`.
- Letting the profile endpoint take a `user_id` query param — don't. The user is always `request.user`. No ID in the URL.

---

## Phase 3: Doctor onboarding

**Goal.** Admin invites a doctor by email. Doctor signs up via the invite link, completes profile + education + specializations. Admin verifies. Doctor is then visible to patients.

**Estimated effort.** 3-4 days.

### Scope
**In:** `DoctorProfile`, `DoctorEducation`, `Specialization` (with fixture), `DoctorInvite`, doctor signup endpoint, doctor profile/education endpoints, admin invite + verify endpoints, doctor profile page with education sub-form.

**Out:** availability slots (Phase 4), public directory (Phase 4).

### Backend deliverables
- Models per `technical.md` sections 4.3
- Specialization fixture (`apps/doctors/fixtures/specializations.json`) with the 18 specializations from `technical.md`
- Endpoints: `POST /api/v1/auth/signup/doctor` (invite-gated), `GET/PATCH /api/v1/doctor/profile`, `GET/POST /api/v1/doctor/education`, `PATCH/DELETE /api/v1/doctor/education/{id}`, `GET /api/v1/admin/doctors`, `POST /api/v1/admin/doctors/invite`, `POST /api/v1/admin/doctors/{id}/verify`
- Email template for doctor invite with token link
- AuditLog row on `doctor.invited` and `doctor.verified`
- Tests for invite token validation (used, expired, mismatched email), doctor signup happy path, admin verify, only verified doctors are visible via `/api/v1/public/doctors` (the public endpoint can be added in Phase 4 — for Phase 3, expose a list endpoint to admins only)

### Frontend deliverables
- `app/admin/doctors/invite/page.tsx` with a single email field
- `app/admin/doctors/page.tsx` listing all doctors with verify action and a verified/unverified badge
- `app/auth/signup/doctor/[token]/page.tsx` — full doctor signup form (email, password, profile fields, education repeater)
- `app/doctor/page.tsx` — dashboard with onboarding checklist: profile complete, education added, awaiting verification, verified
- `app/doctor/profile/page.tsx` — edit profile, manage education entries, manage specializations (multi-select from fixture)

### Sample Claude prompt
> Phase 3: doctor onboarding. Per `implementation.md` Phase 3 deliverables. Build the doctor invite flow first (admin sends invite, email logged to console, token-gated signup endpoint), then the doctor profile + education + specializations management, then the admin verify action. Use `technical.md` sections 4.3 and 5.5/5.6 for the data and endpoint shapes. Manual test script is in this file.

### Manual test script
1. Log in as the superuser (admin). Go to `/admin/doctors/invite`. Enter `doctor1@test.local` and submit.
2. Check backend console. Confirm an email with a signup link is logged.
3. Open the link in a private window. Land on the doctor signup page. Fill the form and submit. Expect to be redirected to login (no auto-login).
4. Log in as `doctor1@test.local`. Land on `/doctor`. Expect onboarding checklist showing profile incomplete.
5. Go to `/doctor/profile`. Fill all profile fields. Add 2 education entries. Pick 2 specializations. Save.
6. Land back on `/doctor`. Checklist now shows "Awaiting verification".
7. In another browser/window, log back in as admin. Go to `/admin/doctors`. See the new doctor with an "Unverified" badge. Click "Verify".
8. Refresh `/doctor` as the doctor. Expect "Verified" badge.
9. Try the invite link from step 2 again — expect "This invite has already been used" error.
10. Admin invites a fresh email. In the database, expire the invite (`expires_at` to a past date). Try the link — expect "Invite expired" error.

### Automated tests required
- Backend: invite token unique, signup with valid token creates User+DoctorProfile, used token rejected, expired token rejected, email mismatch rejected, admin-only on invite and verify endpoints, doctor cannot list other doctors via `/api/v1/admin/doctors`.
- Frontend: signup form requires invite token (page returns 404 without it).

### Phase 3 is complete when
- [ ] Manual test script passes
- [ ] Backend tests pass
- [ ] Specializations fixture loaded and visible in profile dropdown
- [ ] AuditLog entries exist for invite and verify actions
- [ ] Code committed and tagged `phase-3-complete`

### Common pitfalls
- Letting unverified doctors appear in the patient-facing parts of the app — this should not happen yet because Phase 4 adds the public endpoint, but keep the `is_verified=True` filter in mind.
- Forgetting to mark the invite as `accepted_at` on signup — without this, the same link can be reused.
- Allowing the doctor to set their own `is_verified=True` via PATCH — your serializer must exclude this field for non-admin users.

---

## Phase 4: Doctor availability + public directory

**Goal.** Verified doctor can manage recurring weekly slots and one-off date slots. Anyone can browse `/doctors`. Anonymous visitors can see profiles but only logged-in patients see exact bookable slots.

**Estimated effort.** 3-4 days.

### Scope
**In:** `DoctorAvailabilitySlot` CRUD, public doctor list/detail endpoints, `available-slots` computation (next 14 days minus already-booked), public directory pages, doctor availability management page.

**Out:** booking (Phase 6).

### Backend deliverables
- Slot endpoints per `technical.md` section 5.5
- Public endpoints: `GET /api/v1/public/specializations`, `GET /api/v1/public/doctors` (filter by specialization, language; verified + available only), `GET /api/v1/public/doctors/{slug}`
- Patient-only endpoint: `GET /api/v1/patient/doctors/{id}/available-slots` returning a 14-day grid of bookable slots
- Slot computation logic in `apps/doctors/services.py`: given a doctor, expand recurring weekly slots over the next 14 days, add specific-date slots, subtract intervals overlapping existing scheduled appointments, return free intervals at consultation-duration granularity
- Tests covering: recurring expansion across DST boundary (use a doctor in `Asia/Kolkata`, patient in `America/Toronto`), specific-date overrides, exclusion of past slots, exclusion of taken slots

### Frontend deliverables
- `app/doctor/availability/page.tsx` — weekly grid (Mon-Sun, hourly rows) plus a "specific dates" section. Click-and-drag or click-to-toggle UX is overkill for MVP; use a simple form per slot
- `app/(public)/doctors/page.tsx` — server-rendered list with specialization filter (a `<select>` that updates the URL query param)
- `app/(public)/doctors/[slug]/page.tsx` — server-rendered detail with profile, specializations, education, languages, fee. If user is logged in as patient, also fetch and show the next available slots; otherwise show "Sign in to see available slots".

### Sample Claude prompt
> Phase 4: doctor availability and public directory. Build the slot CRUD endpoints, the public doctor endpoints, and the available-slots computation that subtracts existing appointments. Then the doctor availability management page and the public directory pages. The slot computation must be timezone-correct: doctor's slots are stored in their timezone, returned as UTC for the frontend to display in patient's timezone.

### Manual test script
1. Log in as the verified doctor from Phase 3. Go to `/doctor/availability`. Add: Mon 9:00-12:00 recurring, Wed 14:00-17:00 recurring. Save.
2. Add a one-off slot: next Saturday 10:00-13:00. Save.
3. Open an incognito window. Go to `/doctors`. Expect the doctor in the list.
4. Filter by the doctor's specialization. Confirm they remain. Filter by a different specialization. Confirm they disappear.
5. Click the doctor's profile. See bio, education, fee. No slots visible (anonymous).
6. Sign up a new patient (or use existing). Log in. Visit the same doctor profile. Expect the next 14 days' bookable slots listed.
7. Verify timezone: with patient timezone set to `America/Toronto`, a slot the doctor entered as 9:00 IST should display in Toronto local time.
8. Manually create an `Appointment` in Django admin for one of the slots. Refresh the patient view. Expect that slot to be missing from available-slots.

### Automated tests required
- Backend: recurring slot expansion (test with `freezegun` to fix "now"), specific-date slot included, past slots excluded, booked slot excluded, timezone correctness across DST, only verified+available doctors in `/public/doctors`.
- Frontend: directory filter changes URL and refetches.

### Phase 4 is complete when
- [ ] Manual test script passes
- [ ] Backend tests pass including the timezone DST edge case
- [ ] Anonymous visitors can browse but cannot see exact slots
- [ ] Code committed and tagged `phase-4-complete`

### Common pitfalls
- Storing slot times as naive datetimes — they must be timezone-aware (Django settings `USE_TZ=True`).
- Computing "next 14 days" using `date.today()` instead of "now in the doctor's timezone" — wrong results when the patient and doctor are on different days.
- Returning slot times in the doctor's local time instead of UTC — let the frontend convert to patient's timezone using `date-fns-tz`.

---

## Phase 5: Symptom intake + admin matching

**Goal.** Patient submits a symptom intake (with optional file attachment). Admin sees the queue, reviews, suggests doctors. Patient sees suggestions on the consultation detail page.

**Estimated effort.** 4-5 days.

### Scope
**In:** `SymptomIntake`, `DoctorSuggestion` models, file upload for intake attachments, patient intake endpoints, admin queue and suggestion endpoint, two email triggers.

**Out:** booking (Phase 6).

### Backend deliverables
- Models per `technical.md` section 4.4
- Endpoints per `technical.md` sections 5.4 (patient) and 5.6 (admin)
- File-upload validation: 10 MB max, MIME whitelist (jpg/png/pdf)
- Email templates: `intake_received.html/txt` (to patient + alert to admin), `doctors_suggested.html/txt` (to patient)
- AuditLog entry on `intake.suggested_doctors`
- Suggestion endpoint replaces existing suggestions atomically (delete + create in a transaction)
- Tests: intake create with attachment, status transitions, suggestion replacement, email logged, only admin can suggest

### Frontend deliverables
- `app/patient/consultations/page.tsx` — list of intakes with status badges
- `app/patient/consultations/new/page.tsx` — form: chief complaint, symptoms (textarea or chip input), duration, severity (slider 1-10), what's been tried, optional file upload via react-dropzone
- `app/patient/consultations/[id]/page.tsx` — status banner, intake summary, suggested doctors when ready (each as a card with admin's note and a "Book consultation" button — non-functional in this phase, just visible)
- `app/admin/intakes/page.tsx` — queue table sorted by created_at, default filter `status=pending_review`
- `app/admin/intakes/[id]/page.tsx` — patient summary on left, doctor multi-select with specialization filter on right, admin note field, "Suggest" button

### Sample Claude prompt
> Phase 5: symptom intake and admin matching. Per `implementation.md` Phase 5 deliverables. Build the patient submission flow first, then the admin queue and suggestion flow. Use file upload via react-dropzone with frontend size and type validation, plus backend revalidation. Two emails must be triggered: intake received (to patient) and doctors suggested (to patient). Manual test script is in this file.

### Manual test script
1. Log in as the patient (with completed profile from Phase 2). Go to `/patient`. Click "New consultation".
2. Fill the intake form: complaint "persistent cough", symptoms "dry, worse at night, mild fever", duration "10 days", severity 6, no attachment. Submit.
3. Land on `/patient/consultations/[id]`. Status: "Awaiting doctor match".
4. Check backend console: confirm two emails were logged (one to patient, one to admin).
5. Log in as admin in another window. Go to `/admin/intakes`. Expect the new intake at top.
6. Click into it. Read patient summary. Filter doctor list by "Pulmonology". Select 2 doctors. Add admin note "Both have evening availability for North America TZ". Submit.
7. Confirm: status changed to "doctors_suggested", patient gets an email (logged in console), AuditLog has a `intake.suggested_doctors` row.
8. Switch back to patient window. Refresh `/patient/consultations/[id]`. Expect 2 doctor cards with the admin's note.
9. Try to suggest different doctors as the admin (re-suggest). Refresh patient view. Expect the new set replaces the old.
10. Try uploading an executable (e.g., `.exe` renamed to `.pdf`). Backend MIME check should reject it.
11. As a different patient, try to GET `/api/v1/patient/intakes/{id}` for the first patient's intake. Expect 404 (or 403).

### Automated tests required
- Backend: intake create (with and without attachment), intake list scoped to current patient, attachment size/type validation, suggestion endpoint creates DoctorSuggestion rows and changes intake status, re-suggestion replaces, only admin can suggest, emails logged, AuditLog created.
- Frontend: intake form validation (severity required, complaint required), file upload over 10MB rejected client-side.

### Phase 5 is complete when
- [ ] Manual test script passes all 11 steps
- [ ] Backend tests pass
- [ ] Re-suggestion correctly replaces previous suggestions
- [ ] File upload rejection works for both size and MIME
- [ ] Code committed and tagged `phase-5-complete`

### Common pitfalls
- Letting the admin note appear in the wrong place — there's `admin_note` (visible to patient) and `internal_note` (admin-only). Don't leak.
- Re-suggestion that creates duplicates instead of replacing — use a transaction with delete + create.
- Returning the file URL directly without auth check — intake attachments may contain medical history. Serve through an authenticated view that checks `intake.patient.user == request.user or request.user.role == 'admin'`.

---

## Phase 6: Booking + dummy payment

**Goal.** Patient picks a suggested doctor, picks a slot, completes the dummy payment dialog, the appointment is created and emails go out.

**Estimated effort.** 4-5 days.

### Scope
**In:** `Appointment` model, `Payment` (dummy) model and endpoint, booking endpoint with concurrency-safe slot lock, two email triggers, doctor's appointment list and detail with "set meeting link" action.

**Out:** prescription (Phase 7).

### Backend deliverables
- Models per `technical.md` sections 4.4 (Appointment) and 4.5 (Payment)
- `POST /api/v1/payments/dummy` returns a successful Payment row
- `POST /api/v1/patient/appointments` requires `payment_id` and an unbooked slot; uses `select_for_update` (or a unique constraint approach) inside a transaction to prevent double-booking
- `GET /api/v1/patient/appointments`, `GET /api/v1/patient/appointments/{id}`
- `GET /api/v1/doctor/appointments`, `GET /api/v1/doctor/appointments/{id}`, `PATCH /api/v1/doctor/appointments/{id}` (set `meeting_link`, change `status`)
- Email templates: `appointment_confirmed_patient`, `appointment_confirmed_doctor`, `meeting_link_set`
- Production safety: dummy payment endpoint refuses to run if `DEBUG=False`
- Tests: book happy path, double-book prevented under concurrency, payment_id required, payment must belong to the booking patient, status transitions, doctor cannot view other doctors' appointments

### Frontend deliverables
- `app/patient/consultations/[id]/book/[doctorId]/page.tsx` — slot picker (next 14 days, doctor's available slots) plus a "Confirm and pay" button
- `components/payment/DummyPaymentDialog.tsx` — modal with card form (number, expiry, CVV — frontend never sends real PAN; backend extracts last 4 only). On success, the dialog calls the appointment-create endpoint with the `payment_id`, then redirects to `/patient/appointments/{id}`
- `app/patient/appointments/page.tsx` and `app/patient/appointments/[id]/page.tsx` — meeting link visible if doctor has set it
- `app/doctor/appointments/page.tsx` — today / upcoming / past tabs
- `app/doctor/appointments/[id]/page.tsx` — patient summary, intake summary, "Set meeting link" form, "Mark completed" action

### Sample Claude prompt
> Phase 6: booking and dummy payment. Build the booking flow per `implementation.md` Phase 6. Critical: the booking endpoint must be concurrency-safe so two patients hitting the same slot at the same instant cannot both succeed. Use `select_for_update` on the doctor row plus an availability re-check inside the transaction. The dummy payment endpoint must refuse to run if `DEBUG=False`. Manual test script is in this file and includes a concurrency test.

### Manual test script
1. As patient, on `/patient/consultations/[id]`, click "Book" on one of the suggested doctors.
2. Slot picker shows next 14 days. Pick a slot.
3. "Confirm and pay" opens the dummy payment dialog. Enter fake card `4242 4242 4242 4242`, any future expiry, any CVV. Submit.
4. Expect appointment created, redirect to `/patient/appointments/{id}`. See appointment details (date, doctor, fee paid).
5. Backend console: two emails logged (patient and doctor).
6. Log in as the doctor in another window. Go to `/doctor/appointments`. See the new appointment.
7. Open the appointment. Click "Set meeting link". Paste a Google Meet URL. Save.
8. Patient refreshes their appointment page. Expect the link to appear, plus an email logged in the console.
9. Try to book the same slot again from a second patient account. Expect "Slot no longer available" error.
10. Concurrency test: open two private windows, both patients on the same slot, hit "Confirm and pay" within the same second (use the dialog's confirm button). Exactly one should succeed; the other should see a clear error.
11. Verify in the database that exactly one Appointment exists for that slot, and exactly one Payment row references it.

### Automated tests required
- Backend: booking creates Appointment + links Payment, double-book prevented (use `pytest-django` with concurrent transactions or simulate by calling the service twice with the same slot in a single transaction), payment_id mismatch rejected, doctor `PATCH` updates only `meeting_link` and `status`, dummy payment endpoint returns 503 (or 404) when `DEBUG=False`.
- Frontend: payment dialog masks the card number, never logs it.

### Phase 6 is complete when
- [x] Booking endpoint with `select_for_update` prevents double-booking (returns 409)
- [x] `meeting_link` auto-generated as Jitsi room `https://meet.jit.si/medibridge-{token_hex(8)}` at booking time
- [x] Confirmation emails sent to patient and doctor (`appointment_confirmed_patient`, `appointment_confirmed_doctor`)
- [x] Doctor can update status (scheduled→in_progress, in_progress→completed, scheduled→no_show)
- [x] Patient can cancel scheduled appointments
- [x] Join button visible 15 min before scheduled_start; disabled with label outside window; hidden after completion/cancel
- [x] Detail pages: `app/patient/appointments/[id]/page.tsx`, `app/doctor/appointments/[id]/page.tsx`
- [x] 14 backend tests passing
- [x] Code committed

### As-built deviations from plan
- `Payment` model not built as a separate model — `payment_ref` is a string on `Appointment` (DUMMY-{hex}), no `payment_id` required at booking
- Doctor does NOT set `meeting_link` manually — it is auto-generated at booking time (Jitsi Meet)
- `meeting_link_set` email template not needed (link is set at creation, not updated later)
- `DEBUG=False` guard removed from dummy payment — it is guarded by `IsPatient` permission instead

### Common pitfalls
- Not using a transaction around the slot check + appointment create — race condition leads to double bookings.
- Allowing the doctor to set `meeting_link` on someone else's appointment — strict ownership check.

---

## Phase 7: Prescription

**Goal.** Doctor writes a structured prescription. Patient reads it on screen and downloads a PDF.

**Estimated effort.** 4-5 days.

### Scope
**In:** `Prescription`, `PrescriptionMedicine`, `PrescribedTest` models, doctor write endpoint (nested create), patient read endpoints, PDF generation via xhtml2pdf, email trigger.

**Out:** follow-up (Phase 8).

### Backend deliverables
- Models per `technical.md` section 4.4
- `POST /api/v1/doctor/appointments/{id}/prescription` accepting nested medicines and tests in one request
- `PATCH /api/v1/doctor/prescriptions/{id}` allowed up to 24 hours after appointment completion
- `GET /api/v1/patient/prescriptions`, `GET /api/v1/patient/prescriptions/{id}`, `GET /api/v1/patient/prescriptions/{id}/pdf` (streams PDF)
- `templates/pdf/prescription.html` — table-based layout per `technical.md` section 9 constraints (xhtml2pdf-friendly)
- `core.services.pdf.render_pdf()` helper
- PDF cached: generated on first request, file path stored on the model
- Email template `prescription_ready`
- Tests: prescription nested create, medicines and tests created with correct relationships, edit window enforced (25th hour rejected), PDF generation does not raise, patient cannot edit, doctor cannot edit other doctors' prescriptions

### Frontend deliverables
- `app/doctor/appointments/[id]/prescription/new/page.tsx` — diagnosis textarea, dynamic medicine rows (each row: name, dosage, M/A/E/N checkboxes, meal timing select, duration days, instructions), dynamic tests rows, follow-up checkbox + days input, general notes
- `app/patient/prescriptions/page.tsx` — list with date and doctor name
- `app/patient/prescriptions/[id]/page.tsx` — read-only view with the medicines table rendered same as the PDF, plus a "Download PDF" button

### Sample Claude prompt
> Phase 7: prescriptions. Build the prescription writing experience for doctors and the read/download experience for patients. Use xhtml2pdf for PDF generation per `technical.md` section 9 — strict template constraints (tables only, no flexbox). Test the medicines table renders correctly with M/A/E/N flags. Manual test script in this file.

### Manual test script
1. As doctor, go to today's completed appointment. Click "Write prescription".
2. Fill diagnosis "Acute bronchitis". Add 2 medicines: "Azithromycin 500mg, morning, after meal, 3 days, take with water" and "Paracetamol 650mg, morning + evening, after meal, 5 days, only if fever". Add 1 test: "Chest X-ray, routine". Tick "Follow up after 7 days". Submit.
3. Console: prescription_ready email logged.
4. Log in as patient. Go to `/patient/prescriptions`. See the new entry.
5. Open it. Confirm medicines table renders with M/A/E/N columns showing correct ticks.
6. Click "Download PDF". Open the PDF. Confirm same content, doctor signature image (if uploaded), MediBridge header.
7. Switch to doctor. Edit the prescription within 24 hours: change one medicine's dosage. Save. Patient refreshes; updated value visible.
8. In the database, set `appointment.completed_at` to 25 hours ago. Try to edit. Expect 403.
9. Try as a different doctor to GET the prescription. Expect 403/404.

### Automated tests required
- Backend: nested create produces correct medicines and tests, edit within window allowed, edit beyond window rejected, patient cannot PATCH, PDF generation runs cleanly with sample data.
- Frontend: medicine row add/remove (UI test), form submission with empty medicines array (allowed — diagnosis-only), required fields validated.

### Phase 7 is complete when
- [ ] Manual test script passes
- [ ] Backend tests pass
- [ ] PDF opens cleanly in Adobe Reader and Chrome
- [ ] Medicines table in PDF matches on-screen view
- [ ] Code committed and tagged `phase-7-complete`

### Common pitfalls
- xhtml2pdf failing silently on unsupported CSS — open the generated PDF to check, don't trust just "no error". Use only basic CSS in the template.
- Doctor's signature image stored as a relative URL — xhtml2pdf needs an absolute file path or a data URI.
- Letting the patient see prescriptions for appointments that don't belong to them — owner check on every read.

---

## Phase 8: Follow-up consultations

**Goal.** Doctor proposes a follow-up date. Patient confirms. A second appointment is created, linked to the original.

**Estimated effort.** 1-2 days.

### Scope
**In:** follow-up creation endpoint, fee-waived flag, parent-appointment link, patient confirmation flow.

**Out:** anything else.

### Backend deliverables
- `POST /api/v1/doctor/appointments/{id}/follow-up` accepting `{after_days, slot_start, slot_end, fee_waived}`. Creates an `Appointment` in `scheduled` status with `parent_appointment` set; if `fee_waived=True`, no payment is required from the patient and the booking is auto-confirmed.
- If `fee_waived=False`, the new appointment is in a `proposed` sub-state until the patient pays — extend the status enum or use a separate `requires_payment` flag.
- Email template `follow_up_proposed`
- Patient endpoint to confirm a fee-waived follow-up (or to pay and confirm a fee-paid one — reuse the booking + payment flow from Phase 6).
- Tests: linked appointment created, fee-waived shortcuts payment, patient sees pending follow-up, patient can confirm.

### Frontend deliverables
- On `/doctor/appointments/[id]` (after prescription written), add a "Schedule follow-up" panel: date picker, slot picker filtered by doctor's availability, fee-waived toggle.
- On `/patient/appointments` and `/patient/appointments/[id]`, show a "Pending follow-up" notice with confirm action. Confirm reuses the payment flow if not waived.

### Sample Claude prompt
> Phase 8: follow-ups. Implement the follow-up proposal and confirmation flow. Reuse Phase 6's payment flow for fee-paid follow-ups. Fee-waived follow-ups skip payment and auto-confirm.

### Manual test script
1. From Phase 7's appointment, doctor schedules a follow-up after 7 days, fee waived, on a real slot. Submit.
2. Patient gets an email logged in the console.
3. Patient sees "Pending follow-up" notice on `/patient/appointments`. Click confirm. No payment dialog shown (fee waived). Appointment becomes `scheduled`.
4. Doctor schedules a second follow-up, fee NOT waived. Patient sees notice; clicking confirm goes through the dummy payment flow.
5. Verify both follow-ups have `parent_appointment` set to the original.

### Automated tests required
- Backend: follow-up creates linked appointment; fee-waived path skips payment; fee-paid path requires payment_id; only the original doctor can propose.

### Phase 8 is complete when
- [ ] Manual test script passes
- [ ] Backend tests pass
- [ ] `parent_appointment` correctly set
- [ ] Code committed and tagged `phase-8-complete`

### Common pitfalls
- Forgetting to filter follow-up time-of-day against the doctor's availability — slot must still be valid.
- Letting one patient confirm another patient's follow-up — owner check.

---

## Phase 9: Hospitals + surgery packages (public)

**Goal.** Admin manages hospitals and surgery packages. Public can browse them.

**Estimated effort.** 3-4 days.

### Scope
**In:** Hospital and SurgeryPackage CRUD, public list/detail, related-packages logic.

**Out:** booking (Phase 10).

### Backend deliverables
- Models per `technical.md` section 4.6
- Admin CRUD endpoints per `technical.md` section 5.6
- Public endpoints: `GET /api/v1/public/hospitals`, `GET /api/v1/public/packages` (filter by `surgery_type`, `hospital`), `GET /api/v1/public/packages/{slug}` (returns 2-3 related packages of the same `surgery_type`)
- Image upload on Hospital and SurgeryPackage
- Tests: CRUD, public visibility (only `is_active=True`), related-package logic

### Frontend deliverables
- `app/admin/hospitals/page.tsx` and detail/edit pages
- `app/admin/packages/page.tsx` and detail/edit pages with all the inclusion toggles
- `app/(public)/packages/page.tsx` — list with surgery-type filter, package cards showing hospital, price, duration
- `app/(public)/packages/[slug]/page.tsx` — detail with full inclusions/exclusions, side-by-side related packages from other hospitals

### Sample Claude prompt
> Phase 9: hospitals and surgery packages. Build admin CRUD plus public browsing. The public package detail page shows 2-3 related packages of the same surgery type from other hospitals (so patients can compare). Manual test script in this file.

### Manual test script
1. As admin, create 2 hospitals.
2. Create 4 packages: 2 knee replacement (one per hospital) and 2 cardiac bypass (one per hospital). Different prices and inclusions.
3. As anonymous, go to `/packages`. Expect all 4.
4. Filter by knee replacement. Expect 2.
5. Open one knee package. Expect detail with inclusions/exclusions. Expect "Related packages" showing the other knee package.
6. Open a cardiac package. Expect "Related" showing the other cardiac one.
7. Mark one package `is_active=False` in admin. Refresh public list. Expect it to be gone.

### Automated tests required
- Backend: CRUD permissions (admin only), public sees only active packages, related logic returns same surgery_type, never the same package itself.

### Phase 9 is complete when
- [ ] Manual test script passes
- [ ] Backend tests pass
- [ ] Image uploads work for both hospitals and packages
- [ ] Code committed and tagged `phase-9-complete`

### Common pitfalls
- Slugs not generated on create — use `django-autoslug` or override `save()`.
- Images served at `MEDIA_URL` paths in dev not working — confirm `MEDIA_URL` and `MEDIA_ROOT` are set and `urlpatterns` includes `static(settings.MEDIA_URL, ...)` in DEBUG.

---

## Phase 10: Surgery booking flow

**Goal.** Patient picks a package, provides travel info, uploads required documents, completes dummy payment, receives a voucher PDF.

**Estimated effort.** 5-7 days. **The biggest phase.**

### Scope
**In:** `SurgeryPackageBooking`, `PatientTravelInfo`, `TravelDocument`, `SurgeryCoupon` models; multi-step booking flow; document upload with auth-checked serving; voucher PDF with QR code; email with attachment.

**Out:** anything else.

### Backend deliverables
- Models per `technical.md` section 4.7
- Endpoints per `technical.md` section 5.4 (`/api/v1/patient/surgery-bookings/...`)
- Multi-step state machine: `info_pending` -> `payment_pending` -> `confirmed`
- Document upload endpoint with size + MIME validation; documents served via authenticated view that checks ownership
- Voucher PDF generation: HTML template + QR code (generated via `qrcode` lib, embedded as data URI), saved to `media/coupons/`, file path stored on `SurgeryCoupon`
- Email `voucher_issued` with PDF attached
- Tests: state transitions, document size/type validation, voucher generation does not error, voucher accessible only by the booking's patient or admin

### Frontend deliverables
- `app/patient/surgery-bookings/new/[packageId]/page.tsx` — multi-step wizard (Stepper component from shadcn or custom):
  - Step 1: tentative date
  - Step 2: travel info form (passport, visa, occupation, income, companions, dietary, special needs)
  - Step 3: document upload (passport scan required, visa scan if `visa_required`, govt ID required, others optional). Each upload shows preview.
  - Step 4: review summary
  - Step 5: dummy payment
  - Step 6: confirmation with download voucher button
- `app/patient/surgery-bookings/page.tsx` — list with status badges
- `app/patient/surgery-bookings/[id]/page.tsx` — detail with voucher download if confirmed

### Sample Claude prompt
> Phase 10: surgery booking flow. The largest phase. Build the multi-step wizard, the document upload with auth-checked serving (sensitive documents like passports must NOT be at MEDIA_URL — serve through an authenticated view that re-checks ownership), and the voucher PDF generation with embedded QR code. Use Phase 6's dummy payment dialog pattern. Manual test script in this file is the most important test in the project.

### Manual test script
1. As patient, browse to a package and click "Book this package".
2. Step 1: pick a tentative date 60 days out. Continue.
3. Step 2: fill travel info — passport "P1234567", country "Canada", expiry 5 years out, visa not required, occupation "Software Engineer", employer "Acme Inc", income $90,000, no companions, no dietary needs, no special needs. Continue.
4. Step 3: upload a sample passport image (any small jpg/pdf), upload a sample govt ID. Skip optional uploads. Continue.
5. Step 4: review summary. Confirm everything is correct.
6. Step 5: open dummy payment dialog. Pay. Submit.
7. Step 6: see "Booking confirmed!" with a "Download voucher" button. Download.
8. Open the voucher PDF. Confirm: booking ID, QR code, package name, hospital, dates, last 4 of passport. Patient name correct.
9. Console: `voucher_issued` email logged with PDF attached (or path noted).
10. Try to access the voucher URL (e.g., `/api/v1/patient/surgery-bookings/{id}/voucher`) from a different logged-in patient. Expect 403.
11. Try uploading a 12 MB file in step 3. Expect rejection.
12. Try uploading a `.txt` file as a passport. Expect rejection.
13. In `/patient/surgery-bookings`, see the booking with status "Confirmed".

### Automated tests required
- Backend: state machine transitions (cannot skip steps), document size/type validation, document serving requires auth + ownership, voucher PDF renders, voucher accessible only by owner or admin, voucher email includes attachment.
- Frontend: wizard state preserved across step navigation; back-button on step 3 doesn't lose step 2 data.

### Phase 10 is complete when
- [ ] Manual test script passes all 13 steps
- [ ] Backend tests pass
- [ ] Documents are NOT served from `MEDIA_URL` (URL inspection confirms the path is `/api/v1/.../documents/{id}/file`)
- [ ] Voucher PDF opens cleanly and contains a scannable QR code
- [ ] Code committed and tagged `phase-10-complete`

### Common pitfalls
- Storing passports in `MEDIA_ROOT/travel_docs/` and exposing them at `/media/travel_docs/...` — anyone with the URL could view them. Use an authenticated view.
- Wizard state stored in URL query params and lost on refresh — keep state in a Zustand store or React context within the page.
- Generating a voucher per request instead of once and caching — slow and racy. Generate at confirmation time, store path, serve from path.
- QR code embedded as a relative URL instead of data URI — xhtml2pdf will not fetch it.

---

## Phase 11: Admin custom panel

**Goal.** Admin has a single panel for all day-to-day operations beyond Django admin.

**Estimated effort.** 3-4 days.

### Scope
**In:** dashboard with KPI cards, all listings (intakes, doctors, hospitals, packages, bookings, payments), audit log viewer.

**Out:** any analytics or charting (defer to Phase 2 or later).

### Backend deliverables
- `GET /api/v1/admin/dashboard` returning KPI counts: pending intakes, appointments today, new bookings (last 7 days), unverified doctors, total active doctors, total revenue (sum of dummy payments)
- `GET /api/v1/admin/audit-log` paginated
- `GET /api/v1/admin/payments` paginated
- Confirm `AuditLog` rows are being created at the action points listed in `technical.md` section 4.9 (back-fill any missing ones)
- Tests for admin-only access on every endpoint

### Frontend deliverables
- `app/admin/page.tsx` — KPI cards laid out in a responsive grid; each card links to the relevant filtered listing
- `app/admin/intakes/`, `app/admin/doctors/`, `app/admin/hospitals/`, `app/admin/packages/` — listings already exist from earlier phases; consolidate styling
- `app/admin/bookings/page.tsx` — all consultation + surgery bookings, filterable by type and status
- `app/admin/payments/page.tsx` — all payments, filterable by status
- `app/admin/audit-log/page.tsx` — chronological log

### Sample Claude prompt
> Phase 11: admin custom panel. Build the dashboard with KPI cards, the consolidated listings, and the audit log viewer. Most listing pages already exist from earlier phases; this phase ties them together with a consistent admin layout and adds the dashboard and audit log. Confirm AuditLog rows exist for all the actions in `technical.md` section 4.9.

### Manual test script
1. As admin, go to `/admin`. See the KPI cards. Confirm the numbers match what you'd expect (e.g., 1 pending intake, 2 appointments today).
2. Click each KPI card. Confirm it goes to the relevant filtered listing.
3. Go to `/admin/audit-log`. Confirm entries exist for: doctor invited, doctor verified, intake suggested, booking confirmed.
4. Go to `/admin/bookings`. Filter by "surgery". See only surgery bookings. Filter by "consultation". See only consultations.
5. Go to `/admin/payments`. Confirm dummy payments are listed with correct amounts.

### Automated tests required
- Backend: dashboard KPIs accurate against test fixtures, audit log paginated, all admin endpoints reject non-admin users.

### Phase 11 is complete when
- [ ] Manual test script passes
- [ ] Backend tests pass
- [ ] AuditLog has at least one entry per tracked action class
- [ ] Code committed and tagged `phase-11-complete`

### Common pitfalls
- KPI queries that scan the entire table without indexes — for the MVP it's fine, but watch the query count in Django Debug Toolbar.
- Audit log entries that leak sensitive data in `metadata` (e.g., full passport numbers) — sanitize before storing.

---

## Phase 12: Polish & pre-handover

**Goal.** Site feels finished. All flows are demo-ready. Documentation is current.

**Estimated effort.** 4-6 days.

### Scope
**In:** empty states, loading skeletons, error boundaries, mobile responsiveness sweep, accessibility audit, 404 / 500 pages, SEO basics, README finalized, demo script written, deployment notes drafted.

**Out:** real payments, real video, anything from Phase 2 of the roadmap.

### Tasks
- **Empty states** on every list page (no intakes yet, no appointments yet, no prescriptions yet, no bookings yet) with helpful CTAs.
- **Loading skeletons** on every page that fetches. Replace any `null` returns with `<Skeleton />` placeholders matching final layout.
- **Error boundaries** around route segments. Friendly error UI with "Try again" button and a "Contact support" link.
- **Mobile pass.** Walk every page at 375px viewport (iPhone SE). Fix overflow, broken layouts, text scaling.
- **Keyboard navigation.** Every interactive element reachable by Tab. Focus rings visible. Modals trap focus.
- **Accessibility audit.** Run axe-core (browser extension or Playwright integration). Fix critical and serious issues. Add `alt` text on every image. Use semantic HTML (`<main>`, `<nav>`, `<button>`, not `<div onClick>`).
- **404 and 500 pages** in `app/not-found.tsx` and `app/error.tsx`.
- **SEO basics** on public pages: `<title>`, `<meta description>`, OpenGraph tags, sitemap (`sitemap.xml`), `robots.txt`.
- **README finalized** with: prerequisites, setup commands, environment variables, common troubleshooting, architecture diagram (a simple text version is fine).
- **Demo script** (see appendix below) — a 10-minute walkthrough you'll give the client.
- **Deployment notes** in `DEPLOY.md` — even if you don't deploy now, document the gaps (real SMTP, Stripe/Razorpay, S3 for media, hardened settings, Postgres or MySQL on managed service, etc.).

### Manual test script
1. Walk every page at desktop (1440px) and mobile (375px). Note issues. Fix. Repeat.
2. Run Lighthouse on `/`, `/doctors`, `/packages`. Aim for Performance >= 80, Accessibility >= 95, Best Practices >= 90, SEO >= 95.
3. Run axe-core. Fix all critical and serious findings.
4. Tab through `/auth/signup` and `/patient/profile` using only the keyboard. Confirm focus is always visible and logical.
5. Trigger an error (e.g., disconnect the backend) on a patient page. Confirm the error boundary renders, not a white screen.
6. Open `/some/nonexistent/path`. Confirm the 404 page renders with navigation to home.

### Phase 12 is complete when
- [ ] Manual test script passes
- [ ] Lighthouse scores hit the targets above
- [ ] All axe-core critical and serious issues resolved
- [ ] README is current and a fresh dev could set up from it without help
- [ ] Demo script written and rehearsed once
- [ ] `DEPLOY.md` drafted
- [ ] Code committed and tagged `phase-12-complete`

### Common pitfalls
- Doing polish too early — bugs surface in real flows, not in code review. Polish AFTER the flow works end-to-end.
- Mobile fixes that break desktop — test at both widths after every change.
- Adding accessibility as an afterthought — semantic HTML from the start in earlier phases will save days here.

---

## Demo script for client (10 minutes)

When you walk the client through MediBridge, follow this order. Don't deviate. Practice it twice before the meeting.

1. **Landing page (1 min).** Show the value proposition. "MediBridge helps Canadian and American patients get same-day medical consultations with Indian doctors and bundled surgery packages."
2. **Patient signup + intake (3 min).** Sign up a fresh patient. Submit a symptom intake. Show that it lands in the admin queue.
3. **Admin matching (1 min).** Switch to admin window. Open the intake. Suggest two doctors. Submit.
4. **Patient books consultation (2 min).** Switch back. Refresh intake. Show suggested doctors. Pick one, pick a slot, dummy-pay. Show the appointment in the dashboard. Show emails in the backend console.
5. **Doctor side (1 min).** Switch to doctor window. Show appointment, set meeting link, write a quick prescription with one medicine. Show patient receiving the prescription PDF.
6. **Surgery package (2 min).** Open the public packages page. Pick one. Walk through the multi-step booking, upload sample documents, dummy-pay, download the voucher PDF. Open the PDF.

Skip Phase 11's admin panel for the demo unless the client explicitly asks. Skip the audit log unless they ask.

If the client asks "is this real" — be clear: payments are dummy, video calls use external links (Google Meet/Zoom), production deployment requires further work documented in `DEPLOY.md`. Don't let scope creep happen in the demo.

---

## Hand-over checklist

When the MVP is "done" and you're handing over to the client (or deploying for the first user):

- [ ] All 12 phases tagged in git
- [ ] `README.md` is complete
- [ ] `DEPLOY.md` exists and lists everything that changes between dev and prod
- [ ] `.env.example` is current (no real secrets)
- [ ] All `TODO.md` items reviewed; non-blockers documented as known issues
- [ ] Database migration files all checked in
- [ ] Demo data seed command works on a fresh database
- [ ] Test suite passes on a fresh clone
- [ ] Demo recorded as a screen capture (backup if live demo fails)
- [ ] Client given access to the GitHub repo
- [ ] Open questions from `technical.md` section 18 either resolved or escalated to the client

---

## Appendix A: Claude prompting tips per phase

Patterns that work well with the Claude VS Code extension:

1. **Always attach all three docs.** `plan.md`, `technical.md`, `implementation.md`. Reference the phase number in your prompt.
2. **Phrase requests in terms of deliverables, not files.** "Build the patient profile endpoint per Phase 2" is better than "create `apps/patients/views.py`". Claude will create the right files.
3. **One scope per session.** When you finish Phase N, start a fresh chat for Phase N+1. Carrying old context confuses Claude and burns tokens.
4. **Test gate first.** When a phase is functionally done, prompt: "Now run the manual test script for Phase N from `implementation.md`. Walk me through each step. Then confirm we can tick the exit checklist." Claude is good at being a checklist enforcer.
5. **Show the failure when something breaks.** Paste the error, paste the offending code, ask for a minimal fix. Don't paraphrase the error.
6. **Reject scope creep mid-phase.** If Claude suggests "we should also add X", reply: "Note that as a TODO. Stay in Phase N." Claude will comply.

---

## Appendix B: When you hit a wall

The first time something doesn't work, debug. The second time the *same thing* doesn't work, document it. The third time, change the approach.

Specific traps that have killed similar projects:

- **CORS pain.** If requests work in Postman but fail from the browser with no clear error: it's almost always CORS or cookies. Check `withCredentials` on axios and `CORS_ALLOW_CREDENTIALS=True` on the backend.
- **JWT cookie not setting.** Check the `Set-Cookie` response header in DevTools. If it's there but the cookie isn't stored, it's a `Secure`/`SameSite`/domain mismatch.
- **MySQL strict mode rejecting "incorrect string value".** `utf8mb4` on the database is required (not `utf8`). The CREATE DATABASE command in setup uses it.
- **Migrations conflict after pulling teammate's branch.** Don't squash. Run `python manage.py makemigrations --merge` and review the merge migration carefully.
- **xhtml2pdf produces blank pages.** Almost always a CSS issue. Strip back to plain HTML, confirm it renders, add styles back one at a time.

If you're stuck for more than 90 minutes on the same issue, switch to something else for an hour, then come back. If still stuck after that, simplify until something works, then build back up.
