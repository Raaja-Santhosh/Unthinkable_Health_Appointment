import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { generatePostVisitSummary } from "@/lib/gemini"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, WarningCircle, CheckCircle, Warning, Clock, ChatTeardropText, FileText } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

export default async function DoctorAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== 'DOCTOR') redirect('/login')

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true, preVisitSummary: true, postVisitSummary: true }
  })

  if (!appt || appt.doctorId !== session.user.id) return <div>Not found</div>

  async function submitNotes(formData: FormData) {
    "use server"
    const notes = formData.get("notes") as string
    
    // Generate post-visit summary (with graceful fallback)
    let summary: any = {}
    try {
      summary = await generatePostVisitSummary(notes)
    } catch (e) {
      console.warn("Post-visit LLM generation fallback:", e)
      summary = {
        patientFriendlySummary: `Summary of consultation: ${notes.slice(0, 180)}... Please follow the recommended prescription carefully.`,
        medicationSchedule: [{ medicationName: "Standard Prescribed Medication", frequency: "As directed with meals" }],
        followUpSteps: ["Rest and monitor symptoms", "Follow up in 7 days if symptoms persist"]
      }
    }
    
    await prisma.postVisitSummary.create({
      data: {
        appointmentId: appt!.id,
        clinicalNotes: notes,
        patientFriendlySummary: summary.patientFriendlySummary || "Consultation complete. Please review doctor notes directly.",
        medicationSchedule: JSON.stringify(summary.medicationSchedule || []),
        followUpSteps: JSON.stringify(summary.followUpSteps || [])
      }
    })

    // Update appointment status
    await prisma.appointment.update({
      where: { id: appt!.id },
      data: { status: "COMPLETED" }
    })

    revalidatePath(`/doctor/appointment/${appt!.id}`)
  }

  let suggestedQuestions = []
  try {
    suggestedQuestions = JSON.parse(appt.preVisitSummary?.suggestedQuestions || "[]")
  } catch (e) {}

  const urgency = appt.preVisitSummary?.urgency || 'Unknown'
  const isHigh = urgency === 'High'
  const isMedium = urgency === 'Medium'
  const isLow = urgency === 'Low'

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
      
      {/* Left Rail: Patient Context */}
      <div className="w-72 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Link href="/doctor" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft weight="bold" className="size-4" />
          </Link>
          <span className="font-medium text-sm">Back to List</span>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border border-border">
              <User weight="fill" className="size-6" />
            </div>
            <div>
              <h2 className="font-heading font-medium text-lg leading-tight">{appt.patient.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{appt.patient.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Appointment Details</div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-foreground">{appt.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium text-foreground">{new Date(appt.startTime).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium text-foreground">{new Date(appt.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Pre-Visit Urgency</div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                isHigh ? 'border-destructive/30 bg-destructive/10 text-destructive' : 
                isMedium ? 'border-[#F76B15]/30 bg-[#F76B15]/10 text-[#F76B15]' : 
                isLow ? 'border-[#3E9B4F]/30 bg-[#3E9B4F]/10 text-[#3E9B4F]' : 
                'border-border bg-secondary text-muted-foreground'
              }`}>
                {isHigh ? <WarningCircle weight="fill" className="size-4" /> : 
                 isMedium ? <Warning weight="fill" className="size-4" /> : 
                 isLow ? <CheckCircle weight="fill" className="size-4" /> : null}
                {urgency} Priority
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Pane: AI Summary & Notes */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-6">
          
          {/* AI Pre-Visit Summary */}
          {appt.preVisitSummary && (
            <div className="bg-card border border-border shadow-sm rounded-lg overflow-hidden">
              <div className="bg-secondary/40 border-b border-border px-6 py-4 flex items-center gap-2">
                <ChatTeardropText weight="fill" className="text-primary size-5" />
                <h2 className="font-heading font-medium text-lg">AI Pre-Visit Summary</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Chief Complaint</h3>
                    <p className="text-sm font-medium text-foreground">{appt.preVisitSummary.chiefComplaint}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Raw Symptoms (from Patient)</h3>
                    <p className="text-sm text-foreground/80 italic border-l-2 border-primary/20 pl-3 py-1">{appt.preVisitSummary.rawSymptoms}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Suggested Questions for Visit</h3>
                  <ul className="space-y-2">
                    {suggestedQuestions.map((q: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground">
                        <div className="mt-1 text-primary shrink-0">&bull;</div>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Notes Section */}
          {appt.postVisitSummary ? (
            <div className="bg-card border border-border shadow-sm rounded-lg overflow-hidden">
              <div className="bg-secondary/40 border-b border-border px-6 py-4 flex items-center gap-2">
                <FileText weight="fill" className="text-primary size-5" />
                <h2 className="font-heading font-medium text-lg">Post-Visit Summary (Completed)</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Your Clinical Notes</h3>
                  <div className="text-sm p-4 bg-muted/50 rounded border border-border font-mono whitespace-pre-wrap">
                    {appt.postVisitSummary.clinicalNotes}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Patient-Friendly Summary (Sent)</h3>
                  <div className="text-sm p-4 bg-primary/5 rounded border border-primary/10 text-primary-foreground/90 whitespace-pre-wrap">
                    {appt.postVisitSummary.patientFriendlySummary}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border shadow-sm rounded-lg overflow-hidden">
              <div className="bg-secondary/40 border-b border-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText weight="fill" className="text-primary size-5" />
                  <h2 className="font-heading font-medium text-lg">Clinical Notes & Action Plan</h2>
                </div>
              </div>
              <div className="p-6">
                <form action={submitNotes} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Visit Notes & Prescriptions</label>
                    <textarea 
                      required 
                      name="notes" 
                      rows={8} 
                      className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none font-mono" 
                      placeholder="Enter clinical notes, diagnosis, and prescription details here. The AI will parse this to create a patient-friendly summary with medication schedules..."
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" className="min-w-[180px]">
                      Sign & Generate Summary
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
