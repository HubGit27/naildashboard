'use server';

import { revalidatePath } from 'next/cache';
import prisma from './prisma';
import { AppointmentStatus } from '@prisma/client';

export async function updateAppointment(id: string, data: { 
    startTime: Date;
    endTime: Date;
    status: AppointmentStatus;
}) {
  try {
    await prisma.appointment.update({
      where: { id },
      data,
    });
    revalidatePath('/calander'); // Revalidate the calendar page to show the updated data
    return { success: true };
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return { success: false, error: 'Failed to update appointment' };
  }
}