"use client"
import { useState, useTransition, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Heartbeat, 
  Stethoscope, 
  ShieldCheck, 
  LockKey, 
  EnvelopeSimple, 
  ArrowRight,
  Sparkle
} from "@phosphor-icons/react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError("Invalid email or password. Please check your credentials.")
        } else {
          // Determine redirect based on email or fetch session
          if (email.toLowerCase().includes("admin")) {
            router.push("/admin")
          } else if (email.toLowerCase().includes("doctor")) {
            router.push("/doctor")
          } else {
            router.push("/patient")
          }
          router.refresh()
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
      }
    })
  }

  const handleQuickLogin = async (demoEmail: string, demoPass: string, redirectPath: string) => {
    setError("")
    startTransition(async () => {
      const result = await signIn("credentials", {
        email: demoEmail,
        password: demoPass,
        redirect: false,
      })

      if (result?.error) {
        setError("Quick sign-in failed. Please ensure the database has been seeded.")
      } else {
        router.push(redirectPath)
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-10 bg-primary/10 border border-primary/20 rounded flex items-center justify-center text-primary">
              <Heartbeat weight="fill" className="size-6" />
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-foreground">Aegis Care</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-heading font-bold text-foreground">
          Sign In to Your Portal
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Select a role or enter your credentials below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        {/* Quick Demo Logins */}
        <div className="bg-card p-4 rounded border border-border">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            <Sparkle weight="fill" className="size-3.5" />
            1-Click Demo Sign In
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleQuickLogin("patient@clinic.com", "patient123", "/patient")}
              className="flex flex-col h-auto py-2.5 px-2 text-center items-center gap-1 hover:border-primary/50"
            >
              <Heartbeat className="size-4 text-primary" />
              <span className="text-xs font-medium">Patient</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleQuickLogin("doctor@clinic.com", "doctor123", "/doctor")}
              className="flex flex-col h-auto py-2.5 px-2 text-center items-center gap-1 hover:border-blue-500/50"
            >
              <Stethoscope className="size-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium">Doctor</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleQuickLogin("admin@clinic.com", "admin123", "/admin")}
              className="flex flex-col h-auto py-2.5 px-2 text-center items-center gap-1 hover:border-amber-500/50"
            >
              <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium">Admin</span>
            </Button>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="bg-card py-8 px-4 border border-border sm:rounded sm:px-10">
          {registered && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs rounded">
              Account created successfully. You may now sign in.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-foreground mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <EnvelopeSimple className="size-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-9 pr-3 py-2 bg-background border border-input rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-foreground mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <LockKey className="size-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-9 pr-3 py-2 bg-background border border-input rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full min-h-[42px] font-medium text-sm mt-2"
            >
              {isPending ? "Signing In..." : "Sign In"}
              <ArrowRight weight="bold" className="ml-2 size-4" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Register as Patient
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm font-mono">
        Loading sign in...
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
