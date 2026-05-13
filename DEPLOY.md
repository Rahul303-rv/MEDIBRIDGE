# MediBridge — Deployment Notes

This document lists everything that must change between the dev environment and a production deployment.

---

## What Works in Dev But Must Change in Prod

### 1. Payments — CRITICAL

The current payment flow uses a dummy endpoint (`/api/v1/dev/dummy-pay`) that generates a fake `DUMMY-xxx` reference. **This must be replaced with Stripe or Razorpay before taking real money.**

- Remove or gate `dev/dummy-pay` behind `DEBUG=True` check (already done — view returns 403 in prod).
- Integrate Stripe Checkout or Razorpay Payment Links.
- Store real `Payment` objects with `transaction_id`, `amount`, `currency`, `status`.
- Wire payment webhooks to confirm appointments and surgery bookings.

### 2. Email — CRITICAL

`EMAIL_BACKEND` defaults to `django.core.mail.backends.console.EmailBackend`. Set in production:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org       # or sendgrid, ses, postmark
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@mg.yourdomain.com
EMAIL_HOST_PASSWORD=your_smtp_password
DEFAULT_FROM_EMAIL=no-reply@yourdomain.com
```

For high volume, replace synchronous `send_email()` with Celery + Redis task queue.

### 3. Media / File Storage — CRITICAL

Documents and images are stored in `backend/media/` on the local filesystem. **This will not work on ephemeral containers (Render, Railway, Fly.io).**

Replace `FileField`/`ImageField` with S3 or GCS via `django-storages`:

```bash
pip install django-storages boto3
```

```python
# settings/prod.py
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
AWS_STORAGE_BUCKET_NAME = "medibridge-media"
AWS_S3_REGION_NAME = "ap-south-1"
```

Keep `travel_docs/` in a **private** bucket. The authenticated document-serving view (`/api/v1/patient/surgery-bookings/{id}/documents/{did}/file`) generates a pre-signed URL instead of streaming.

### 4. Database

Development uses a local MySQL 8 instance. For production:

- Use a managed MySQL service (PlanetScale, AWS RDS, DigitalOcean Managed Databases).
- Do NOT use the default `root` user. Create a dedicated `medibridge` user with limited permissions.
- Enable SSL connections (`OPTIONS: {"ssl": {"ca": "/path/to/ca-cert.pem"}}`).
- Schedule automated daily backups.

### 5. Django Settings

```env
# Must change
DJANGO_SECRET_KEY=<64-char random string — never reuse dev key>
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
JWT_COOKIE_SECURE=True          # httpOnly cookies over HTTPS only
JWT_COOKIE_SAMESITE=Strict      # tighter than Lax in prod

# Add
DJANGO_SETTINGS_MODULE=medibridge.settings.prod
```

Run `python manage.py check --deploy` and fix all warnings before going live.

### 6. CORS

Update `CORS_ALLOWED_ORIGINS` in `settings/prod.py` to your exact production frontend URL.

### 7. Static Files

Run `python manage.py collectstatic` and serve `staticfiles/` via Nginx or Whitenoise:

```bash
pip install whitenoise
```

```python
# settings/prod.py
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
```

### 8. HTTPS / TLS

All traffic must be HTTPS. Options:
- **Nginx reverse proxy** with Let's Encrypt (Certbot).
- **Caddy** (auto-TLS, simpler config).
- Platform-managed TLS (Render, Railway, Fly.io).

### 9. Gunicorn / WSGI

Replace `manage.py runserver` (dev-only) with Gunicorn:

```bash
pip install gunicorn
gunicorn medibridge.wsgi:application --workers 2 --bind 0.0.0.0:8000
```

### 10. Video Calls

Currently uses external Jitsi Meet links (`https://meet.jit.si/medibridge-{token}`). For better reliability and branding in production:

- Self-host a Jitsi instance, or
- Replace with Daily.co, Twilio Video, or Zoom SDK.

### 11. Frontend

```bash
cd frontend
npm run build
npm start          # or deploy the .next/ output to Vercel / Netlify / self-hosted
```

Set production environment variables:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## Deployment Platforms (Recommended)

| Component | Platform | Notes |
|---|---|---|
| Backend | Render Web Service / Railway / Fly.io | Set all env vars in dashboard |
| Frontend | Vercel | Auto-deploys from Git |
| Database | PlanetScale / RDS MySQL | Enable automated backups |
| Media | AWS S3 | Private bucket for travel docs |
| Email | Mailgun / SendGrid / AWS SES | Verify domain SPF/DKIM |
| Background jobs | Railway Redis + Celery worker | For async email in Phase 2 |

---

## Pre-Launch Checklist

- [ ] `DEBUG=False` in production
- [ ] `DJANGO_SECRET_KEY` rotated (never expose dev key)
- [ ] Real SMTP configured and tested
- [ ] S3 bucket created and `django-storages` configured
- [ ] Managed database provisioned with daily backups
- [ ] HTTPS enabled; HTTP redirects to HTTPS
- [ ] `python manage.py check --deploy` passes with no warnings
- [ ] Stripe/Razorpay integrated and tested in sandbox mode
- [ ] CORS locked to production domain only
- [ ] `JWT_COOKIE_SECURE=True`
- [ ] Admin user created with strong password
- [ ] `travel_docs/` bucket set to private (no public ACL)
- [ ] Sentry (or similar) configured for error tracking
- [ ] Load test with k6 or Locust before launch

---

## Known MVP Limitations (Documented, Non-blocking)

| Limitation | Phase | Notes |
|---|---|---|
| Dummy payments | 1 | Must replace with Stripe/Razorpay |
| External Jitsi links | — | No embedded video; requires separate call setup |
| Synchronous email | 1 | Move to Celery for reliability at scale |
| Local file storage | 10 | Travel docs must move to S3 before production |
| No rate limiting | — | Add `django-ratelimit` or API gateway throttling |
| No audit log for patient actions | 11 | Currently only admin/doctor actions are logged |
| No two-factor auth | — | Consider TOTP for admin accounts |
| PDFs generated synchronously | 7, 10 | Move PDF generation to Celery task for large load |
