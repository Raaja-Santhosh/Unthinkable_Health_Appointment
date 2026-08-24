import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const passwordHashAdmin = await bcrypt.hash('admin123', 10);
  const passwordHashDoctor = await bcrypt.hash('doctor123', 10);
  const passwordHashPatient = await bcrypt.hash('patient123', 10);

  // 1 Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: {},
    create: {
      email: 'admin@clinic.com',
      name: 'Super Admin',
      passwordHash: passwordHashAdmin,
      role: 'ADMIN',
    },
  });

  // 5 Doctors
  const docsData = [
    {
      email: 'doctor@clinic.com',
      name: 'Dr. Sarah Chen',
      specialization: 'Cardiology',
      workingHours: JSON.stringify({
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
      }),
      slotDuration: 30,
    },
    {
      email: 'james.wilson@clinic.com',
      name: 'Dr. James Wilson',
      specialization: 'Dermatology',
      workingHours: JSON.stringify({
        monday: { start: '10:00', end: '18:00' },
        tuesday: { start: '10:00', end: '18:00' },
        wednesday: { start: '10:00', end: '18:00' },
        thursday: { start: '10:00', end: '18:00' },
        friday: { start: '10:00', end: '18:00' },
      }),
      slotDuration: 20,
    },
    {
      email: 'priya.sharma@clinic.com',
      name: 'Dr. Priya Sharma',
      specialization: 'Pediatrics',
      workingHours: JSON.stringify({
        monday: { start: '08:00', end: '16:00' },
        tuesday: { start: '08:00', end: '16:00' },
        wednesday: { start: '08:00', end: '16:00' },
        thursday: { start: '08:00', end: '16:00' },
        friday: { start: '08:00', end: '16:00' },
        saturday: { start: '08:00', end: '16:00' },
      }),
      slotDuration: 30,
    },
    {
      email: 'michael.brown@clinic.com',
      name: 'Dr. Michael Brown',
      specialization: 'Orthopedics',
      workingHours: JSON.stringify({
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
      }),
      slotDuration: 45,
    },
    {
      email: 'emily.davis@clinic.com',
      name: 'Dr. Emily Davis',
      specialization: 'General Practice',
      workingHours: JSON.stringify({
        monday: { start: '08:30', end: '17:30' },
        tuesday: { start: '08:30', end: '17:30' },
        wednesday: { start: '08:30', end: '17:30' },
        thursday: { start: '08:30', end: '17:30' },
        friday: { start: '08:30', end: '17:30' },
      }),
      slotDuration: 15,
    },
  ];

  const doctors = [];
  for (const doc of docsData) {
    const user = await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        email: doc.email,
        name: doc.name,
        passwordHash: passwordHashDoctor,
        role: 'DOCTOR',
        doctorProfile: {
          create: {
            specialization: doc.specialization,
            workingHours: doc.workingHours,
            slotDuration: doc.slotDuration,
          },
        },
      },
    });
    doctors.push(user);
  }

  // 3 Patients
  const patientsData = [
    { email: 'patient@clinic.com', name: 'John Doe', phone: '+1234567890' },
    { email: 'alice.johnson@clinic.com', name: 'Alice Johnson' },
    { email: 'robert.smith@clinic.com', name: 'Robert Smith' },
  ];

  const patients = [];
  for (const pt of patientsData) {
    const user = await prisma.user.upsert({
      where: { email: pt.email },
      update: {},
      create: {
        email: pt.email,
        name: pt.name,
        phone: pt.phone,
        passwordHash: passwordHashPatient,
        role: 'PATIENT',
      },
    });
    patients.push(user);
  }

  // 8 Sample Appointments with PreVisitSummaries
  const now = new Date();
  
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const getDayAtHours = (date: Date, hours: number) => {
    const result = new Date(date);
    result.setHours(hours, 0, 0, 0);
    return result;
  };

  const apptData = [
    // 3 BOOKED appointments
    {
      patientId: patients[0].id,
      doctorId: doctors[0].id,
      startTime: getDayAtHours(addDays(now, 1), 10),
      endTime: getDayAtHours(addDays(now, 1), 10.5),
      status: 'BOOKED',
      pre: {
        rawSymptoms: 'Chest pain',
        urgency: 'HIGH',
        chiefComplaint: 'Sharp pain in chest since morning',
        suggestedQuestions: 'When did it start? Is it radiating?',
        isEmergency: true,
        emergencyMessage: 'Patient reports sharp chest pain.',
      }
    },
    {
      patientId: patients[1].id,
      doctorId: doctors[1].id,
      startTime: getDayAtHours(addDays(now, 2), 11),
      endTime: getDayAtHours(addDays(now, 2), 11.33),
      status: 'BOOKED',
      pre: {
        rawSymptoms: 'Skin rash',
        urgency: 'LOW',
        chiefComplaint: 'Itchy rash on arm',
        suggestedQuestions: 'Any new allergies?',
      }
    },
    {
      patientId: patients[2].id,
      doctorId: doctors[2].id,
      startTime: getDayAtHours(addDays(now, 3), 14),
      endTime: getDayAtHours(addDays(now, 3), 14.5),
      status: 'BOOKED',
      pre: {
        rawSymptoms: 'Fever for child',
        urgency: 'MEDIUM',
        chiefComplaint: '101 fever for 2 days',
        suggestedQuestions: 'Eating well? Any vomiting?',
      }
    },
    // 3 COMPLETED appointments
    {
      patientId: patients[0].id,
      doctorId: doctors[3].id,
      startTime: getDayAtHours(addDays(now, -5), 10),
      endTime: getDayAtHours(addDays(now, -5), 10.75),
      status: 'COMPLETED',
      pre: {
        rawSymptoms: 'Knee pain',
        urgency: 'MEDIUM',
        chiefComplaint: 'Pain in right knee after running',
        suggestedQuestions: 'Any swelling?',
      },
      post: {
        clinicalNotes: 'Mild sprain in right knee ligaments.',
        patientFriendlySummary: 'You have a mild knee sprain. Rest and ice it.',
        medicationSchedule: JSON.stringify([{ medicationName: 'Ibuprofen', dosage: '400mg', frequency: 'Twice a day', duration: '5 days', instructions: 'Take after meals' }]),
        followUpSteps: JSON.stringify(['Ice for 20 mins daily', 'Avoid running for 2 weeks']),
      }
    },
    {
      patientId: patients[1].id,
      doctorId: doctors[4].id,
      startTime: getDayAtHours(addDays(now, -10), 9),
      endTime: getDayAtHours(addDays(now, -10), 9.25),
      status: 'COMPLETED',
      pre: {
        rawSymptoms: 'Headache',
        urgency: 'LOW',
        chiefComplaint: 'Frequent headaches',
        suggestedQuestions: 'Stress? Sleep pattern?',
      },
      post: {
        clinicalNotes: 'Tension headaches due to stress.',
        patientFriendlySummary: 'Your headaches are likely due to stress and lack of sleep.',
        medicationSchedule: JSON.stringify([]),
        followUpSteps: JSON.stringify(['Improve sleep hygiene', 'Consider mindfulness exercises']),
      }
    },
    {
      patientId: patients[2].id,
      doctorId: doctors[0].id,
      startTime: getDayAtHours(addDays(now, -15), 11),
      endTime: getDayAtHours(addDays(now, -15), 11.5),
      status: 'COMPLETED',
      pre: {
        rawSymptoms: 'Palpitations',
        urgency: 'MEDIUM',
        chiefComplaint: 'Heart racing at night',
        suggestedQuestions: 'Caffeine intake? Family history?',
      },
      post: {
        clinicalNotes: 'ECG normal. Likely benign palpitations, possibly caffeine induced.',
        patientFriendlySummary: 'Your heart is healthy. The racing might be from too much coffee.',
        medicationSchedule: JSON.stringify([]),
        followUpSteps: JSON.stringify(['Reduce caffeine to 1 cup a day']),
      }
    },
    // 2 CANCELLED appointments
    {
      patientId: patients[0].id,
      doctorId: doctors[1].id,
      startTime: getDayAtHours(addDays(now, -2), 15),
      endTime: getDayAtHours(addDays(now, -2), 15.33),
      status: 'CANCELLED',
      pre: {
        rawSymptoms: 'Acne',
        urgency: 'LOW',
        chiefComplaint: 'Breakout on face',
        suggestedQuestions: 'New products?',
      }
    },
    {
      patientId: patients[1].id,
      doctorId: doctors[2].id,
      startTime: getDayAtHours(addDays(now, -1), 16),
      endTime: getDayAtHours(addDays(now, -1), 16.5),
      status: 'CANCELLED',
      pre: {
        rawSymptoms: 'Cough',
        urgency: 'MEDIUM',
        chiefComplaint: 'Dry cough for 3 days',
        suggestedQuestions: 'Any fever?',
      }
    }
  ];

  for (let i = 0; i < apptData.length; i++) {
    const data = apptData[i];
    // Check if appointment already exists for this patient, doctor and time
    const existingAppt = await prisma.appointment.findFirst({
      where: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        startTime: data.startTime,
      }
    });

    if (!existingAppt) {
      const appt = await prisma.appointment.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          startTime: data.startTime,
          endTime: data.endTime,
          status: data.status,
          preVisitSummary: {
            create: data.pre
          },
          ...(data.post && {
            postVisitSummary: {
              create: data.post
            }
          })
        }
      });
    }
  }

  // 1 Leave Record
  const existingLeave = await prisma.leave.findFirst({
    where: {
      doctorId: doctors[0].id,
      reason: 'Medical Conference'
    }
  });

  if (!existingLeave) {
    await prisma.leave.create({
      data: {
        doctorId: doctors[0].id,
        date: getDayAtHours(addDays(now, 14), 0),
        reason: 'Medical Conference'
      }
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
