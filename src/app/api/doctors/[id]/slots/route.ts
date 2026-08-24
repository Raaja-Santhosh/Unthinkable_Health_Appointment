import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/slots';
import { SlotQuerySchema } from '@/lib/validations';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const validatedQuery = SlotQuerySchema.safeParse({ date });
    if (!validatedQuery.success) {
      return NextResponse.json({ error: 'Validation Error', details: validatedQuery.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const slots = await getAvailableSlots(id, validatedQuery.data.date);

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
