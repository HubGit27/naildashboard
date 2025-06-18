// FILE: app/api/employees/route.ts
// This route provides a list of employees for the booking page.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json({ error: 'An error occurred while fetching employees' }, { status: 500 });
  }
}