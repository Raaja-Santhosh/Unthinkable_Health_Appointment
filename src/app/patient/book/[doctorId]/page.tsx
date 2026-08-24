import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookingForm } from "./BookingForm"
import { ArrowLeft, Stethoscope, Clock, ShieldCheck } from "@phosphor-icons/react/dist/ssr"

export default async function BookDoctorPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== 'PATIENT') redirect('/login')

  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    include: { doctorProfile: true }
  })

  if (!doctor || !doctor.doctorProfile) {
    redirect('/patient')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/patient" className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft weight="bold" className="size-3.5" />
            <span>Cancel & Back</span>
          </Link>
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <ShieldCheck weight="fill" className="text-primary size-3.5" />
            Active Concurrency Lock Enabled
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Doctor Summary Card */}
        <div className="bg-card border border-border rounded p-5 flex items-center gap-4">
          <div className="size-12 rounded bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-base shrink-0">
            <Stethoscope weight="bold" className="size-6" />
          </div>
          <div>
            <span className="text-xs font-mono text-primary font-medium uppercase tracking-wide">
              {doctor.doctorProfile.specialization}
            </span>
            <h1 className="text-xl font-heading font-bold text-foreground mt-0.5">
              Dr. {doctor.name}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="size-3" />
              Standard slot duration: {doctor.doctorProfile.slotDuration} mins
            </p>
          </div>
        </div>

        {/* Multi-step Booking Form */}
        <BookingForm doctorId={doctor.id} patientId={session.user.id} />
      </main>
    </div>
  )
}
