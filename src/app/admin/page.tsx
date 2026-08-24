import { prisma } from "@/lib/prisma"
import { Users, Stethoscope, CalendarCheck } from "@phosphor-icons/react/dist/ssr"

export default async function AdminDashboard() {
  const doctorsCount = await prisma.user.count({ where: { role: 'DOCTOR' } })
  const patientsCount = await prisma.user.count({ where: { role: 'PATIENT' } })
  const appointmentsCount = await prisma.appointment.count()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-heading font-medium tracking-tight">Platform Overview</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border flex items-center justify-between">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">Total Doctors</h3>
            <p className="text-3xl font-mono font-medium">{doctorsCount}</p>
          </div>
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Stethoscope weight="duotone" className="size-6" />
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border border-border flex items-center justify-between">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">Total Patients</h3>
            <p className="text-3xl font-mono font-medium">{patientsCount}</p>
          </div>
          <div className="size-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border border-border">
            <Users weight="duotone" className="size-6" />
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-lg border border-border flex items-center justify-between">
          <div>
            <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">Appointments</h3>
            <p className="text-3xl font-mono font-medium">{appointmentsCount}</p>
          </div>
          <div className="size-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center border border-border">
            <CalendarCheck weight="duotone" className="size-6" />
          </div>
        </div>
      </div>
    </div>
  )
}
