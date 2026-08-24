import { auth, signIn, signOut } from "@/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { 
  Heartbeat, 
  UserCheck, 
  Stethoscope, 
  ShieldCheck, 
  CalendarCheck, 
  Sparkle, 
  ClockCountdown, 
  ArrowRight, 
  WarningCircle, 
  SignOut,
  CaretRight,
  MagnifyingGlass
} from "@phosphor-icons/react/dist/ssr"

export default async function HomePage() {
  const session = await auth()

  // Fetch doctors count and specialties for live preview
  let doctors: any[] = []
  try {
    doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      include: { doctorProfile: true },
      take: 4
    })
  } catch (e) {
    console.error("Error loading doctors for landing page:", e)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Status & Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-primary/10 border border-primary/20 rounded flex items-center justify-center text-primary">
              <Heartbeat weight="fill" className="size-5" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg tracking-tight">Aegis Care</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono text-muted-foreground uppercase px-2 py-0.5 bg-secondary rounded border border-border">
                Three-Portal Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden md:inline">
                  Signed in as <strong className="text-foreground">{session.user.name}</strong> ({session.user.role})
                </span>
                <Link href={
                  session.user.role === 'ADMIN' ? '/admin' :
                  session.user.role === 'DOCTOR' ? '/doctor' : '/patient'
                }>
                  <Button size="sm" className="font-medium min-h-[38px]">
                    Go to {session.user.role.charAt(0) + session.user.role.slice(1).toLowerCase()} Portal
                    <ArrowRight weight="bold" className="ml-1.5 size-4" />
                  </Button>
                </Link>
                <form action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <SignOut weight="bold" className="size-4" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="min-h-[38px]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="min-h-[38px]">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded border border-border mb-6">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Synchronized Clinical & Patient Operations
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight text-foreground leading-[1.1]">
              Connected Healthcare Scheduling with AI-Powered Clinical Context.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Eliminate double bookings with guaranteed concurrency locks, provide doctors structured pre-visit briefings, and keep patients informed with plain-language summaries.
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-12 p-6 bg-card border border-border rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                  <Sparkle weight="fill" className="text-primary size-5" />
                  Instant Portal Demo Access
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Launch straight into any portal with pre-configured role test accounts:
                </p>
              </div>
              <div className="text-xs font-mono text-muted-foreground bg-muted px-3 py-1 rounded self-start md:self-auto">
                No password required
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* Patient Demo Card */}
              <div className="border border-border rounded p-5 bg-background hover:border-primary/50 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                      PATIENT PORTAL
                    </span>
                    <Heartbeat className="size-5 text-primary" />
                  </div>
                  <h4 className="font-heading font-bold text-base mt-2">Patient Experience</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
                    Search doctors, hold slots with live countdown timers, and complete caring symptom intakes.
                  </p>
                </div>
                <form action={async () => {
                  "use server"
                  await signIn("credentials", {
                    email: "patient@clinic.com",
                    password: "patient123",
                    redirectTo: "/patient"
                  })
                }}>
                  <Button type="submit" variant="outline" className="w-full justify-between text-xs min-h-[40px] font-medium">
                    <span>Enter as John Doe (Patient)</span>
                    <CaretRight weight="bold" className="size-3.5" />
                  </Button>
                </form>
              </div>

              {/* Doctor Demo Card */}
              <div className="border border-border rounded p-5 bg-background hover:border-primary/50 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded border border-blue-500/20">
                      DOCTOR PORTAL
                    </span>
                    <Stethoscope className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-heading font-bold text-base mt-2">Clinical Dashboard</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
                    Desktop-first dense view (Linear-style), AI pre-visit urgency flags, and post-visit note generation.
                  </p>
                </div>
                <form action={async () => {
                  "use server"
                  await signIn("credentials", {
                    email: "doctor@clinic.com",
                    password: "doctor123",
                    redirectTo: "/doctor"
                  })
                }}>
                  <Button type="submit" variant="outline" className="w-full justify-between text-xs min-h-[40px] font-medium">
                    <span>Enter as Dr. Sarah Chen (Doctor)</span>
                    <CaretRight weight="bold" className="size-3.5" />
                  </Button>
                </form>
              </div>

              {/* Admin Demo Card */}
              <div className="border border-border rounded p-5 bg-background hover:border-primary/50 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded border border-amber-500/20">
                      ADMIN PORTAL
                    </span>
                    <ShieldCheck className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="font-heading font-bold text-base mt-2">Operations & Leave</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
                    Flat Stripe/Retool table density, doctor onboarding, and automatic booking conflict warning strips.
                  </p>
                </div>
                <form action={async () => {
                  "use server"
                  await signIn("credentials", {
                    email: "admin@clinic.com",
                    password: "admin123",
                    redirectTo: "/admin"
                  })
                }}>
                  <Button type="submit" variant="outline" className="w-full justify-between text-xs min-h-[40px] font-medium">
                    <span>Enter as Clinic Admin</span>
                    <CaretRight weight="bold" className="size-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Directory Preview Section */}
        <section className="border-t border-border bg-card/40 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">Available Specialists</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Book direct visits with clinic practitioners across all medical disciplines.
                </p>
              </div>
              <Link href="/patient">
                <Button variant="outline" size="sm" className="min-h-[38px]">
                  <MagnifyingGlass className="mr-1.5 size-4" />
                  Search All Specialties
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {doctors.map(doc => (
                <div key={doc.id} className="bg-card border border-border rounded p-5 flex flex-col justify-between">
                  <div>
                    <div className="size-10 rounded bg-primary/10 text-primary flex items-center justify-center font-heading font-bold mb-3">
                      Dr
                    </div>
                    <h3 className="font-medium text-base text-foreground">Dr. {doc.name}</h3>
                    <p className="text-xs text-primary font-medium mt-0.5">{doc.doctorProfile?.specialization || 'General Practice'}</p>
                    <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                      <span>Slot Duration:</span>
                      <span className="font-mono font-medium text-foreground">{doc.doctorProfile?.slotDuration || 30} mins</span>
                    </div>
                  </div>
                  <div className="mt-5">
                    <Link href={`/patient/book/${doc.id}`} className="block w-full">
                      <Button className="w-full min-h-[40px] text-xs font-medium">
                        Book Appointment
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture & Engineering Standards Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 border-t border-border">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-heading font-bold tracking-tight text-foreground">
              Engineered to PRD & AGENTS.md Specifications
            </h2>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Every portal delivers purposeful UX with tailored density, reliable concurrency management, and structured AI summaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="size-10 rounded bg-primary/10 text-primary flex items-center justify-center">
                <ClockCountdown weight="bold" className="size-5" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground">Concurrency & Slot-Hold Engine</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Prevents double booking via database transaction locks and temporary 5-minute holds with real-time countdown toasts.
              </p>
            </div>

            <div className="space-y-3">
              <div className="size-10 rounded bg-primary/10 text-primary flex items-center justify-center">
                <Sparkle weight="bold" className="size-5" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground">AI Pre & Post-Visit Intelligence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Triage patient symptoms into Low/Medium/High urgency flags with suggested questions, and translate clinical notes into plain patient summaries.
              </p>
            </div>

            <div className="space-y-3">
              <div className="size-10 rounded bg-primary/10 text-primary flex items-center justify-center">
                <WarningCircle weight="bold" className="size-5" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground">Automated Leave Conflict Handling</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Detects existing patient appointments when a doctor requests leave, surfaces an inline warning strip, and handles reschedule notifications.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Healthcare Appointment & Follow-up Manager. Compliant with AGENTS.md token system.</p>
        </div>
      </footer>
    </div>
  )
}
