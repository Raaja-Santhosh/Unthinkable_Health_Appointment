import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UserPlus } from "@phosphor-icons/react/dist/ssr"

export default function NewDoctorPage() {
  async function addDoctor(formData: FormData) {
    "use server"
    
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const specialization = formData.get('specialization') as string
    const slotDuration = parseInt(formData.get('slotDuration') as string) || 30
    const startHour = formData.get('startHour') as string || '09:00'
    const endHour = formData.get('endHour') as string || '17:00'
    
    // Structured working hours JSON
    const workingHours = JSON.stringify([
      { day: "Monday", start: startHour, end: endHour },
      { day: "Tuesday", start: startHour, end: endHour },
      { day: "Wednesday", start: startHour, end: endHour },
      { day: "Thursday", start: startHour, end: endHour },
      { day: "Friday", start: startHour, end: endHour },
    ])

    const passwordHash = await bcrypt.hash(password, 10)
    
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialization,
            slotDuration,
            workingHours
          }
        }
      }
    })

    redirect('/admin/doctors')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/doctors" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft weight="bold" className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-medium tracking-tight">Onboard New Doctor</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configure clinical credentials, slot durations, and working hours.</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <form action={addDoctor} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Doctor Full Name</label>
            <input 
              required 
              type="text" 
              name="name" 
              placeholder="e.g. Sarah Jenkins, MD" 
              className="block w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email Address</label>
              <input 
                required 
                type="email" 
                name="email" 
                placeholder="s.jenkins@clinic.com" 
                className="block w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Account Password</label>
              <input 
                required 
                type="password" 
                name="password" 
                placeholder="••••••••" 
                className="block w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Medical Specialization</label>
              <input 
                required 
                type="text" 
                name="specialization" 
                placeholder="e.g. Cardiology, Dermatology" 
                className="block w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Slot Duration (Minutes)</label>
              <input 
                required 
                type="number" 
                name="slotDuration" 
                defaultValue="30" 
                min="15" 
                max="120" 
                step="15"
                className="block w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Daily Shift Start</label>
              <input 
                type="time" 
                name="startHour" 
                defaultValue="09:00" 
                className="block w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Daily Shift End</label>
              <input 
                type="time" 
                name="endHour" 
                defaultValue="17:00" 
                className="block w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring" 
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link href="/admin/doctors">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" className="min-w-[140px]">
              <UserPlus weight="bold" className="mr-1.5 size-4" />
              Save Doctor
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
