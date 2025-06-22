import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Remove the .uuid() checks to allow for custom string IDs like "EMP-001"
const createAppointmentSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Customer phone number is required"),
  employeeId: z.string().min(1, "Invalid employee ID"),
  startTime: z.string().datetime("Invalid start time format"),
  serviceIds: z.array(z.string().min(1)).min(1, "At least one service must be selected"),
});

// --- NO OTHER CHANGES ARE NEEDED BELOW THIS LINE ---

// Function to add CORS headers to a response
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


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createAppointmentSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse = NextResponse.json({ error: validation.error.format() }, { status: 400 });
      return setCorsHeaders(errorResponse);
    }

    const { customerName, customerPhone, employeeId, startTime, serviceIds } = validation.data;
    
    const newAppointment = await prisma.$transaction(async (tx) => {
        const selectedServices = await tx.service.findMany({
            where: { id: { in: serviceIds } },
        });
        if (selectedServices.length !== serviceIds.length) throw new Error('One or more services are invalid.');

        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
        const endTime = new Date(new Date(startTime).getTime() + totalDuration * 60000);

        const customer = await tx.customer.upsert({
            where: { phone: customerPhone },
            update: { name: customerName },
            create: {
                id: crypto.randomUUID(),
                username: customerPhone,
                name: customerName,
                lastName: '',
                phone: customerPhone,
                address: '',
                bloodType: '',
                sex: 'FEMALE',
            },
        });

        const appointment = await tx.appointment.create({
            data: {
                customerId: customer.id,
                employeeId: employeeId,
                date: new Date(startTime),
                startTime: new Date(startTime),
                endTime: endTime,
                status: 'SCHEDULED',
            },
        });

        await tx.appointmentService.createMany({
            data: selectedServices.map(service => ({
                appointmentId: appointment.id,
                serviceId: service.id,
                price: service.price,
            })),
        });

        return tx.appointment.findUnique({
            where: { id: appointment.id },
            include: {
                customer: true,
                employee: { select: { firstName: true, lastName: true } },
                appointmentServices: { include: { service: true } }
            }
        });
    });

    // TODO: Trigger a WebSocket event here to notify the scheduler of the new appointment.

    const successResponse = NextResponse.json(newAppointment, { status: 201 });
    return setCorsHeaders(successResponse);

  } catch (error: any) {
    console.error('Failed to create appointment:', error);
    const errorResponse = NextResponse.json({ error: error.message || 'Error creating appointment' }, { status: 500 });
    return setCorsHeaders(errorResponse);
  }
}