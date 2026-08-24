export const UserRole = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const AppointmentStatus = {
  BOOKED: 'BOOKED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

export const UrgencyLevel = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
} as const;

export type UrgencyLevel = typeof UrgencyLevel[keyof typeof UrgencyLevel];

export type TimeSlot = {
  start: string;
  end: string;
  available: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export type PreVisitResult = {
  urgency: UrgencyLevel;
  chiefComplaint: string;
  suggestedQuestions: string[];
  isEmergency?: boolean;
  emergencyMessage?: string;
};

export type MedicationItem = {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  warnings?: string;
};

export type PostVisitResult = {
  patientFriendlySummary: string;
  medicationSchedule: MedicationItem[];
  followUpSteps: string[];
  nextAppointmentSuggestion?: string;
};
