// Typed API client for frontend components

export interface TimeSlot {
  start: string
  end: string
  available: boolean
}

export interface ConflictResult {
  count: number
  appointments: Array<{
    id: string
    patientName: string
    patientEmail: string
    startTime: string
    endTime: string
  }>
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }
  
  return res.json()
}

export const api = {
  // Slots
  getAvailableSlots: async (doctorId: string, date: string) => {
    const res = await fetchApi<{ slots: TimeSlot[] }>(`/api/doctors/${doctorId}/slots?date=${date}`)
    return res.slots
  },

  // Appointments
  bookAppointment: (data: { doctorId: string; date: string; time: string; symptoms: string }) =>
    fetchApi<any>('/api/appointments', { method: 'POST', body: JSON.stringify(data) }),

  cancelAppointment: (id: string, reason?: string) =>
    fetchApi<any>(`/api/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel', reason }),
    }),

  completeAppointment: (id: string, clinicalNotes: string) =>
    fetchApi<any>(`/api/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'complete', clinicalNotes }),
    }),

  // Admin
  getLeaveConflicts: (doctorId: string, date: string) =>
    fetchApi<ConflictResult>(`/api/admin/leaves/conflicts?doctorId=${doctorId}&date=${date}`),
}
