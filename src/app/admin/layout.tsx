import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Buildings, Users, CalendarSlash, SignOut } from "@phosphor-icons/react/dist/ssr"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-card border-b border-border px-6 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Buildings weight="fill" className="size-5" />
            <span>Platform Admin</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link href="/admin" className="px-3 py-1.5 rounded-md hover:bg-secondary text-foreground transition-colors">
              Overview
            </Link>
            <Link href="/admin/doctors" className="px-3 py-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Users weight="bold" /> Doctors
            </Link>
            <Link href="/admin/leaves" className="px-3 py-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <CalendarSlash weight="bold" /> Leave Management
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">{session.user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
              <SignOut weight="bold" className="mr-2" />
              Sign out
            </Button>
          </form>
        </div>
      </header>

      {/* Mobile nav (simplified for demo) */}
      <div className="md:hidden bg-card border-b border-border p-2 flex gap-2 overflow-x-auto">
        <Link href="/admin" className="px-3 py-1.5 rounded bg-secondary text-sm font-medium whitespace-nowrap">Overview</Link>
        <Link href="/admin/doctors" className="px-3 py-1.5 rounded text-muted-foreground text-sm font-medium whitespace-nowrap">Doctors</Link>
        <Link href="/admin/leaves" className="px-3 py-1.5 rounded text-muted-foreground text-sm font-medium whitespace-nowrap">Leaves</Link>
      </div>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
