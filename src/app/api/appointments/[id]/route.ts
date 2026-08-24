import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generatePostVisitSummary } from '@/lib/gemini';
import { deleteCalendarEvent } from '@/lib/calendar';
import { sendCancellationNotice } from '@/lib/email';
import { PostVisitNotesSchema } from '@/lib/validations';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        preVisitSummary: true,
        postVisitSummary: true,
        doctor: { include: { doctorProfile: true } },
        patient: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const role = session.user.role;
    const userId = session.user.id;
    if (role !== 'ADMIN' && appointment.patientId !== userId && appointment.doctorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    if (action === 'cancel') {
      if (role !== 'ADMIN' && appointment.patientId !== userId && appointment.doctorId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      if (appointment.googleEventId) {
        await deleteCalendarEvent(appointment.googleEventId).catch(console.error);
      }

      await sendCancellationNotice({
        patientEmail: appointment.patient.email,
        patientName: appointment.patient.name || 'Patient',
        doctorName: appointment.doctor.name || 'Doctor',
        date: appointment.startTime.toLocaleDateString(),
        time: appointment.startTime.toLocaleTimeString(),
      }).catch(console.error);

      return NextResponse.json({ appointment: updatedAppointment });
    } 
    
    if (action === 'complete') {
      if (role !== 'DOCTOR' || appointment.doctorId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { clinicalNotes } = body;
      const validatedNotes = PostVisitNotesSchema.safeParse({ clinicalNotes });
      if (!validatedNotes.success) {
        return NextResponse.json({ error: 'Validation Error', details: validatedNotes.error.issues.map(i => i.message).join(', ') }, { status: 400 });
      }

      let summaryText = 'Summary could not be generated.';
      let patientFriendlySummary = 'Could not generate summary.';
      let medicationSchedule = [];
      let followUpSteps = [];
      try {
        summaryText = await generatePostVisitSummary(validatedNotes.data.clinicalNotes);
        let parsed = JSON.parse(summaryText);
        patientFriendlySummary = parsed.patientFriendlySummary || summaryText;
        medicationSchedule = parsed.medicationSchedule || [];
        followUpSteps = parsed.followUpSteps || [];
      } catch (err) {
        console.error('Error generating post-visit summary:', err);
      }

      const postVisitSummary = await prisma.postVisitSummary.create({
        data: {
          appointmentId: id,
          clinicalNotes: validatedNotes.data.clinicalNotes,
          patientFriendlySummary: patientFriendlySummary,
          medicationSchedule: JSON.stringify(medicationSchedule),
          followUpSteps: JSON.stringify(followUpSteps),
        },
      });

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: { postVisitSummary: true },
      });

      return NextResponse.json({ appointment: updatedAppointment });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
