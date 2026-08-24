/**
 * Google Calendar Integration (Mock/Simulated)
 * 
 * This module provides calendar event management. By default, it uses mock
 * stubs that simulate API latency and return fake event IDs.
 * 
 * To enable real Google Calendar integration:
 * 1. Set USE_GOOGLE_CALENDAR=true in .env
 * 2. Install googleapis: npm install googleapis
 * 3. Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 * 4. Replace mock functions with real googleapis calls
 */

const USE_REAL_CALENDAR = process.env.USE_GOOGLE_CALENDAR === 'true'

export interface CalendarEventInput {
  title: string
  description: string
  startTime: Date
  endTime: Date
  patientEmail: string
  doctorEmail: string
}

export async function createCalendarEvent(event: CalendarEventInput): Promise<string> {
  if (USE_REAL_CALENDAR) {
    // TODO: Implement real Google Calendar API integration
    // See README.md for setup instructions
    console.warn('Real Google Calendar not implemented yet. Using mock.')
  }
  
  console.log(`[Calendar Mock] Creating event: ${event.title} for ${event.patientEmail}`)
  await new Promise(resolve => setTimeout(resolve, 200))
  return `mock_gcal_event_${Date.now()}`
}

export async function deleteCalendarEvent(googleEventId: string): Promise<boolean> {
  if (USE_REAL_CALENDAR) {
    console.warn('Real Google Calendar not implemented yet. Using mock.')
  }
  
  console.log(`[Calendar Mock] Deleting event: ${googleEventId}`)
  await new Promise(resolve => setTimeout(resolve, 200))
  return true
}
