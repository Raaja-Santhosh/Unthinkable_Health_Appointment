import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BookAppointmentSchema } from '@/lib/validations';
import { generatePreVisitSummary } from '@/lib/gemini';
import { createCalendarEvent } from '@/lib/calendar';
import { sendBookingConfirmation } from '@/lib/email';
import { parseISO, addMinutes } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    let doctorId = searchParams.get('doctorId');
    let patientId = searchParams.get('patientId');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const role = session.user.role;
    if (role === 'PATIENT') {
      patientId = session.user.id;
    } else if (role === 'DOCTOR') {
      doctorId = session.user.id;
    }

    const where: any = {};
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (date) {
      where.startTime = {
        gte: new Date(`${date}T00:00:00.000Z`),
        lt: new Date(`${date}T23:59:59.999Z`),
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          preVisitSummary: true,
          postVisitSummary: true,
          doctor: {
            include: { doctorProfile: true },
          },
          patient: true,
        },
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = BookAppointmentSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ error: 'Validation Error', details: validatedData.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const { doctorId, date, time } = validatedData.data;
    const patientId = session.user.id;

    // Fetch doctor's slotDuration
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: { doctorProfile: true },
    });

    if (!doctor || !doctor.doctorProfile) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const slotDuration = doctor.doctorProfile.slotDuration || 30;
    const startTime = parseISO(`${date}T${time}:00`);
    const endTime = addMinutes(startTime, slotDuration);

    // Transaction logic to prevent double booking
    const result = await prisma.$transaction(async (tx) => {
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          doctorId,
          status: 'BOOKED',
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (existingAppointment) {
        throw new Error('Slot already booked');
      }

      const patient = await tx.user.findUnique({ where: { id: patientId } });

      const appointment = await tx.appointment.create({
        data: {
          patientId,
          doctorId,
          startTime,
          endTime,
          status: 'BOOKED',
        },
        include: { doctor: true, patient: true },
      });

      const symptomsInput = body.symptoms || 'General consultation';
      // Generate Pre-Visit Summary
      try {
        const summaryText = await generatePreVisitSummary(symptomsInput);
        let parsedSummary: any = {};
        try {
          parsedSummary = JSON.parse(summaryText);
        } catch (e) {
          parsedSummary = { chiefComplaint: summaryText };
        }
        await tx.preVisitSummary.create({
          data: {
            appointmentId: appointment.id,
            rawSymptoms: symptomsInput,
            urgency: parsedSummary.urgency || 'MEDIUM',
            chiefComplaint: parsedSummary.chiefComplaint || 'Consultation',
            suggestedQuestions: JSON.stringify(parsedSummary.suggestedQuestions || []),
            isEmergency: parsedSummary.isEmergency || false,
            emergencyMessage: parsedSummary.emergencyMessage || null,
          }
        });
      } catch (err) {
        console.error('Error generating pre-visit summary:', err);
        // Fallback summary
        await tx.preVisitSummary.create({
          data: {
            appointmentId: appointment.id,
            rawSymptoms: symptomsInput,
            urgency: 'MEDIUM',
            chiefComplaint: 'Pre-visit summary could not be generated.',
            suggestedQuestions: JSON.stringify([]),
            isEmergency: false,
            emergencyMessage: null,
          }
        });
      }

      return appointment;
    });

    // Calendar & Email integrations outside transaction
    try {
      const eventDetails = {
        title: `Appointment: ${result.patient.name} & Dr. ${result.doctor.name}`,
        description: `Patient Appointment`,
        startTime: result.startTime,
        endTime: result.endTime,
        patientEmail: result.patient.email,
        doctorEmail: result.doctor.email,
      };
      const eventId = await createCalendarEvent(eventDetails);
      if (eventId) {
        await prisma.appointment.update({
          where: { id: result.id },
          data: { googleEventId: eventId },
        });
      }
    } catch (err) {
      console.error('Error creating calendar event:', err);
    }

    try {
      await sendBookingConfirmation({
        patientEmail: result.patient.email,
        patientName: result.patient.name || 'Patient',
        doctorName: result.doctor.name || 'Doctor',
        specialization: doctor.doctorProfile.specialization || 'General',
        date: startTime.toLocaleDateString(),
        time: startTime.toLocaleTimeString(),
      });
    } catch (err) {
      console.error('Error sending booking confirmation email:', err);
    }

    return NextResponse.json({ success: true, appointment: result }, { status: 201 });
  } catch (error: any) {
    console.error('Error booking appointment:', error);
    if (error.message === 'Slot already booked') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
