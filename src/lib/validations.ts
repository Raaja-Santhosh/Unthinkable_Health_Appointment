import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const BookAppointmentSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  date: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d >= new Date(new Date().setHours(0, 0, 0, 0));
  }, "Date must be a valid future or current date"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format"),
  symptoms: z.string().min(10, "Symptoms must be at least 10 characters").max(2000, "Symptoms must be at most 2000 characters"),
});

export const CancelAppointmentSchema = z.object({
  reason: z.string().optional(),
});

export const AddDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  specialization: z.string().min(2, "Specialization must be at least 2 characters"),
  slotDuration: z.number().min(15, "Slot duration must be at least 15").max(120, "Slot duration must be at most 120"),
  shiftStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Shift start must be in HH:mm format"),
  shiftEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Shift end must be in HH:mm format"),
});

export const AddLeaveSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  date: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d >= new Date(new Date().setHours(0, 0, 0, 0));
  }, "Date must be a valid future or current date"),
  reason: z.string().optional(),
});

export const PostVisitNotesSchema = z.object({
  clinicalNotes: z.string().min(20, "Clinical notes must be at least 20 characters").max(10000, "Clinical notes must be at most 10000 characters"),
});

export const SlotQuerySchema = z.object({
  date: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, "Date must be a valid ISO date string"),
});
