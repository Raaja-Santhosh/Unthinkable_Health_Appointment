import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json({ error: 'doctorId and date are required' }, { status: 400 });
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const conflicts = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: 'BOOKED',
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: true,
      }
    });

    const appointments = conflicts.map(app => ({
      id: app.id,
      patientName: app.patient?.name || 'Unknown',
      patientEmail: app.patient?.email || 'Unknown',
      startTime: app.startTime,
      endTime: app.endTime,
    }));

    return NextResponse.json({ count: appointments.length, appointments });
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
