"use client"
import { useTransition } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Heartbeat, Stethoscope, ShieldCheck, CaretRight } from "@phosphor-icons/react"
import { toast } from "sonner"

export function DemoLoginButtons() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleLogin = (email: string, pass: string, path: string) => {
    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          email,
          password: pass,
          redirect: false,
        })
        if (res?.error) {
          toast.error("Sign in failed. Please check credentials.")
        } else {
          router.push(path)
          router.refresh()
        }
      } catch (e: any) {
        toast.error("An error occurred during sign in.")
      }
    })
  }

  return (
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
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => handleLogin("patient@clinic.com", "patient123", "/patient")}
          className="w-full justify-between text-xs min-h-[40px] font-medium"
        >
          <span>{isPending ? "Signing in..." : "Enter as John Doe (Patient)"}</span>
          <CaretRight weight="bold" className="size-3.5" />
        </Button>
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
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => handleLogin("doctor@clinic.com", "doctor123", "/doctor")}
          className="w-full justify-between text-xs min-h-[40px] font-medium"
        >
          <span>{isPending ? "Signing in..." : "Enter as Dr. Sarah Chen (Doctor)"}</span>
          <CaretRight weight="bold" className="size-3.5" />
        </Button>
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
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => handleLogin("admin@clinic.com", "admin123", "/admin")}
          className="w-full justify-between text-xs min-h-[40px] font-medium"
        >
          <span>{isPending ? "Signing in..." : "Enter as Clinic Admin"}</span>
          <CaretRight weight="bold" className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
