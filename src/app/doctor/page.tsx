import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SignOut, WarningCircle, Warning, CheckCircle, Clock } from "@phosphor-icons/react/dist/ssr"

export default async function DoctorDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'DOCTOR') redirect('/login')

  const myAppointments = await prisma.appointment.findMany({
    where: { doctorId: session.user.id },
    include: { patient: true, preVisitSummary: true, postVisitSummary: true },
    orderBy: { startTime: 'asc' }
  })

  // Group appointments by date
  const today = new Date().toDateString()
  
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar / Navigation */}
      <div className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="p-4 border-b border-border">
          <h1 className="font-heading font-semibold text-lg tracking-tight truncate">Dr. {session.user.name?.split(' ')[0]}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Clinical Dashboard</p>
        </div>
        <div className="flex-1 py-4">
          <div className="px-3">
            <div className="px-2 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-md flex justify-between items-center">
              <span>Upcoming</span>
              <span className="text-xs bg-background/50 px-1.5 rounded">{myAppointments.length}</span>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-border mt-auto">
          <form action="/api/auth/signout" method="POST">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground h-8 px-2">
              <SignOut weight="bold" className="mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-6 flex justify-between items-end">
            <h2 className="text-xl font-heading font-medium">Appointments</h2>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock weight="bold" />
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm">
            {/* Header Row */}
            <div className="grid grid-cols-[80px_1fr_120px_100px_80px] gap-4 p-3 border-b border-border bg-secondary/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div>Time</div>
              <div>Patient & Complaint</div>
              <div>Urgency</div>
              <div>Status</div>
              <div className="text-right">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {myAppointments.map(appt => {
                const urgency = appt.preVisitSummary?.urgency || 'Unknown'
                const isHigh = urgency === 'High'
                const isMedium = urgency === 'Medium'
                const isLow = urgency === 'Low'
                
                return (
                  <Link 
                    href={`/doctor/appointment/${appt.id}`} 
                    key={appt.id}
                    className="grid grid-cols-[80px_1fr_120px_100px_80px] gap-4 p-3 items-center text-sm hover:bg-secondary/40 transition-colors group"
                  >
                    <div className="font-mono text-muted-foreground">
                      {new Date(appt.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                    
                    <div>
                      <div className="font-medium text-foreground">{appt.patient.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-sm mt-0.5">
                        {appt.preVisitSummary?.chiefComplaint || 'No complaint listed'}
                      </div>
                    </div>
                    
                    <div>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
                        isHigh ? 'border-destructive/30 bg-destructive/10 text-destructive' : 
                        isMedium ? 'border-[#F76B15]/30 bg-[#F76B15]/10 text-[#F76B15]' : 
                        isLow ? 'border-[#3E9B4F]/30 bg-[#3E9B4F]/10 text-[#3E9B4F]' : 
                        'border-border bg-secondary text-muted-foreground'
                      }`}>
                        {isHigh ? <WarningCircle weight="fill" /> : 
                         isMedium ? <Warning weight="fill" /> : 
                         isLow ? <CheckCircle weight="fill" /> : null}
                        {urgency}
                      </div>
                    </div>
                    
                    <div className="text-muted-foreground text-xs font-medium">
                      {appt.status}
                    </div>
                    
                    <div className="text-right">
                      <span className="text-primary font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        Open →
                      </span>
                    </div>
                  </Link>
                )
              })}
              
              {myAppointments.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No appointments scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
