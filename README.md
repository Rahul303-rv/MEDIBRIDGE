# MediBridge

Online doctor consultations and medical tourism platform. Connects patients in Canada, USA, and the UK with verified Indian doctors for same-day video consultations and bundled surgery packages.

---

## Architecture

```
medibridge/
├── backend/        Django 6 + DRF + MySQL + PyMySQL
└── frontend/       Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
```

**Auth:** JWT in httpOnly cookies (`access_token` + `refresh_token`). No NextAuth.  
**Payments:** Dummy payment endpoint (dev only). Real Stripe/Razorpay for production.  
**Video:** Jitsi Meet external links (`https://meet.jit.si/medibridge-{token}`). No embedded video.  
**PDFs:** xhtml2pdf (Windows-friendly, no system deps). Table-based HTML templates only.  
**Email:** Django console backend by default. Switch via `EMAIL_BACKEND` env var.

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL 8.0+
- pip, npm

---

## Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env — set DB_NAME, DB_USER, DB_PASSWORD, DJANGO_SECRET_KEY

# Create MySQL database
mysql -u root -p -e "CREATE DATABASE medibridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
python manage.py migrate

# Create admin user
python manage.py shell -c "
from apps.accounts.models import User
User.objects.create_superuser('admin@medibridge.local', 'changeme123!', role='admin', is_email_verified=True)
"

# Start dev server
python manage.py runserver
```

Backend runs at `http://localhost:8000`.  
Swagger UI: `http://localhost:8000/api/v1/schema/swagger/`

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | ✅ | — | Django secret key |
| `DB_NAME` | ✅ | medibridge | MySQL database name |
| `DB_USER` | ✅ | root | MySQL user |
| `DB_PASSWORD` | ✅ | — | MySQL password |
| `DB_HOST` | | 127.0.0.1 | MySQL host |
| `DB_PORT` | | 3306 | MySQL port |
| `DJANGO_ALLOWED_HOSTS` | | localhost,127.0.0.1 | Comma-separated |
| `SITE_FRONTEND_URL` | | http://localhost:3000 | Used in email links |
| `EMAIL_BACKEND` | | console | Django email backend |
| `EMAIL_HOST` | | — | SMTP host |
| `EMAIL_HOST_USER` | | — | SMTP user |
| `EMAIL_HOST_PASSWORD` | | — | SMTP password |
| `JWT_ACCESS_LIFETIME_MINUTES` | | 15 | Access token TTL |
| `JWT_REFRESH_LIFETIME_DAYS` | | 7 | Refresh token TTL |
| `JWT_COOKIE_SECURE` | | False | True in production |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | http://localhost:8000 | Backend base URL |
| `NEXT_PUBLIC_SITE_URL` | | http://localhost:3000 | Used in sitemap |

---

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

All test files live in `backend/tests/`. Each phase has its own file:
- `test_auth.py` — Phase 1
- `test_patients.py` — Phase 2
- `test_doctors.py` — Phase 3–4
- `test_availability.py` — Phase 4
- `test_consultations.py` — Phase 5–6
- `test_prescriptions.py` — Phase 7
- `test_follow_up.py` — Phase 8
- `test_hospitals.py` — Phase 9
- `test_surgery.py` — Phase 10
- `test_admin_panel.py` — Phase 11

---

## Project Structure

```
backend/apps/
├── accounts/       User model, JWT auth, email verify, password reset
├── core/           Permissions, AuditLog, admin dashboard endpoints, health
├── notifications/  Email log + send helpers
├── patients/       PatientProfile CRUD
├── doctors/        DoctorProfile, education, availability slots, public directory
├── consultations/  SymptomIntake, Appointment, Prescription, follow-ups
├── hospitals/      Hospital, SurgeryPackage (public directory)
└── surgery/        SurgeryPackageBooking, TravelDocument, PatientTravelInfo, SurgeryCoupon

frontend/app/
├── (public)/       Landing, doctor directory, packages directory (no auth)
├── auth/           Login, signup, email verify, password reset
├── patient/        Patient dashboard, appointments, prescriptions, surgery bookings
├── doctor/         Doctor dashboard, appointments, prescriptions, availability
└── admin/          KPI dashboard, doctors, intakes, hospitals, packages, bookings, audit log
```

---

## Common Troubleshooting

**`(1049, "Unknown database 'test_medibridge'")`**  
Two pytest processes ran simultaneously against the same database. Run tests sequentially:
```bash
python -m pytest tests/test_file.py -v
```

**`python` not found on Windows Bash**  
Use the full venv path:
```bash
"/c/Local Disk-D/MediBridge/backend/.venv/Scripts/python.exe" -m pytest tests/ -v
```

**CORS errors from frontend**  
Ensure `DJANGO_ALLOWED_HOSTS` includes `localhost` and CORS settings in `settings/dev.py` allow `http://localhost:3000`.

**Images not uploading**  
`MEDIA_ROOT` defaults to `backend/media/`. Make sure the directory exists and Django is serving media in dev (`+ static(settings.MEDIA_URL, ...)` in `urls.py` — already configured).

**JWT cookie not sent**  
The axios client must be configured with `withCredentials: true`. Check `frontend/lib/api.ts`.

---

## User Roles

| Role | Access |
|---|---|
| `patient` | Symptom intake, appointment booking, prescriptions, surgery bookings |
| `doctor` | View/manage appointments, write prescriptions, schedule follow-ups, manage availability |
| `admin` | All of the above + doctor verification, intake matching, hospital/package CRUD, dashboard |

---

## Implementation Phases

| Phase | Feature |
|---|---|
| 0 | Skeleton & environment |
| 1 | Auth (JWT cookies, email verify, password reset) |
| 2 | Patient profile |
| 3 | Doctor onboarding (invite → signup → admin verify) |
| 4 | Doctor availability + public directory |
| 5 | Symptom intake + admin matching |
| 6 | Appointment booking + dummy payment |
| 7 | Prescriptions (PDF, nested medicines/tests, 24h edit) |
| 8 | Follow-up consultations |
| 9 | Hospitals + surgery packages (public) |
| 10 | Surgery booking wizard (travel docs, voucher PDF + QR) |
| 11 | Admin custom panel (KPI dashboard, audit log) |
| 12 | Polish & pre-handover |
