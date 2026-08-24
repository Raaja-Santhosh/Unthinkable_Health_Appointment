import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "@phosphor-icons/react/dist/ssr"

export default async function AdminDoctorsPage() {
  const doctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    include: { doctorProfile: true }
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-heading font-medium tracking-tight">Manage Doctors</h1>
          <p className="text-muted-foreground mt-1">View and manage doctor profiles in the platform.</p>
        </div>
        <Link href="/admin/doctors/new">
          <Button>
            <Plus weight="bold" className="mr-2" /> Add Doctor
          </Button>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-secondary/40 flex items-center gap-2">
          <Users weight="fill" className="text-primary size-5" />
          <h2 className="font-heading font-medium text-lg">Doctor Roster</h2>
        </div>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Specialization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Slot (min)</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {doctors.map((doc) => (
              <tr key={doc.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium">{doc.name}</td>
                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-muted-foreground">{doc.email}</td>
                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-muted-foreground">{doc.doctorProfile?.specialization || '-'}</td>
                <td className="px-6 py-3.5 whitespace-nowrap text-sm text-muted-foreground font-mono">{doc.doctorProfile?.slotDuration || '-'}</td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm">No doctors found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
