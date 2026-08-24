"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MagnifyingGlass, Stethoscope, Clock, CaretRight } from "@phosphor-icons/react"

interface Doctor {
  id: string
  name: string | null
  email: string
  doctorProfile: {
    specialization: string
    slotDuration: number
    workingHours?: string
  } | null
}

export function DoctorSearch({ doctors }: { doctors: Doctor[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("All")

  // Extract unique specialties
  const specialties = useMemo(() => {
    const set = new Set<string>()
    doctors.forEach(d => {
      if (d.doctorProfile?.specialization) {
        set.add(d.doctorProfile.specialization)
      }
    })
    return ["All", ...Array.from(set)]
  }, [doctors])

  // Filter doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const spec = doc.doctorProfile?.specialization || "General Practice"
      const nameMatch = (doc.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      const specMatch = spec.toLowerCase().includes(searchQuery.toLowerCase())
      const categoryMatch = selectedSpecialty === "All" || spec.toLowerCase() === selectedSpecialty.toLowerCase()

      return (nameMatch || specMatch) && categoryMatch
    })
  }, [doctors, searchQuery, selectedSpecialty])

  return (
    <div className="space-y-6">
      {/* Search Input and Filter Badges */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
            <MagnifyingGlass className="size-4" />
          </div>
          <input
            type="text"
            placeholder="Search doctors by name or medical specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground mr-1">Specialties:</span>
          {specialties.map(spec => {
            const isSelected = selectedSpecialty === spec
            return (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {spec}
              </button>
            )
          })}
        </div>
      </div>

      {/* Doctor Grid */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map(doc => (
            <div key={doc.id} className="bg-card p-5 rounded border border-border flex flex-col justify-between hover:border-primary/40 transition-colors">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 rounded bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-sm">
                    <Stethoscope weight="bold" className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-base text-foreground">Dr. {doc.name}</h3>
                    <p className="text-xs font-medium text-primary">{doc.doctorProfile?.specialization || 'General Practice'}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2 mb-5">
                  <Clock className="size-3.5" />
                  <span>{doc.doctorProfile?.slotDuration || 30}-minute consultation</span>
                </div>
              </div>
              <Link href={`/patient/book/${doc.id}`} className="w-full">
                <Button className="w-full min-h-[40px] text-xs font-medium justify-between">
                  <span>See Available Times</span>
                  <CaretRight weight="bold" className="size-3.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded p-8 text-center">
          <p className="text-muted-foreground text-sm">
            No doctors found matching "{searchQuery}". Try selecting a different specialty.
          </p>
        </div>
      )}
    </div>
  )
}
