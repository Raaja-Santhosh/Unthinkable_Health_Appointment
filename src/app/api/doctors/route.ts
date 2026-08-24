import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where: any = { role: 'DOCTOR' };
    
    const doctorProfileWhere: any = {};
    if (specialty) doctorProfileWhere.specialization = specialty;
    if (activeOnly) doctorProfileWhere.isActive = true;

    if (Object.keys(doctorProfileWhere).length > 0) {
      where.doctorProfile = {
        isNot: null,
        ...doctorProfileWhere
      };
    } else {
      where.doctorProfile = { isNot: null };
    }

    if (search) {
      where.name = { contains: search };
    }

    const doctors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        doctorProfile: {
          select: {
            specialization: true,
            slotDuration: true,
            qualification: true,
            bio: true,
            consultationFee: true,
            isActive: true,
            workingHours: true,
          },
        },
      },
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
