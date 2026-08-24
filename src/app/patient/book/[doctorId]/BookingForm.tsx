"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Clock, Info, Heartbeat } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { api, TimeSlot } from "@/lib/api-client"

export function BookingForm({ doctorId, patientId }: { doctorId: string, patientId: string }) {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes slot hold
  const [isHeld, setIsHeld] = useState(false)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [fetchingSlots, setFetchingSlots] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isHeld && timeLeft > 0 && step < 3) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0 && step < 3) {
      setIsHeld(false)
      setError("Your slot hold has expired. Please select a time again.")
      setStep(2)
    }
    return () => clearInterval(timer)
  }, [isHeld, timeLeft, step])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleHoldSlot = (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time) return
    setIsHeld(true)
    setTimeLeft(300)
    setStep(2)
  }

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const data = { doctorId, patientId, date, time, symptoms }
      await api.bookAppointment(data)

      setStep(3) // Confirmation step
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {/* Slot Hold Toast */}
      {isHeld && step === 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border border-border shadow-lg rounded-full px-5 py-2.5 flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
          <Clock weight="fill" className={timeLeft < 60 ? "text-destructive animate-pulse" : "text-primary"} />
          <span className="text-sm font-medium">Slot held for {formatTime(timeLeft)}</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Progress Bar */}
        {step < 3 && (
          <div className="bg-secondary h-1.5 w-full">
            <div 
              className="bg-primary h-full transition-all duration-300" 
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        )}

        <div className="p-6 sm:p-8">
          {error && step < 3 && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-start gap-3">
              <Info weight="fill" className="size-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* STEP 1: Date & Time */}
          {step === 1 && (
            <form onSubmit={handleHoldSlot} className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-xl font-heading font-medium mb-1">When would you like to visit?</h2>
                <p className="text-muted-foreground text-sm">Select a convenient date and time for your appointment.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date</label>
                  <input 
                    required 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" 
                    value={date} 
                    onChange={async (e) => {
                      const newDate = e.target.value
                      setDate(newDate)
                      setTime("")
                      if (newDate) {
                        setFetchingSlots(true)
                        try {
                          const availableSlots = await api.getAvailableSlots(doctorId, newDate)
                          setSlots(availableSlots)
                        } catch (err) {
                          console.error('Failed to fetch slots:', err)
                          setSlots([])
                        } finally {
                          setFetchingSlots(false)
                        }
                      } else {
                        setSlots([])
                      }
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Time</label>
                  {fetchingSlots ? (
                    <div className="text-sm text-muted-foreground animate-pulse">Loading slots...</div>
                  ) : date && slots.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No slots available for this date.</div>
                  ) : date && slots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setTime(slot.start)}
                          className={`px-3 py-2 text-sm rounded border transition-colors
                            ${!slot.available
                              ? 'bg-muted text-muted-foreground border-border cursor-not-allowed line-through'
                              : time === slot.start
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-foreground border-border hover:border-primary hover:bg-primary/5'
                            }`}
                        >
                          {slot.start}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Please select a date first.</div>
                  )}
                </div>
              </div>
              
              <Button type="submit" className="w-full min-h-[48px] text-base" disabled={!date || !time}>
                Continue
                <ArrowRight weight="bold" className="ml-2" />
              </Button>
            </form>
          )}

          {/* STEP 2: Symptoms */}
          {step === 2 && (
            <form onSubmit={handleBook} className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div>
                <h2 className="text-xl font-heading font-medium mb-1">How can we help you?</h2>
                <p className="text-muted-foreground text-sm">Your doctor will review this before you arrive to ensure the best possible care.</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 text-primary">
                  <Heartbeat weight="fill" className="size-4" />
                  <label className="text-sm font-medium text-foreground">What are you experiencing?</label>
                </div>
                <textarea 
                  required 
                  rows={5} 
                  className="w-full rounded-md border border-input bg-background px-3 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" 
                  placeholder="E.g., I've had a headache for the past 3 days and some mild fever..." 
                  value={symptoms} 
                  onChange={e => setSymptoms(e.target.value)} 
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="min-h-[48px] px-6" onClick={() => setStep(1)} disabled={loading}>
                  Back
                </Button>
                <Button type="submit" className="w-full min-h-[48px] text-base" disabled={loading || !symptoms.trim()}>
                  {loading ? "Confirming..." : "Book Appointment"}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Confirmation */}
          {step === 3 && (
            <div className="text-center space-y-6 py-6 animate-in zoom-in-95 fade-in">
              <div className="size-16 bg-[#3E9B4F]/10 text-[#3E9B4F] rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle weight="fill" className="size-8" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-medium mb-2">Appointment Booked</h2>
                <p className="text-muted-foreground">
                  You're all set to see the doctor on <strong className="text-foreground">{new Date(date).toLocaleDateString()}</strong> at <strong className="text-foreground">{time}</strong>.
                </p>
              </div>

              <div className="bg-secondary p-4 rounded-lg text-left text-sm mt-8">
                <h3 className="font-medium mb-2">What happens next?</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> We've sent a calendar invite to your email.</li>
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Your doctor has received your symptoms and will review them before you arrive.</li>
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> We'll send you a reminder 24 hours before your visit.</li>
                </ul>
              </div>

              <Link href="/patient" className="block pt-4">
                <Button variant="outline" className="w-full min-h-[48px]">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
