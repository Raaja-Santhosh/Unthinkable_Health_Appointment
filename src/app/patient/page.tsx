import { prisma } from "@/lib/prisma"
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DoctorSearch } from "./DoctorSearch"
import { 
  Heartbeat, 
  CalendarPlus, 
  FileText, 
  ArrowRight, 
  SignOut,
  CalendarCheck,
  CheckCircle,
  Clock,
  WarningCircle
} from "@phosphor-icons/react/dist/ssr"

export default async function PatientDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'PATIENT') redirect('/login')

  const myAppointments = await prisma.appointment.findMany({
    where: { patientId: session.user.id },
    include: { doctor: { include: { doctorProfile: true } }, preVisitSummary: true, postVisitSummary: true },
    orderBy: { startTime: 'desc' }
  })

  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    include: { doctorProfile: true }
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 bg-primary/10 border border-primary/20 rounded flex items-center justify-center text-primary">
              <Heartbeat weight="fill" className="size-5" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight text-foreground">Aegis Patient</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Welcome, <strong className="text-foreground">{session.user.name}</strong>
            </span>
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}>
              <Button variant="outline" size="sm" className="text-xs">
                <SignOut weight="bold" className="mr-1.5 size-3.5" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* Intro banner */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
            Patient Portal
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Search practitioners, book slots with real-time hold protection, and track your clinical visit summaries.
          </p>
        </div>

        {/* Doctor Search & Booking Section */}
        <section id="book" className="space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border">
            <div className="p-1.5 bg-primary/10 rounded text-primary">
              <CalendarPlus weight="fill" className="size-4" />
            </div>
            <h2 className="text-lg font-heading font-semibold text-foreground">Find a Practitioner</h2>
          </div>
          
          <DoctorSearch doctors={doctors} />
        </section>

        {/* My Appointments Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-secondary rounded text-secondary-foreground">
                <FileText weight="fill" className="size-4" />
              </div>
              <h2 className="text-lg font-heading font-semibold text-foreground">My Appointments & Follow-ups</h2>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {myAppointments.length} total
            </span>
          </div>

          <div className="space-y-3">
            {myAppointments.map(appt => {
              const isBooked = appt.status === 'BOOKED'
              const isCompleted = appt.status === 'COMPLETED'
              const isCancelled = appt.status === 'CANCELLED'

              return (
                <div 
                  key={appt.id} 
                  className="bg-card border border-border rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border/80 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="font-heading font-semibold text-base text-foreground">Dr. {appt.doctor.name}</h3>
                      <span className={`px-2 py-0.5 inline-flex items-center gap-1 text-xs font-mono font-medium rounded ${
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
                    <p className="text-xs text-muted-foreground">
                      {new Date(appt.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(appt.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Specialty: <span className="text-foreground font-medium">{appt.doctor.doctorProfile?.specialization || 'General Practice'}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link href={`/patient/appointment/${appt.id}`}>
                      <Button variant={isCompleted ? "default" : "outline"} size="sm" className="text-xs min-h-[38px] font-medium">
                        <span>{isCompleted ? "View AI Summary" : "Manage Booking"}</span>
                        <ArrowRight weight="bold" className="ml-1.5 size-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}

            {myAppointments.length === 0 && (
              <div className="bg-card border border-border rounded p-12 text-center flex flex-col items-center">
                <div className="size-12 bg-secondary rounded flex items-center justify-center text-muted-foreground mb-4">
                  <CalendarCheck weight="duotone" className="size-6" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-1 text-foreground">No upcoming appointments</h3>
                <p className="text-muted-foreground text-xs mb-5 max-w-sm">
                  Search a medical specialization above to book your first clinical consultation.
                </p>
                <a href="#book">
                  <Button size="sm" className="text-xs font-medium">
                    <CalendarPlus weight="bold" className="mr-1.5 size-4" />
                    Book an Appointment
                  </Button>
                </a>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
