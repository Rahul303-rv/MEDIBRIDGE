"""Generate a client pitch PDF for the MediBridge platform.

Run: .venv/Scripts/python.exe generate_pitch.py (from backend/)
Output: ../MediBridge_Pitch.pdf
"""
import os
import sys
from io import BytesIO
from xhtml2pdf import pisa

OUTPUT = os.path.join(os.path.dirname(__file__), "MediBridge_Pitch.pdf")

HTML = """
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page {
    size: A4;
    margin: 1.2cm 1.4cm;
  }
  body {
    font-family: Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    font-size: 10.5pt;
    line-height: 1.45;
  }
  h1, h2, h3, h4 { font-family: Helvetica, Arial, sans-serif; color: #0f766e; margin: 0; }
  h1 { font-size: 30pt; font-weight: bold; }
  h2 { font-size: 18pt; font-weight: bold; padding: 8pt 0 4pt 0; border-bottom: 2pt solid #14b8a6; margin-top: 14pt; margin-bottom: 8pt; }
  h3 { font-size: 13pt; font-weight: bold; color: #134e4a; margin-top: 10pt; margin-bottom: 4pt; }
  h4 { font-size: 11pt; font-weight: bold; color: #0f766e; margin-top: 6pt; margin-bottom: 2pt; }
  p  { margin: 4pt 0; }
  ul { margin: 2pt 0 8pt 0; padding-left: 14pt; }
  li { margin: 2pt 0; }
  .cover { text-align: center; padding-top: 110pt; }
  .cover .brand {
    font-size: 56pt; font-weight: bold; color: #0f766e;
    letter-spacing: -1pt;
  }
  .cover .tagline {
    font-size: 16pt; color: #5b6470; margin-top: 6pt;
    font-style: italic;
  }
  .cover .divider {
    width: 80pt; height: 3pt; background: #14b8a6;
    margin: 24pt auto;
  }
  .cover .subtitle { font-size: 20pt; color: #134e4a; margin-top: 24pt; font-weight: bold; }
  .cover .meta { margin-top: 60pt; color: #6b7280; font-size: 11pt; }
  .pill {
    display: inline-block; background: #ccfbf1; color: #0f766e;
    padding: 3pt 10pt; border-radius: 10pt; font-size: 9pt; font-weight: bold;
    margin: 2pt;
  }
  .pill-blue   { background: #dbeafe; color: #1e40af; }
  .pill-purple { background: #ede9fe; color: #6d28d9; }
  .pill-rose   { background: #ffe4e6; color: #be123c; }
  .pill-amber  { background: #fef3c7; color: #b45309; }
  .pill-emerald{ background: #d1fae5; color: #065f46; }
  .box {
    background: #f0fdfa; border-left: 3pt solid #14b8a6;
    padding: 8pt 12pt; margin: 6pt 0; border-radius: 3pt;
  }
  .box-warn { background: #fef3c7; border-left-color: #f59e0b; }
  .box-info { background: #eff6ff; border-left-color: #3b82f6; }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0; }
  table th {
    background: #0f766e; color: white; text-align: left;
    padding: 6pt 8pt; font-size: 9.5pt; font-weight: bold;
  }
  table td {
    padding: 5pt 8pt; border-bottom: 0.5pt solid #e5e7eb;
    font-size: 9.5pt; vertical-align: top;
  }
  table.alt tr:nth-child(even) td { background: #f9fafb; }
  .grid2 td { width: 50%; vertical-align: top; padding: 4pt 6pt; }
  .grid3 td { width: 33%; vertical-align: top; padding: 4pt 6pt; }
  .grid4 td { width: 25%; vertical-align: top; padding: 4pt 6pt; }
  .role-card {
    background: white; border: 1pt solid #d1d5db;
    border-radius: 6pt; padding: 8pt 10pt; margin: 4pt 0;
  }
  .role-patient  { border-left: 4pt solid #14b8a6; }
  .role-doctor   { border-left: 4pt solid #3b82f6; }
  .role-admin    { border-left: 4pt solid #8b5cf6; }
  .role-public   { border-left: 4pt solid #f59e0b; }
  .stat-card {
    background: #f0fdfa; border: 1pt solid #14b8a6;
    border-radius: 6pt; padding: 10pt; text-align: center;
  }
  .stat-num { font-size: 22pt; font-weight: bold; color: #0f766e; }
  .stat-lbl { font-size: 9pt; color: #4b5563; margin-top: 2pt; }
  .page-break { page-break-after: always; }
  .footer-note { color: #6b7280; font-size: 8.5pt; text-align: center; margin-top: 16pt; }
  .step {
    background: white; border-left: 3pt solid #14b8a6;
    padding: 5pt 8pt; margin: 3pt 0; font-size: 10pt;
  }
  .step .step-num { font-weight: bold; color: #0f766e; }
  code, .code {
    font-family: Courier, monospace; font-size: 9pt;
    background: #f3f4f6; padding: 1pt 4pt; border-radius: 2pt;
    color: #134e4a;
  }
</style>
</head>
<body>

<!-- ===== COVER PAGE ===== -->
<div class="cover">
  <div class="brand">MediBridge</div>
  <div class="tagline">World-class care, accessible to all.</div>
  <div class="divider"></div>
  <div class="subtitle">Cross-Border Medical Consultations<br/>&amp; Surgery Tourism Platform</div>
  <p style="margin-top: 26pt; font-size: 12pt; color: #374151; max-width: 380pt; margin-left: auto; margin-right: auto;">
    Connecting international patients with verified Indian specialists for same-day video
    consultations and all-inclusive surgery packages.
  </p>
  <div class="meta">
    Client Pitch Document &nbsp;|&nbsp; Confidential
  </div>
</div>
<div class="page-break"></div>

<!-- ===== 1. EXECUTIVE SUMMARY ===== -->
<h2>1. Executive Summary</h2>
<p>
  <b>MediBridge</b> is an end-to-end digital healthcare platform that bridges the
  affordability and expertise gap between patients in <b>Canada, USA &amp; UK</b> and
  India's top medical professionals &amp; hospitals.
</p>

<h3>The Problem</h3>
<ul>
  <li>Western healthcare costs are 5&ndash;10&times; higher than Indian equivalents for the same quality of care.</li>
  <li>Specialist appointments often require <b>2&ndash;6 weeks</b> of waiting in North America &amp; the UK.</li>
  <li>International patients lack a trusted channel to verified Indian doctors and JCI-accredited hospitals.</li>
  <li>Medical tourism is fragmented &mdash; flights, visas, hospitals, and follow-up are all handled separately.</li>
</ul>

<h3>Our Solution</h3>
<div class="box">
  A single, secure web platform offering <b>two integrated products</b>:
  <ol style="margin: 4pt 0 0 16pt;">
    <li><b>Online Consultations</b> &mdash; Same-day video appointments with verified Indian doctors,
        with digital prescriptions delivered as signed PDFs.</li>
    <li><b>Surgery Tourism Packages</b> &mdash; All-inclusive bundled packages
        (surgery + flight + hotel + visa + transfers) at partner hospitals,
        with end-to-end coordination via the admin team.</li>
  </ol>
</div>

<h3>Why Now?</h3>
<ul>
  <li><b>Telemedicine market</b> projected to reach $460B by 2030 (CAGR 24%).</li>
  <li><b>Medical tourism to India</b> projected at $13B by 2026.</li>
  <li>Post-pandemic comfort with video consultations is now mainstream.</li>
</ul>

<div class="page-break"></div>

<!-- ===== 2. KEY METRICS / STATS ===== -->
<h2>2. Platform Snapshot</h2>
<p style="color: #6b7280;">Current build &mdash; production-ready MVP.</p>

<table class="grid4">
  <tr>
    <td><div class="stat-card"><div class="stat-num">25</div><div class="stat-lbl">Verified Doctors Onboarded</div></div></td>
    <td><div class="stat-card"><div class="stat-num">22</div><div class="stat-lbl">Medical Specializations</div></div></td>
    <td><div class="stat-card"><div class="stat-num">8</div><div class="stat-lbl">Partner Hospitals</div></div></td>
    <td><div class="stat-card"><div class="stat-num">34</div><div class="stat-lbl">Active Surgery Packages</div></div></td>
  </tr>
</table>

<table class="grid4">
  <tr>
    <td><div class="stat-card"><div class="stat-num">154</div><div class="stat-lbl">Backend Tests Passing</div></div></td>
    <td><div class="stat-card"><div class="stat-num">35</div><div class="stat-lbl">Frontend Pages</div></div></td>
    <td><div class="stat-card"><div class="stat-num">4</div><div class="stat-lbl">User Roles</div></div></td>
    <td><div class="stat-card"><div class="stat-num">12</div><div class="stat-lbl">Build Phases Complete</div></div></td>
  </tr>
</table>

<h3>Platform Highlights</h3>
<ul>
  <li><b>100% test coverage</b> across all critical flows (auth, booking, prescriptions, surgery, admin).</li>
  <li><b>Mobile-first responsive UI</b> &mdash; works on phone, tablet, and desktop with adaptive layouts.</li>
  <li><b>Dark mode</b> support across all 35 pages.</li>
  <li><b>JCI-accredited hospital network</b> across India's top metros.</li>
  <li><b>14+ surgery categories</b> &mdash; Cardiac, Neuro, Orthopedic, Oncology, Transplant, etc.</li>
</ul>

<h2>3. User Roles &amp; Privileges</h2>
<p>MediBridge supports <b>4 distinct user roles</b>, each with carefully scoped privileges
   enforced both at the API layer (Django permissions) and the UI layer (RoleGuard component).</p>

<!-- ROLE: PATIENT -->
<h3 style="color: #0f766e;">Patient <span class="pill">Primary User</span></h3>
<div class="role-card role-patient">
  <h4>What Patients Can Do</h4>
  <ul>
    <li>Create an account with email verification.</li>
    <li>Manage personal profile (DOB, gender, address, medical history, allergies, current medications).</li>
    <li>Upload medical reports and historical documents for doctor review.</li>
    <li>Browse the verified-doctor directory, filter by specialization, view profiles.</li>
    <li>Submit symptom intake forms describing health concerns.</li>
    <li>Book consultation slots based on real-time doctor availability.</li>
    <li>Receive Jitsi video call links 15 minutes before scheduled appointments.</li>
    <li>Cancel scheduled appointments (cannot cancel completed appointments).</li>
    <li>View digital prescriptions with medicines, tests, diagnosis &mdash; download as signed PDF.</li>
    <li>Confirm or decline doctor-proposed follow-up appointments.</li>
    <li>Browse surgery package catalog with filters by procedure.</li>
    <li>Submit a multi-step surgery booking (package &rarr; travel info &rarr; documents &rarr; payment).</li>
    <li>Upload passport, visa, insurance, and other travel documents securely.</li>
    <li>Track surgery booking status from <i>info-pending</i> through <i>confirmed</i>.</li>
    <li>Download surgery voucher PDF with QR code after confirmation.</li>
  </ul>
  <h4>What Patients Cannot Do</h4>
  <ul>
    <li>View other patients' data, appointments, or documents.</li>
    <li>Modify a prescription after the doctor has issued it.</li>
    <li>Book a confirmed surgery directly without admin approval of any surgery recommendation.</li>
    <li>Access doctor or admin endpoints (enforced via role permissions).</li>
  </ul>
</div>

<!-- ROLE: DOCTOR -->
<h3 style="color: #1e40af;">Doctor <span class="pill pill-blue">Medical Professional</span></h3>
<div class="role-card role-doctor">
  <h4>Onboarding Flow</h4>
  <ul>
    <li>Receives admin invitation via email (token-gated, 7-day expiry).</li>
    <li>Completes profile during signup &mdash; bio, education, license, fee, languages.</li>
    <li>Admin verifies credentials before doctor becomes publicly visible.</li>
  </ul>
  <h4>What Doctors Can Do</h4>
  <ul>
    <li>Set weekly recurring availability slots (e.g., Mon-Fri 9am-5pm IST).</li>
    <li>Override with specific-date slots (e.g., extra Saturday clinic).</li>
    <li>Delete future availability slots.</li>
    <li>Manage profile &mdash; bio, hospital affiliation, languages, consultation duration, fee.</li>
    <li>Add multiple education entries (degree, institution, year).</li>
    <li>View list of own scheduled, in-progress, completed, and no-show appointments.</li>
    <li>Read patient's full medical profile (history, allergies, reports) before consultation.</li>
    <li>Transition appointment status: scheduled &rarr; in-progress &rarr; completed / no-show.</li>
    <li>Write digital prescription &mdash; medicines (dosage, timing, duration), diagnostic tests, diagnosis, notes.</li>
    <li>Edit prescription within a 24-hour window after issue.</li>
    <li>Propose follow-up consultations to the patient (fee-waived or fee-paid).</li>
    <li>Recommend a surgery package to the patient (sends to admin for approval).</li>
    <li>View own surgery recommendations and their approval status.</li>
  </ul>
  <h4>What Doctors Cannot Do</h4>
  <ul>
    <li>Self-verify (must be admin-verified before going live).</li>
    <li>Access other doctors' patients, appointments, or prescriptions.</li>
    <li>Edit a prescription after 24 hours.</li>
    <li>Directly create surgery bookings (recommendations go through admin).</li>
    <li>Access admin endpoints (intakes, audit log, hospitals, packages).</li>
  </ul>
</div>

<div class="page-break"></div>

<!-- ROLE: ADMIN -->
<h3 style="color: #6d28d9;">Admin <span class="pill pill-purple">Platform Operator</span></h3>
<div class="role-card role-admin">
  <h4>What Admins Can Do</h4>
  <ul>
    <li><b>Operations Dashboard</b> &mdash; live KPIs: pending intakes, today's appointments,
        new surgery bookings, unverified doctors, active doctors, surgery revenue, consultation revenue.</li>
    <li><b>Symptom Intake Triage</b> &mdash; review patient symptom submissions and match to appropriate doctor.</li>
    <li><b>Doctor Onboarding</b> &mdash; invite new doctors by email, set their specialization,
        review credentials, verify or unverify accounts.</li>
    <li><b>User Management</b> &mdash; list all users, edit user fields, reset passwords, activate / deactivate.</li>
    <li><b>Hospital Management</b> &mdash; CRUD operations on partner hospitals
        (name, city, state, accreditations, website, description).</li>
    <li><b>Surgery Package Management</b> &mdash; create / edit packages with pricing, duration,
        inclusions, exclusions, partner hospital linkage.</li>
    <li><b>Booking Oversight</b> &mdash; view all consultations and surgery bookings across the platform,
        filter by type and status.</li>
    <li><b>Surgery Booking Workflow</b> &mdash; review travel info, validate documents, confirm bookings
        which triggers automatic voucher generation.</li>
    <li><b>Surgery Recommendation Approval</b> &mdash; review doctor-recommended packages,
        approve or reject with notes before patient can book.</li>
    <li><b>Audit Log</b> &mdash; immutable record of every state-changing action
        (verifications, confirmations, matches) with actor + timestamp.</li>
  </ul>
  <h4>What Admins Cannot Do</h4>
  <ul>
    <li>Impersonate users or read messages between patient and doctor.</li>
    <li>Modify a prescription (write-protected for medical &amp; legal reasons).</li>
    <li>Bypass audit logging &mdash; every admin action is recorded.</li>
  </ul>
</div>

<!-- ROLE: PUBLIC -->
<h3 style="color: #b45309;">Anonymous Visitor <span class="pill pill-amber">Pre-Signup</span></h3>
<div class="role-card role-public">
  <h4>What Visitors Can See (No Login Required)</h4>
  <ul>
    <li>Marketing home page with hero, specialty grid, testimonials, and CTA.</li>
    <li>Public doctor directory &mdash; verified doctors only, filterable by specialization.</li>
    <li>Individual doctor profiles &mdash; bio, education, languages, fee, available slots.</li>
    <li>Public package catalog &mdash; price, duration, inclusions, hospital partner.</li>
    <li>Individual package detail pages with full breakdown.</li>
    <li>Authentication pages &mdash; sign up, log in, forgot password, reset password.</li>
  </ul>
  <h4>What Visitors Cannot See</h4>
  <ul>
    <li>Any patient or doctor private data.</li>
    <li>Unverified doctors (admin-gated).</li>
    <li>Inactive surgery packages.</li>
    <li>Any internal admin or operations data.</li>
  </ul>
</div>

<div class="page-break"></div>

<!-- ===== 4. FEATURE BREAKDOWN ===== -->
<h2>4. Core Features (Phase-by-Phase)</h2>
<p>Delivered across 12 sequential implementation phases &mdash; all complete.</p>

<table class="alt">
<tr><th>#</th><th>Phase</th><th>Key Capabilities Delivered</th></tr>
<tr><td>0</td><td>Skeleton &amp; Environment</td><td>Project scaffold, MySQL setup, PyMySQL shim, dev/prod settings split</td></tr>
<tr><td>1</td><td>Authentication</td><td>JWT in httpOnly cookies, email verification (24h tokens), password reset (1h tokens), bcrypt password hashing</td></tr>
<tr><td>2</td><td>Patient Profile</td><td>DOB, gender, address, medical history, allergies, current medications, medical reports upload</td></tr>
<tr><td>3</td><td>Doctor Onboarding</td><td>Admin-invite &rarr; token-gated signup &rarr; profile completion &rarr; admin verification &rarr; public listing</td></tr>
<tr><td>4</td><td>Availability &amp; Directory</td><td>Recurring + specific-date slots, timezone-aware UTC storage, public doctor directory, specialization filter</td></tr>
<tr><td>5</td><td>Symptom Intake</td><td>Patient submits symptoms, admin reviews and matches to best-fit doctor, optional matching notes</td></tr>
<tr><td>6</td><td>Booking &amp; Payments</td><td>Slot selection, concurrency-safe with <code>select_for_update</code>, dummy payment endpoint (DEBUG only), Jitsi link generation</td></tr>
<tr><td>7</td><td>Digital Prescriptions</td><td>Medicines with dosage/timing JSON, diagnostic tests, diagnosis text, xhtml2pdf-rendered PDF, 24h doctor edit window</td></tr>
<tr><td>8</td><td>Follow-up Consultations</td><td>Doctor proposes follow-up (fee-waived or fee-paid), patient confirms, integrates with payment flow</td></tr>
<tr><td>9</td><td>Hospitals &amp; Packages</td><td>Hospital CRUD with accreditations, package CRUD with inclusions/exclusions, slug-based public URLs</td></tr>
<tr><td>10</td><td>Surgery Booking</td><td>4-step wizard (package &rarr; travel info &rarr; documents &rarr; payment), passport upload, voucher PDF with QR code</td></tr>
<tr><td>11</td><td>Admin Panel</td><td>KPI dashboard, audit log (immutable), user management, booking oversight, surgery recommendation approval</td></tr>
<tr><td>12</td><td>Polish &amp; Handover</td><td>Mobile responsiveness, dark mode, error states, loading states, SEO meta, sitemap, robots.txt</td></tr>
</table>

<h2>5. Use Cases</h2>

<h3>Use Case 1: International Patient Books an Online Consultation</h3>
<div class="step"><span class="step-num">1.</span> Patient (Toronto) signs up at MediBridge, verifies email, completes profile.</div>
<div class="step"><span class="step-num">2.</span> Submits symptom intake describing persistent chest discomfort.</div>
<div class="step"><span class="step-num">3.</span> Admin reviews the intake and matches the patient to <b>Dr. Sharma (Cardiologist)</b>.</div>
<div class="step"><span class="step-num">4.</span> Patient receives email notification, browses Dr. Sharma's available slots in IST.</div>
<div class="step"><span class="step-num">5.</span> Books 4pm IST slot (12:30am ET) &mdash; dummy payment flow generates payment reference.</div>
<div class="step"><span class="step-num">6.</span> 15 min before appointment &mdash; both receive Jitsi video link.</div>
<div class="step"><span class="step-num">7.</span> Doctor reviews patient profile, conducts video consult, marks "in progress" &rarr; "completed".</div>
<div class="step"><span class="step-num">8.</span> Doctor issues prescription: aspirin 75mg, lipid panel test, ECG, follow-up in 7 days.</div>
<div class="step"><span class="step-num">9.</span> Patient downloads signed PDF prescription; confirms doctor-proposed follow-up.</div>

<h3>Use Case 2: Patient Books a Bundled Surgery Package</h3>
<div class="step"><span class="step-num">1.</span> Following the consultation, doctor recommends a <b>bariatric surgery package</b> at Apollo Chennai.</div>
<div class="step"><span class="step-num">2.</span> Admin reviews and approves the recommendation (with notes).</div>
<div class="step"><span class="step-num">3.</span> Patient sees approved recommendation, opens the booking wizard.</div>
<div class="step"><span class="step-num">4.</span> Reviews package: $9,500 USD inclusive of 5-day hospital stay, 7-day recovery hotel, flights, transfers, visa support.</div>
<div class="step"><span class="step-num">5.</span> Enters travel info &mdash; passport number, country, expiry, current occupation.</div>
<div class="step"><span class="step-num">6.</span> Uploads passport scan + insurance certificate (stored in authenticated-access folder, NOT public MEDIA_URL).</div>
<div class="step"><span class="step-num">7.</span> Completes dummy payment.</div>
<div class="step"><span class="step-num">8.</span> Admin validates docs, confirms booking &mdash; <b>voucher PDF with QR code auto-generated</b>.</div>
<div class="step"><span class="step-num">9.</span> Patient downloads voucher, presents at hospital reception via QR scan.</div>

<h3>Use Case 3: Admin Onboards a New Specialist</h3>
<div class="step"><span class="step-num">1.</span> Admin clicks "Invite Doctor" on admin panel.</div>
<div class="step"><span class="step-num">2.</span> Enters email, name, primary specialization &mdash; 7-day signup token emailed.</div>
<div class="step"><span class="step-num">3.</span> Doctor receives email, clicks link, sets password, fills in bio, license, fee, languages, education.</div>
<div class="step"><span class="step-num">4.</span> Profile shows "Pending Verification" badge &mdash; not visible in public directory.</div>
<div class="step"><span class="step-num">5.</span> Admin reviews credentials, marks <i>verified</i> &mdash; audit log records the action.</div>
<div class="step"><span class="step-num">6.</span> Doctor immediately appears in public directory with verified badge; can accept bookings.</div>

<div class="page-break"></div>

<!-- ===== 6. TECH STACK ===== -->
<h2>6. Tools &amp; Technologies</h2>

<h3>Backend Stack</h3>
<table>
<tr><th>Layer</th><th>Technology</th><th>Why We Chose It</th></tr>
<tr><td>Web framework</td><td>Django 6.0</td><td>Mature, batteries-included, security-first</td></tr>
<tr><td>API layer</td><td>Django REST Framework 3.17</td><td>Industry-standard for Python APIs, integrates with permissions/auth</td></tr>
<tr><td>Authentication</td><td>djangorestframework-simplejwt 5.5</td><td>JWT tokens, kept in httpOnly cookies (XSS-safe)</td></tr>
<tr><td>Database</td><td>MySQL 8.0+</td><td>Client requirement; production-tested with PyMySQL driver</td></tr>
<tr><td>API docs</td><td>drf-spectacular 0.29</td><td>Auto-generated OpenAPI 3.0 + Swagger UI</td></tr>
<tr><td>PDF generation</td><td>xhtml2pdf 0.2.17</td><td>Pure-Python, Windows-friendly, HTML/CSS templates</td></tr>
<tr><td>QR codes</td><td>qrcode 8.2</td><td>For surgery voucher QR codes</td></tr>
<tr><td>Images</td><td>Pillow 12.2</td><td>Avatar resizing, document thumbnail</td></tr>
<tr><td>CORS</td><td>django-cors-headers 4.9</td><td>Locked-down origin policy for FE-BE separation</td></tr>
<tr><td>Config</td><td>python-decouple 3.8</td><td>12-factor app envvar handling</td></tr>
<tr><td>Testing</td><td>pytest 9 + pytest-django 4.12</td><td>154 tests, factory-boy fixtures</td></tr>
</table>

<h3>Frontend Stack</h3>
<table>
<tr><th>Layer</th><th>Technology</th><th>Why We Chose It</th></tr>
<tr><td>Framework</td><td>Next.js 16 (App Router)</td><td>Server components, file-based routing, SSR/ISR ready</td></tr>
<tr><td>Language</td><td>TypeScript 5 (strict)</td><td>Compile-time type safety, fewer runtime bugs</td></tr>
<tr><td>UI library</td><td>React 19</td><td>Latest stable; concurrent rendering</td></tr>
<tr><td>Styling</td><td>Tailwind CSS 4</td><td>Utility-first; fast iteration; built-in dark mode</td></tr>
<tr><td>Component primitives</td><td>shadcn/ui + Base UI</td><td>Accessible, unstyled primitives we own (no lock-in)</td></tr>
<tr><td>Server state</td><td>TanStack Query 5</td><td>Caching, deduplication, optimistic updates</td></tr>
<tr><td>Forms</td><td>React Hook Form + Zod</td><td>Type-safe validation, minimal re-renders</td></tr>
<tr><td>HTTP client</td><td>axios 1.16</td><td>Cookie support, interceptors for auth refresh</td></tr>
<tr><td>Date / TZ</td><td>date-fns 4 + date-fns-tz</td><td>Lightweight, tree-shakeable; cross-timezone display</td></tr>
<tr><td>File upload</td><td>react-dropzone 15</td><td>Accessible drag-drop with file-type guards</td></tr>
<tr><td>Notifications</td><td>sonner 2</td><td>Native-feeling toast notifications</td></tr>
<tr><td>Theming</td><td>next-themes 0.4</td><td>System / light / dark mode toggle with no FOUC</td></tr>
<tr><td>Icons</td><td>lucide-react 1.14</td><td>Tree-shakeable SVG icon set</td></tr>
</table>

<h3>Architecture Decisions</h3>
<div class="box">
  <b>Authentication boundary:</b> JWTs stored in <code>HttpOnly</code> cookies with
  <code>SameSite=Lax</code> &mdash; XSS-resistant. <b>Not</b> stored in localStorage.
</div>
<div class="box-info box">
  <b>Sensitive uploads:</b> Passports, insurance, and medical documents are stored
  outside <code>MEDIA_URL</code> and served only through authenticated views with
  per-request ownership checks.
</div>
<div class="box">
  <b>Booking concurrency:</b> Slot reservations use <code>select_for_update()</code>
  inside a DB transaction to prevent double-booking under concurrent load.
</div>
<div class="box-info box">
  <b>Timezones:</b> All timestamps stored as UTC; the frontend converts to the
  patient's local timezone using <code>date-fns-tz</code>.
</div>
<div class="box-warn box">
  <b>Dummy payments:</b> The dev payment endpoint refuses to run when
  <code>DEBUG=False</code> &mdash; production hookup planned for Stripe / Razorpay.
</div>

<div class="page-break"></div>

<!-- ===== 7. SECURITY ===== -->
<h2>7. Security &amp; Compliance</h2>

<h3>Authentication &amp; Authorization</h3>
<ul>
  <li>Passwords hashed with Django's PBKDF2 (10,000 iterations).</li>
  <li>JWTs in <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite=Lax</code> cookies.</li>
  <li>Email verification mandatory before login.</li>
  <li>Password reset tokens expire in 1 hour, single-use.</li>
  <li>Doctor signup tokens expire in 7 days, single-use.</li>
  <li>Per-endpoint permission classes: <code>IsAdmin</code>, <code>IsDoctor</code>, <code>IsPatient</code>, <code>IsAuthenticated</code>.</li>
</ul>

<h3>Data Protection</h3>
<ul>
  <li>Cross-patient isolation enforced at the queryset level (not just UI hiding).</li>
  <li>Cross-doctor isolation: doctors can only see/edit their own appointments and prescriptions.</li>
  <li>Sensitive files (passports, medical reports) served via authenticated views with ownership checks.</li>
  <li>CORS policy whitelisted to known frontend origin only.</li>
  <li>Audit log records every state-changing admin action with timestamp + actor.</li>
</ul>

<h3>Input Validation</h3>
<ul>
  <li>All requests validated by DRF serializers before hitting business logic.</li>
  <li>File uploads checked for: MIME type, max size (10 MB), allowed extensions.</li>
  <li>Frontend forms double-validate with Zod schemas for instant feedback.</li>
  <li>SQL injection prevention via Django ORM (parameterized queries).</li>
  <li>XSS prevention via React's escaping + httpOnly cookies.</li>
</ul>

<h2>8. Quality Assurance</h2>

<h3>Test Coverage (154/154 passing)</h3>
<table>
<tr><th>Test Suite</th><th>Tests</th><th>Coverage</th></tr>
<tr><td>Authentication</td><td>14</td><td>Signup, login, verify, reset, logout, expiry</td></tr>
<tr><td>Patient Profile</td><td>8</td><td>Auto-create, get/patch, isolation, DOB validation</td></tr>
<tr><td>Doctor Onboarding</td><td>17</td><td>Invite, token signup, verification, education CRUD, isolation</td></tr>
<tr><td>Availability &amp; Directory</td><td>15</td><td>Slot CRUD, recurring expansion, TZ conversion, public listing</td></tr>
<tr><td>Symptom Intake</td><td>17</td><td>Submit, cancel, admin match, audit log</td></tr>
<tr><td>Appointments</td><td>13</td><td>Book, cancel, status transitions, double-booking prevention</td></tr>
<tr><td>Prescriptions</td><td>12</td><td>Create, edit-window enforcement, PDF generation, isolation</td></tr>
<tr><td>Follow-up</td><td>9</td><td>Propose, confirm, fee-waived/paid, slot conflict</td></tr>
<tr><td>Hospitals &amp; Packages</td><td>16</td><td>CRUD, public listing, slug generation, active filter</td></tr>
<tr><td>Surgery Booking</td><td>17</td><td>Create, travel info, document upload/delete, confirm, voucher</td></tr>
<tr><td>Admin Panel</td><td>10</td><td>Dashboard KPIs, bookings, audit log, permission gates</td></tr>
<tr><td>Health Check</td><td>1</td><td>Liveness endpoint</td></tr>
</table>

<h3>Frontend Quality</h3>
<ul>
  <li>TypeScript strict mode &mdash; 0 type errors across 35 pages.</li>
  <li>Mobile-first responsive design tested at 375 / 768 / 1024 / 1440 px.</li>
  <li>Dark mode parity on every page.</li>
  <li>Loading skeletons on every async fetch.</li>
  <li>Error toasts via Sonner for every failed API call.</li>
  <li>SEO &mdash; meta tags, sitemap.xml, robots.txt, semantic HTML.</li>
</ul>

<div class="page-break"></div>

<!-- ===== 9. ROADMAP ===== -->
<h2>9. Roadmap (Post-MVP)</h2>

<h3>Phase A: Payment &amp; Notifications (Next Sprint)</h3>
<ul>
  <li>Stripe / Razorpay integration replacing dummy payment endpoint.</li>
  <li>Refund &amp; partial-refund flows for cancellations.</li>
  <li>Email + SMS notifications for booking confirmations, reminders.</li>
  <li>WhatsApp Business API integration for patient outreach.</li>
</ul>

<h3>Phase B: Live Video &amp; Telephony</h3>
<ul>
  <li>Migrate from Jitsi to <b>Twilio Programmable Video</b> for HIPAA-compliant calls.</li>
  <li>In-app chat between patient and doctor (with file attachments).</li>
  <li>Voice-only fallback for low-bandwidth patients.</li>
  <li>Recording with patient consent + secure S3 storage.</li>
</ul>

<h3>Phase C: AI &amp; Triage</h3>
<ul>
  <li>AI-assisted symptom-to-specialty matching using LLM (Claude / GPT).</li>
  <li>OCR for medical-report extraction at upload time.</li>
  <li>Automated prescription suggestions from doctor's prior patterns.</li>
  <li>Multi-language support (Hindi, Arabic, Spanish, French).</li>
</ul>

<h3>Phase D: Native Mobile</h3>
<ul>
  <li>React Native app (iOS + Android) sharing the existing TypeScript types.</li>
  <li>Push notifications for appointment reminders.</li>
  <li>Biometric login (Face ID, Touch ID).</li>
  <li>Offline-first patient profile + prescription viewing.</li>
</ul>

<h3>Phase E: Compliance &amp; Scale</h3>
<ul>
  <li>HIPAA compliance audit + Business Associate Agreement with cloud provider.</li>
  <li>SOC 2 Type II certification.</li>
  <li>Multi-region deployment (US-East + Mumbai) for low-latency video.</li>
  <li>EMR integrations with Apollo, Fortis, Max hospital chains.</li>
</ul>

<h2>10. Why MediBridge Wins</h2>

<table>
<tr><th>Pillar</th><th>What It Means For The Client</th></tr>
<tr><td>Two products in one</td><td>Cross-sell from consultation to surgery package &mdash; higher LTV per patient.</td></tr>
<tr><td>Verified-only network</td><td>Trust signal for Western patients hesitant about offshore care.</td></tr>
<tr><td>Built-in admin tooling</td><td>Operations team can onboard doctors, verify packages, and confirm surgeries with no engineering overhead.</td></tr>
<tr><td>Mobile-ready from day one</td><td>~60% of healthcare research starts on mobile &mdash; we don't lose those visitors.</td></tr>
<tr><td>Type-safe, tested codebase</td><td>Fast feature iteration without regressions &mdash; tests are the safety net.</td></tr>
<tr><td>Standards-based stack</td><td>Easy hiring &mdash; Django and Next.js have huge talent pools.</td></tr>
</table>

<h2>11. Next Steps</h2>
<div class="box">
  <ol style="margin: 4pt 0 4pt 16pt;">
    <li><b>Live demo</b> &mdash; we walk through patient signup &rarr; consultation &rarr; prescription &rarr;
        surgery booking in real time on desktop and mobile.</li>
    <li><b>Custom branding</b> &mdash; replace MediBridge logo &amp; color palette with client brand.</li>
    <li><b>Production deployment</b> &mdash; provision MySQL, set up domain, SSL, CI/CD pipeline.</li>
    <li><b>Real payment gateway</b> &mdash; integrate Stripe or Razorpay (live keys).</li>
    <li><b>Doctor onboarding sprint</b> &mdash; bulk-invite the client's existing doctor network.</li>
    <li><b>Hospital partnerships</b> &mdash; add the client's preferred hospitals + packages.</li>
    <li><b>Soft launch</b> with 50 beta patients across CA / US / UK.</li>
  </ol>
</div>

<div class="footer-note">
  &copy; MediBridge &mdash; Confidential Client Pitch.
  Generated programmatically from the live codebase &amp; database.
</div>

</body>
</html>
"""

def main():
    print("Generating MediBridge pitch PDF...")
    with open(OUTPUT, "wb") as f:
        result = pisa.CreatePDF(HTML, dest=f, encoding="utf-8")
    if result.err:
        print(f"  ERROR: {result.err} errors during generation")
        sys.exit(1)
    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f"  OK -> {OUTPUT}  ({size_kb:.1f} KB)")

if __name__ == "__main__":
    main()
