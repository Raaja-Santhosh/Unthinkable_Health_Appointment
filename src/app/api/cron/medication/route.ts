import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMedicationReminder } from '@/lib/email';
import { subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-cron-secret');
    if (authHeader !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const fourteenDaysAgo = subDays(now, 14);

    const summaries = await prisma.postVisitSummary.findMany({
      where: {
        appointment: {
          status: 'COMPLETED',
          startTime: {
            gte: fourteenDaysAgo,
            lte: now,
          }
        },
      },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
          }
        }
      },
    });

    let count = 0;
    for (const record of summaries) {
      try {
        let medications = [];
        try {
           if (record.medicationSchedule) {
               medications = JSON.parse(record.medicationSchedule);
           }
        } catch (e) {
        }

        const app = record.appointment;
        await sendMedicationReminder({
          patientEmail: app.patient.email,
          patientName: app.patient.name || 'Patient',
          doctorName: app.doctor.name || 'Doctor',
          medications: Array.isArray(medications) && medications.length ? medications : ['Please review your prescribed medications'],
        });
        count++;
      } catch (err) {
        console.error(`Failed to send medication reminder for summary ${record.id}:`, err);
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Error running medication cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
