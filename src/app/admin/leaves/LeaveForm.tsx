"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Info, UserMinus, WarningCircle } from "@phosphor-icons/react/dist/ssr"
import { api } from "@/lib/api-client"

export function LeaveForm({ doctors, action }: { doctors: any[], action: (formData: FormData) => Promise<void> }) {
  const [doctorId, setDoctorId] = useState("")
  const [date, setDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [conflicts, setConflicts] = useState(0)

  const [conflictDetails, setConflictDetails] = useState<any[]>([])

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setDate(newDate)
    if (doctorId && newDate) {
      setChecking(true)
      try {
        const result = await api.getLeaveConflicts(doctorId, newDate)
        setConflicts(result.count)
        setConflictDetails(result.appointments || [])
      } catch (err) {
        console.error('Failed to check conflicts:', err)
        setConflicts(0)
        setConflictDetails([])
      } finally {
        setChecking(false)
      }
    }
  }

  const handleDoctorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDoctor = e.target.value
    setDoctorId(newDoctor)
    if (newDoctor && date) {
      setChecking(true)
      try {
        const result = await api.getLeaveConflicts(newDoctor, date)
        setConflicts(result.count)
        setConflictDetails(result.appointments || [])
      } catch (err) {
        console.error('Failed to check conflicts:', err)
        setConflicts(0)
        setConflictDetails([])
      } finally {
        setChecking(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await action(formData)
    setLoading(false)
    setDoctorId("")
    setDate("")
    setConflicts(0)
  }

  return (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <UserMinus weight="bold" className="size-5 text-muted-foreground" />
        <h2 className="text-lg font-heading font-medium">Mark Doctor on Leave</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Doctor</label>
            <select 
              required 
              name="doctorId" 
              value={doctorId}
              onChange={handleDoctorChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Select Doctor</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Date</label>
            <input 
              required 
              type="date" 
              name="date" 
              value={date}
              onChange={handleDateChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Reason (Optional)</label>
            <input 
              type="text" 
              name="reason" 
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" 
            />
          </div>
        </div>

        {/* Signature Element: Leave Conflict Warning Strip */}
        {checking ? (
          <div className="text-sm text-muted-foreground animate-pulse flex items-center gap-2 py-2">
            <Info weight="bold" className="size-4" /> Checking for existing bookings...
          </div>
        ) : conflicts > 0 ? (
          <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-md flex items-start gap-3 animate-in fade-in">
            <WarningCircle weight="fill" className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-destructive">Conflict Warning: {conflicts} appointments scheduled</h4>
              <p className="text-sm text-destructive/80 mt-1">
                Marking this leave will automatically cancel these {conflicts} appointments and notify the patients to rebook.
              </p>
              {conflicts > 0 && conflictDetails.length > 0 && (
                <ul className="mt-2 text-sm text-destructive/70 space-y-1">
                  {conflictDetails.map((apt: any) => (
                    <li key={apt.id}>• {apt.patientName} at {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : doctorId && date ? (
          <div className="bg-[#3E9B4F]/10 border-l-4 border-[#3E9B4F] p-4 rounded-r-md flex items-start gap-3 animate-in fade-in">
            <Info weight="fill" className="size-5 text-[#3E9B4F] shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-[#3E9B4F]">No scheduling conflicts found for this date.</p>
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button type="submit" variant={conflicts > 0 ? "destructive" : "default"} disabled={loading}>
            {loading ? "Processing..." : conflicts > 0 ? "Confirm Leave & Cancel Appointments" : "Mark Leave"}
          </Button>
        </div>
      </form>
    </div>
  )
}
