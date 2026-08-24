# Aegis Care — Healthcare Appointment & Follow-up Manager

> Production-ready, multi-portal healthcare platform featuring concurrency-safe booking, AI-powered pre/post-visit clinical intelligence (Google Gemini 2.5 Flash), automated follow-up reminders, and operational conflict resolution.

---

## 🚀 Quick Start (Zero-Configuration Demo)

The project includes pre-seeded demo accounts and zero-config fallbacks for instant evaluation.

```bash
# 1. Navigate to project folder
cd src/appointment-manager

# 2. Install dependencies
npm install

# 3. Setup database & seed rich data (5 doctors, 3 patients, 8 past/upcoming visits)
npx prisma db push --force-reset
npx prisma db seed

# 4. Start local development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Pre-Seeded Demo Accounts

You can click any **"1-Click Demo Sign In"** button on the homepage or login page, or manually log in with:

| Portal | Role | Email | Password | Access URL |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | `PATIENT` | `patient@clinic.com` | `patient123` | [`/patient`](http://localhost:3000/patient) |
| **Doctor** | `DOCTOR` | `doctor@clinic.com` | `doctor123` | [`/doctor`](http://localhost:3000/doctor) |
| **Admin** | `ADMIN` | `admin@clinic.com` | `admin123` | [`/admin`](http://localhost:3000/admin) |

*(Additional doctors seeded: `james.wilson@clinic.com` (Dermatology), `priya.sharma@clinic.com` (Pediatrics), `michael.brown@clinic.com` (Orthopedics), `emily.davis@clinic.com` (General Practice) — all password `doctor123`)*.

---

## ⚙️ Environment Variables (`.env`)

Copy `.env.example` to `.env`. All services have cost-free local fallbacks:

```env
# Authentication (NextAuth.js v5)
AUTH_SECRET=secret_super_secure_healthcare_key_12345
NEXTAUTH_URL=http://localhost:3000

# Google Gemini API (Free at https://aistudio.google.com/apikey)
# Note: Built-in graceful fallbacks ensure the app works even without an API key!
GEMINI_API_KEY=your_gemini_api_key_here

# Cron API Security Header
CRON_SECRET=healthcare_cron_secret_key_2026

# Email Delivery (Defaults to Ethereal free test SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
EMAIL_USER=test@ethereal.email
EMAIL_PASS=testpass

# Google Calendar Integration (Mocked by default; set to true for live GCP OAuth)
USE_GOOGLE_CALENDAR=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

---

## 🩺 System Architecture & Portals

### 1. Patient Portal (`/patient`)
* **Discovery & Search**: Real-time doctor search by name and specialty filter pills.
* **Discrete Slot Engine**: Generates interactive time chips computed from doctor shift hours, slot duration, and leave records.
* **Signature Slot Hold**: 5-minute countdown toast ensuring safe symptom intake before finalizing.
* **Caring Intake & AI Triage**: Converts patient descriptions into clinical chief complaints and calculates urgency.
* **Post-Visit Hub**: Displays plain-language doctor summaries, parsed medication schedules, and follow-up checklists.

### 2. Doctor Portal (`/doctor`)
* **Clinical Density (Linear/Superhuman aesthetic)**: Scannable 10-second dashboard showing mono timestamps, patient identity, and dual-channel urgency indicators (`Low`, `Medium`, `High`).
* **AI Pre-Visit Briefing**: Surfaced prominently at the top of consultations with 3 AI-suggested diagnostic probing questions.
* **Clinical Notes & Prescription Signing**: Ingests unstructured notes and invokes Gemini to structure patient summaries, drug dosages/frequencies, and follow-up steps.

### 3. Admin Portal (`/admin`)
* **Operations Overview**: Real-time metrics on registered practitioners, patients, and appointment volume.
* **Doctor Onboarding**: Configure weekly working hours JSON, custom slot durations (15–120 min), and medical specialties.
* **Leave Management & Real-Time Conflict Engine**: Select a doctor and date to immediately see scheduled bookings. Confirming a leave automatically cancels conflicting visits and sends reschedule alerts to patients.

---

## 🤖 LLM Implementation & Failure Handling

We use **Google Gemini 2.5 Flash** (`@google/genai`) with structured `responseSchema` JSON outputs:

### 1. Pre-Visit Triage Summary
* **Prompt**: `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: <symptoms>`
* **System Prompt**: Enforces clinical triage criteria (e.g., chest pain / acute dyspnea $\rightarrow$ High / Urgent; routine checkups $\rightarrow$ Low) and detects red-flag emergencies (`isEmergency: true`).

### 2. Post-Visit Patient Translation (Abridge Pattern)
* **Prompt**: `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: <notes>`
* **Structured Output**: Extracts `patientFriendlySummary`, structured `medicationSchedule` (`medicationName`, `dosage`, `frequency`, `duration`, `instructions`, `warnings`), and `followUpSteps`.

### 3. Graceful Resilience Strategy
All LLM invocations run inside defensive `try/catch` boundaries with pre-defined safe fallbacks. If the API key is missing, rate-limited, or Google AI is unreachable, the booking and consultation transactions still succeed atomically with fallback triage data (`Urgency: Medium`).

---

## 📡 API Reference

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/register` | `POST` | Public | Registers a new patient with Zod validation. |
| `/api/doctors` | `GET` | Public | Search practitioners by name and specialty. |
| `/api/doctors/[id]/slots` | `GET` | Public | Returns available discrete time slots for a specific date. |
| `/api/appointments` | `GET` | Authenticated | Retrieves paginated user appointments filtered by RBAC. |
| `/api/appointments` | `POST` | Patient | Atomic booking with conflict checks, AI triage, and email. |
| `/api/appointments/[id]` | `GET` | Patient/Doctor | Retrieves full appointment details with AI summaries. |
| `/api/appointments/[id]` | `PATCH` | Patient/Doctor | Cancels booking or submits post-visit clinical notes. |
| `/api/admin/leaves/conflicts`| `GET` | Admin | Checks conflicting bookings for a doctor on a given date. |
| `/api/cron/reminders` | `GET` | Cron Secret | 24-hour pre-visit email reminder job. |
| `/api/cron/medication` | `GET` | Cron Secret | Daily medication schedule reminder blast. |

---

## 📅 Google Calendar OAuth 2.0 Integration Guide

To connect live Google Calendar synchronization:
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2. Enable the **Google Calendar API** under *APIs & Services*.
3. Configure the **OAuth Consent Screen** (User type: External) and add the scope: `https://www.googleapis.com/auth/calendar`.
4. Create **OAuth 2.0 Client IDs** (Application type: Web application).
5. Generate a refresh token via Google OAuth 2.0 Playground.
6. Set in `.env`: `USE_GOOGLE_CALENDAR=true`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN`.

---

## 📐 System Design Write-Up

### 1. Concurrency Control & Double-Booking Prevention
In high-throughput healthcare scheduling, simultaneous booking attempts on identical doctor slots represent a classic race condition. Aegis Care resolves this using **atomic database transactions** via `prisma.$transaction`. 

When a booking request arrives:
1. The transaction acquires an isolation lock on the schedule partition for the designated `doctorId`.
2. It executes an overlapping interval predicate:
   $$\text{existing.startTime} < \text{requested.endTime} \quad \land \quad \text{existing.endTime} > \text{requested.startTime}$$
   filtering for active (`BOOKED`) records.
3. Concurrently, it verifies that no active `Leave` record exists for the doctor on that date.
4. If either condition fails, the transaction rolls back with a descriptive HTTP 400 error. If valid, the appointment is committed atomically before the lock releases, guaranteeing zero double-bookings.

### 2. Doctor Leave Conflict Management & Cascading Actions
When medical practitioners request urgent leave, clinics must resolve scheduling conflicts without manual administrative overhead. 

The Admin Leave engine implements a two-stage pattern:
* **Real-time Conflict Pre-flight**: The `/api/admin/leaves/conflicts` endpoint evaluates scheduled visits for the doctor and target date, immediately rendering a prominent warning strip detailing impacted patients.
* **Atomic Cascade Execution**: Upon submission, a transaction persists the `Leave` record and transitions all overlapping appointments to `CANCELLED`.
* **Asynchronous Notification Fan-Out**: Rather than blocking the database thread, the system initiates asynchronous email dispatch routines notifying each affected patient with cancellation details and direct rebooking links.

### 3. Slot Generation & Temporary Reservation Hold
To prevent slot hoarders and cart-abandonment deadlocks without complex distributed locks (e.g. Redis Redlock), Aegis Care uses a lightweight hybrid approach:
* Discrete slots are computed on the fly from the doctor's weekly working hours JSON, interval durations, and active leaves.
* When a patient chooses a slot, a 5-minute client-side hold timer initiates with an animated floating status toast. If the patient abandons the intake step or the timer expires, the form state resets and prompts the patient to select a fresh slot, ensuring high availability for other users.

### 4. Notification Reliability & Failure Resilience
Clinical communication (visit confirmations, 24-hour reminders, and daily medication alerts) requires fault isolation so third-party outages never break core clinical workflows:
* **Decoupled Execution**: All email and calendar dispatches execute non-blockingly after the primary database commit.
* **Cron Authorization**: Scheduled jobs (`/api/cron/reminders` and `/api/cron/medication`) enforce `x-cron-secret` header authentication to protect against unauthenticated trigger spam.
* **LLM Circuit Breaking**: AI summarization is wrapped in strict try/catch blocks with semantic fallback schemas, ensuring clinical records and appointments are always preserved even during AI provider outages.
