# Running MediBridge Locally

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL 8.0+ (running)
- pip, npm

---

## Terminal 1 — Backend (Django)

### Step 1: Open a terminal and go to the backend directory

```bash
cd "c:\Local Disk-D\MediBridge\backend"
```

### Step 2: Activate the virtual environment

**Windows:**
```bash
.venv\Scripts\activate
```

**macOS / Linux:**
```bash
source .venv/bin/activate
```

You should see `(.venv)` appear at the start of your terminal prompt.

### Step 3: (First time only) Install dependencies

```bash
pip install -r requirements.txt
```

### Step 4: (First time only) Set up the database

Create the MySQL database:
```bash
mysql -u root -p -e "CREATE DATABASE medibridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Run migrations:
```bash
python manage.py migrate
```

Create an admin user:
```bash
python manage.py shell -c "
from apps.accounts.models import User
User.objects.create_superuser('admin@medibridge.local', 'changeme123!', role='admin', is_email_verified=True)
"
```

### Step 5: Start the backend server

```bash
python manage.py runserver
```

Backend is now running at: `http://localhost:8000`  
Swagger API docs: `http://localhost:8000/api/v1/schema/swagger/`

> Keep this terminal open and running.

---

## Terminal 2 — Frontend (Next.js)

### Step 1: Open a NEW terminal and go to the frontend directory

```bash
cd "c:\Local Disk-D\MediBridge\frontend"
```

### Step 2: (First time only) Install dependencies

```bash
npm install
```

### Step 3: Start the frontend dev server

```bash
npm run dev
```

Frontend is now running at: `http://localhost:3000`

> Keep this terminal open and running.

---

## Environment Files (First Time Setup)

### Backend — `backend/.env`

Copy the example file and fill in your values:
```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set:
```env
DJANGO_SECRET_KEY=your-secret-key-here
DB_NAME=medibridge
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_HOST=127.0.0.1
DB_PORT=3306
SITE_FRONTEND_URL=http://localhost:3000
```

### Frontend — `frontend/.env.local`

Copy the example file:
```bash
cp frontend/.env.local.example frontend/.env.local
```

Open `frontend/.env.local` and set:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Quick Summary

| Step | Terminal | Command |
|------|----------|---------|
| 1 | Terminal 1 | `cd "c:\Local Disk-D\MediBridge\backend"` |
| 2 | Terminal 1 | `.venv\Scripts\activate` |
| 3 | Terminal 1 | `python manage.py runserver` |
| 4 | Terminal 2 | `cd "c:\Local Disk-D\MediBridge\frontend"` |
| 5 | Terminal 2 | `npm run dev` |

---

## URLs at a Glance

| Service | URL |
|---------|-----|
| Frontend (app) | http://localhost:3000 |
| Backend (API) | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api/v1/schema/swagger/ |
| Django Admin | http://localhost:8000/admin/ |

---

## Stopping the Servers

Press `Ctrl + C` in each terminal to stop the server.
