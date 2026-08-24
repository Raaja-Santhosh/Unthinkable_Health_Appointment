import { parseISO, format, addMinutes, startOfDay, endOfDay, setHours, setMinutes } from 'date-fns';
import { prisma } from '@/lib/prisma';

export type TimeSlot = {
  start: string;
  end: string;
  available: boolean;
};

export function generateTimeSlots(shiftStart: string, shiftEnd: string, slotDurationMinutes: number, date: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const baseDate = parseISO(date);
  
  const [startHour, startMin] = shiftStart.split(':').map(Number);
  const [endHour, endMin] = shiftEnd.split(':').map(Number);
  
  let currentStartTime = setMinutes(setHours(baseDate, startHour), startMin);
  const endTime = setMinutes(setHours(baseDate, endHour), endMin);
  
  while (currentStartTime < endTime) {
    const slotEnd = addMinutes(currentStartTime, slotDurationMinutes);
    if (slotEnd > endTime) {
      break;
    }
    slots.push({
      start: format(currentStartTime, 'HH:mm'),
      end: format(slotEnd, 'HH:mm'),
      available: true
    });
    currentStartTime = slotEnd;
  }
  
  return slots;
}

export async function getAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
  // doctorId here is the User id, not the DoctorProfile id
  const doctor = await prisma.doctorProfile.findFirst({
    where: { userId: doctorId }
  });

  if (!doctor) {
    return [];
  }

  // Parse workingHours JSON
  const workingHoursJson: any = typeof doctor.workingHours === 'string' 
    ? JSON.parse(doctor.workingHours) 
    : doctor.workingHours;
    
  if (!workingHoursJson) {
    return [];
  }
  
  // Get day of week
  const dayOfWeek = format(parseISO(date), 'EEEE').toLowerCase();
  const daySchedule = workingHoursJson[dayOfWeek];
  
  // If no working hours for that day, return empty array
  if (!daySchedule || !daySchedule.start || !daySchedule.end) {
    return [];
  }
  
  // Generate all slots
  const slots = generateTimeSlots(daySchedule.start, daySchedule.end, doctor.slotDuration, date);
  
  const targetDate = parseISO(date);
  const startOfTargetDay = startOfDay(targetDate);
  const endOfTargetDay = endOfDay(targetDate);

  // Check for doctor leaves on this date
  // The Leave model has: doctorId (User id), date (DateTime)
  const leaves = await prisma.leave.findMany({
    where: {
      doctorId: doctorId,
      date: {
        gte: startOfTargetDay,
        lte: endOfTargetDay
      }
    }
  });

  if (leaves.length > 0) {
    // Doctor is on leave — all slots unavailable
    return slots.map(slot => ({ ...slot, available: false }));
  }

  // Query existing BOOKED appointments for that doctor on that date
  // The Appointment model has: doctorId (User id), startTime, endTime, status
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorId,
      startTime: {
        gte: startOfTargetDay,
        lte: endOfTargetDay
      },
      status: 'BOOKED'
    }
  });

  // Check overlaps between slots and existing appointments
  return slots.map(slot => {
    const slotStartTime = setMinutes(setHours(targetDate, parseInt(slot.start.split(':')[0])), parseInt(slot.start.split(':')[1]));
    const slotEndTime = setMinutes(setHours(targetDate, parseInt(slot.end.split(':')[0])), parseInt(slot.end.split(':')[1]));
    
    const isBooked = appointments.some(app => {
      const appStart = new Date(app.startTime);
      const appEnd = new Date(app.endTime);
      
      // Overlap condition: slot starts before appointment ends AND slot ends after appointment starts
      return slotStartTime < appEnd && slotEndTime > appStart;
    });

    return {
      ...slot,
      available: !isBooked
    };
  });
}
