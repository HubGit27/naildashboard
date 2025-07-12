
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateAppointmentSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  employeeId: z.string(),
});

// Function to set CORS headers
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const validation = updateAppointmentSchema.safeParse(body);

    if (!validation.success) {
      return setCorsHeaders(NextResponse.json({ error: validation.error.format() }, { status: 400 }));
    }

    const { startTime, endTime, employeeId } = validation.data;

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        employeeId: employeeId,
        date: new Date(startTime), // Also update the date field
      },
    });

    return setCorsHeaders(NextResponse.json(updatedAppointment));
  } catch (error: any) {
    console.error('Failed to update appointment:', error);
    return setCorsHeaders(NextResponse.json({ error: error.message || 'Error updating appointment' }, { status: 500 }));
  }
}
