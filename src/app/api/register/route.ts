import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { RegisterSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = RegisterSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: 'Validation Error', details: validatedData.error.issues.map(i => i.message).join(', ') }, { status: 400 });
    }

    const { name, email, password } = validatedData.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'PATIENT',
      },
    });

    return NextResponse.json({ success: true, message: 'User created successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
