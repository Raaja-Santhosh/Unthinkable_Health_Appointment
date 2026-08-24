# Healthcare Appointment Platform - System Design

## 1. Concurrency and Double-Booking Prevention
One of the most critical challenges in appointment scheduling is preventing multiple patients from booking the same slot simultaneously. In our implementation, we use **Database Transactions** to achieve this.

When a patient submits a booking request:
1. The backend starts a transaction (`prisma.$transaction`).
2. We query the `Appointment` table to check if there is any existing `BOOKED` appointment for the requested doctor whose time overlaps with the requested `startTime` and `endTime`.
3. If an overlap is found, the transaction is aborted and an error is returned to the user.
4. Otherwise, the new appointment is inserted in the same atomic transaction.

For systems requiring higher concurrency, a **Slot Hold Mechanism** could be introduced using Redis. When a patient selects a slot and proceeds to fill out the symptom form, the slot is marked as "reserved" in Redis with a TTL (e.g., 5 minutes). This prevents others from even attempting to book it while the form is being filled.

## 2. Doctor Leave Conflict Handling
When a doctor (or admin) marks a specific date as a leave day, the system must handle existing appointments.
Our approach ensures affected patients are seamlessly notified:
1. The admin selects the doctor and date.
2. The system inserts a record into the `Leave` table.
3. In a background task or immediate loop, the system queries all `BOOKED` appointments for that doctor on that date.
4. Each affected appointment's status is updated to `CANCELLED`.
5. An automated email is fired off to the patient informing them of the cancellation.
6. A call is made to the Google Calendar API to delete the event from both the doctor's and patient's calendars.

## 3. Notification Failure Handling
Notifications (Emails, Calendar events) are prone to temporary network failures or API rate limits.
Currently, emails are sent asynchronously after the core booking transaction completes. If sending the email fails, it does not rollback the booking, ensuring the core functionality remains robust.
To improve this for a production environment, we should implement a **Background Job Queue** (e.g., BullMQ, Inngest, or AWS SQS).
- Instead of sending the email directly in the API route, we publish a `SEND_EMAIL` event to the queue.
- A worker process picks up the event and attempts to send it.
- If it fails, the queue automatically retries with exponential backoff (e.g., 1 min, 5 mins, 30 mins) until it succeeds, guaranteeing reliable delivery.

## 4. LLM Integration and Failure Handling
The system uses the Google Gemini API for two major features:
- **Pre-visit**: Summarizes patient symptoms, determines urgency, and suggests doctor questions.
- **Post-visit**: Translates clinical notes into a patient-friendly summary and extracts medication schedules.

**Prompt Quality**: The prompts strictly instruct the LLM to output pure JSON data with specific keys. This ensures predictable parsing in the application layer.

**Failure Handling**: LLM services can experience latency or outages. We handle this gracefully:
- If the pre-visit LLM call fails during booking, the system falls back to default values (Urgency: Medium, chief complaint: "Unknown") rather than failing the booking entirely. The booking transaction succeeds, and a background task could retry the LLM analysis later.
- If the post-visit LLM call fails, the clinical notes are still saved, and the patient summary defaults to a safe fallback message, allowing the doctor to manually retry later.

## 5. Database Schema Design
We use PostgreSQL (or SQLite for local dev) structured relationally:
- **User**: Centralizes identity with role-based access (ADMIN, DOCTOR, PATIENT).
- **DoctorProfile**: Extends User for doctor-specific attributes (specialization, working hours).
- **Appointment**: The core entity linking a patient and a doctor, holding time boundaries and status.
- **PreVisitSummary / PostVisitSummary**: 1-to-1 relationships with the Appointment. Separating these ensures the `Appointment` table remains lightweight, and the bulky text/JSON data is only loaded when necessary.

## 6. Email & Google Calendar Integration
- **Email**: Integrated via `Nodemailer`. Can be hooked up to SendGrid or AWS SES in production.
- **Calendar**: Designed for Google Calendar OAuth 2.0. When an appointment is booked, an event is created. The generated `eventId` is stored in the `Appointment` table so it can be updated or deleted (e.g., on cancellation or leave management).

## 7. API Design & Code Structure
The application is built on Next.js 15 (App Router).
- **Client Components** handle interactive UI (e.g., booking forms) and local state.
- **Server Actions & API Routes** encapsulate core business logic, interacting securely with the database via Prisma.
- Logic is modularized into `lib/` (e.g., `lib/prisma.ts`, `lib/gemini.ts`, `lib/email.ts`) making it easy to test in isolation or swap out providers.
