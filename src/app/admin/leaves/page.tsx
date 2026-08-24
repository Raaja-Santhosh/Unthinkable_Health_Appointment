import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"
import { LeaveForm } from "./LeaveForm"
import { CalendarSlash } from "@phosphor-icons/react/dist/ssr"

export default async function AdminLeavesPage() {
  const doctors = await prisma.user.findMany({ where: { role: 'DOCTOR' } })
  const leaves = await prisma.leave.findMany({
    include: { doctor: true },
    orderBy: { date: 'desc' }
  })

  async function addLeave(formData: FormData) {
    "use server"
    const doctorId = formData.get("doctorId") as string
    const dateStr = formData.get("date") as string
    const reason = formData.get("reason") as string
    const date = new Date(dateStr)

    // 1. Create the leave
    await prisma.leave.create({
      data: { doctorId, date, reason }
    })

    // 2. Find and cancel affected appointments
    const startOfDay = new Date(date)
    startOfDay.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setUTCHours(23, 59, 59, 999)

    const affectedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: "BOOKED",
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: { patient: true, doctor: true }
    })

    for (const appt of affectedAppointments) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { status: "CANCELLED" }
      })

      await sendEmail({
        to: appt.patient.email,
        subject: "Appointment Cancelled",
        text: `Dear ${appt.patient.name}, your appointment with ${appt.doctor.name} on ${appt.startTime.toLocaleString()} has been cancelled because the doctor is on leave. Please reschedule.`
      })
    }

    revalidatePath("/admin/leaves")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-medium tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground mt-1">Manage doctor absences and handle resulting appointment conflicts.</p>
      </div>

      <LeaveForm doctors={doctors} action={addLeave} />

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-secondary/40 flex items-center gap-2">
          <CalendarSlash weight="fill" className="text-primary size-5" />
          <h2 className="font-heading font-medium text-lg">Leave History</h2>
        </div>
        
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {leaves.map((leave) => (
              <tr key={leave.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium">{leave.doctor.name}</td>
                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-muted-foreground font-mono">{new Date(leave.date).toLocaleDateString()}</td>
                <td className="px-6 py-3.5 text-sm text-muted-foreground">{leave.reason || '-'}</td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground text-sm">
                  No leaves found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
