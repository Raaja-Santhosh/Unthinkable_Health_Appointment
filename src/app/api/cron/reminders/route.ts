import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAppointmentReminder } from '@/lib/email';
import { addHours } from 'date-fns';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-cron-secret');
    if (authHeader !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const next24Hours = addHours(now, 24);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'BOOKED',
        startTime: {
          gt: now,
          lte: next24Hours,
        },
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    let count = 0;
    for (const app of appointments) {
      try {
        await sendAppointmentReminder({
          patientEmail: app.patient.email,
          patientName: app.patient.name || 'Patient',
          doctorName: app.doctor.name || 'Doctor',
          date: app.startTime.toLocaleDateString(),
          time: app.startTime.toLocaleTimeString(),
        });
        count++;
      } catch (err) {
        console.error(`Failed to send reminder for appointment ${app.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error running reminders cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
