import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  Heartbeat, 
  CalendarCheck, 
  Clock, 
  User, 
  FileText, 
  Pill, 
  CheckCircle, 
  WarningCircle, 
  XCircle,
  ChatCircleDots
} from "@phosphor-icons/react/dist/ssr"

export default async function PatientAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== 'PATIENT') redirect('/login')

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { 
      doctor: { include: { doctorProfile: true } }, 
      preVisitSummary: true,
      postVisitSummary: true 
    }
  })

  if (!appt || appt.patientId !== session.user.id) {
    redirect('/patient')
  }

  async function cancelAppointment() {
    "use server"
    await prisma.appointment.update({
      where: { id: appt!.id },
      data: { status: "CANCELLED" }
    })
    revalidatePath(`/patient/appointment/${appt!.id}`)
    revalidatePath("/patient")
  }

  const isBooked = appt.status === 'BOOKED'
  const isCompleted = appt.status === 'COMPLETED'
  const isCancelled = appt.status === 'CANCELLED'

  let meds: any[] = []
  let steps: string[] = []
  if (appt.postVisitSummary) {
    try {
      meds = JSON.parse(appt.postVisitSummary.medicationSchedule || "[]")
      steps = JSON.parse(appt.postVisitSummary.followUpSteps || "[]")
    } catch (e) {}
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/patient" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft weight="bold" className="size-4" />
            <span>Back to Patient Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 inline-flex items-center gap-1 text-xs font-mono font-medium rounded ${
              isBooked ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 
              isCompleted ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' : 
              'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {isBooked && <Clock weight="bold" className="size-3" />}
              {isCompleted && <CheckCircle weight="fill" className="size-3" />}
              {isCancelled && <WarningCircle weight="fill" className="size-3" />}
              {appt.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Appointment Header */}
        <div className="bg-card border border-border rounded p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-muted-foreground uppercase">Appointment ID: {appt.id.slice(-8)}</span>
              <h1 className="text-2xl font-heading font-bold text-foreground mt-1">
                Consultation with Dr. {appt.doctor.name}
              </h1>
              <p className="text-xs text-primary font-medium mt-0.5">
                {appt.doctor.doctorProfile?.specialization || 'General Practice'}
              </p>
            </div>

            {isBooked && (
              <form action={cancelAppointment}>
                <Button variant="destructive" size="sm" type="submit" className="text-xs">
                  <XCircle weight="bold" className="mr-1.5 size-4" />
                  Cancel Appointment
                </Button>
              </form>
            )}

            {isCancelled && (
              <Link href={`/patient/book/${appt.doctorId}`}>
                <Button size="sm" className="text-xs">
                  Rebook with Dr. {appt.doctor.name}
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border text-xs">
            <div>
              <span className="text-muted-foreground block mb-1">Date & Time</span>
              <p className="font-mono font-medium text-foreground text-sm">
                {new Date(appt.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(appt.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">Calendar & Notifications</span>
              <p className="text-foreground">
                Google Calendar invite synchronized • Email reminders active
              </p>
            </div>
          </div>
        </div>

        {/* Pre-Visit Symptoms Briefing */}
        {appt.preVisitSummary && (
          <div className="bg-card border border-border rounded p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <ChatCircleDots weight="fill" className="text-primary size-4" />
              <h2 className="text-base font-heading font-semibold text-foreground">Submitted Symptoms & AI Pre-Visit Triage</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block mb-1">Your Reported Symptoms</span>
                <p className="text-foreground italic bg-secondary/30 p-3 rounded border border-border">
                  "{appt.preVisitSummary.rawSymptoms}"
                </p>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Pre-Visit Priority Flag</span>
                <div className="p-3 rounded bg-secondary/30 border border-border space-y-1">
                  <p className="font-medium text-foreground">
                    Chief Complaint: <span className="font-semibold">{appt.preVisitSummary.chiefComplaint}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Assessed Urgency: <span className="font-mono font-medium text-foreground">{appt.preVisitSummary.urgency} Priority</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Post-Visit Summary Section */}
        {isCompleted && appt.postVisitSummary ? (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <FileText weight="fill" className="text-primary size-4" />
                <h2 className="text-base font-heading font-semibold text-foreground">Doctor's Post-Visit Summary</h2>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {appt.postVisitSummary.patientFriendlySummary}
              </p>
            </div>

            {/* Medication Schedule (FR-11) */}
            {meds.length > 0 && (
              <div className="bg-card border border-border rounded p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Pill weight="fill" className="text-primary size-4" />
                  <h2 className="text-base font-heading font-semibold text-foreground">Prescribed Medication Schedule</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {meds.map((m: any, i: number) => (
                    <div key={i} className="p-3 bg-secondary/40 rounded border border-border text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-foreground text-sm block">{m.medicationName || m.name}</strong>
                        <span className="text-muted-foreground">Dosage & Frequency: {m.frequency || m.time}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary font-mono text-[10px] rounded border border-primary/20">
                        Active Rx
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Steps */}
            {steps.length > 0 && (
              <div className="bg-card border border-border rounded p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <CheckCircle weight="fill" className="text-primary size-4" />
                  <h2 className="text-base font-heading font-semibold text-foreground">Recommended Follow-up Steps</h2>
                </div>
                <ul className="space-y-2 text-xs text-foreground">
                  {steps.map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 bg-secondary/20 p-2.5 rounded border border-border">
                      <span className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 mt-0.5 text-[10px]">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : isBooked ? (
          <div className="bg-card border border-border rounded p-8 text-center space-y-2">
            <Clock weight="duotone" className="size-8 text-primary mx-auto mb-2" />
            <h3 className="font-heading font-semibold text-base text-foreground">Visit Scheduled</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your appointment is confirmed. Once Dr. {appt.doctor.name} completes the consultation and enters clinical notes, your AI-generated post-visit summary and medication schedule will appear here.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  )
}
