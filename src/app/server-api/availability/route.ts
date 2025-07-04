// FILE: app/api/availability/route.ts
// This is the core logic for the booking system. It calculates genuinely available time slots.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Function to add CORS headers to a response
function setCorsHeaders(response: NextResponse) {
  // Allow requests from any origin. For better security in production,
  // you might want to replace '*' with your specific frontend domain.
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

// Handle GET requests
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const dateStr = searchParams.get('date');
  const durationStr = searchParams.get('duration');

  if (!employeeId || !dateStr || !durationStr) {
    const errorResponse = NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
    return setCorsHeaders(errorResponse);
  }

  const date = new Date(dateStr);
  const duration = parseInt(durationStr, 10);
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

  try {
    // 1. Fetch employee's work schedule for that day
    const workSchedule = await prisma.schedule.findFirst({
      where: { employeeId, day: dayOfWeek, isTimeOff: false },
    });

    if (!workSchedule) {
      // No availability if not scheduled to work
      return setCorsHeaders(NextResponse.json([]));
    }
    
    // 2. Fetch existing appointments for the day
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        employeeId: employeeId,
        startTime: { gte: startOfDay, lt: endOfDay },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      orderBy: { startTime: 'asc' },
    });

    // 3. Generate and filter available slots
    const availableSlots: string[] = [];
    const slotInterval = 15; // Check every 15 minutes

    const workStartTime = new Date(date);
    workStartTime.setUTCHours(workSchedule.startTime.getUTCHours(), workSchedule.startTime.getUTCMinutes());
    
    const workEndTime = new Date(date);
    workEndTime.setUTCHours(workSchedule.endTime.getUTCHours(), workSchedule.endTime.getUTCMinutes());
    
    let currentSlot = new Date(workStartTime);

    while (currentSlot < workEndTime) {
      const potentialEndTime = new Date(currentSlot.getTime() + duration * 60000);

      if (potentialEndTime > workEndTime) break; // Slot extends beyond work hours

      let isConflict = false;
      for (const appt of existingAppointments) {
        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        if (currentSlot < appt.endTime && potentialEndTime > appt.startTime) {
          isConflict = true;
          break;
        }
      }

      if (!isConflict) {
        availableSlots.push(
          currentSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
        );
      }
      currentSlot.setMinutes(currentSlot.getMinutes() + slotInterval);
    }
    return setCorsHeaders(NextResponse.json(availableSlots));

  } catch (error) {
    console.error('Failed to fetch availability:', error);
    const errorResponse = NextResponse.json({ error: 'Error fetching availability' }, { status: 500 });
    return setCorsHeaders(errorResponse);
  }
}