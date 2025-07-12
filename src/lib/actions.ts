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

export async function updateAppointmentWithServices(id: string, data: {
    startTime: Date;
    endTime: Date;
    status: AppointmentStatus;
    employeeId: string;
    services: { id: string; price: string }[];
}) {
    try {
        await prisma.$transaction(async (tx) => {
            // 1. Update the core appointment details
            await tx.appointment.update({
                where: { id },
                data: {
                    startTime: data.startTime,
                    endTime: data.endTime,
                    status: data.status,
                    employeeId: data.employeeId,
                },
            });

            // 2. Get the current services for the appointment
            const currentServices = await tx.appointmentService.findMany({
                where: { appointmentId: id },
                select: { serviceId: true },
            });
            const currentServiceIds = currentServices.map(s => s.serviceId);

            // 3. Determine which services to add and which to remove
            const newServiceIds = data.services.map(s => s.id);
            const servicesToAdd = newServiceIds.filter(sid => !currentServiceIds.includes(sid));
            const servicesToRemove = currentServiceIds.filter(sid => !newServiceIds.includes(sid));

            // 4. Add the new services
            if (servicesToAdd.length > 0) {
                await tx.appointmentService.createMany({
                    data: servicesToAdd.map(serviceId => ({
                        appointmentId: id,
                        serviceId,
                        price: data.services.find(s => s.id === serviceId)!.price,
                    })),
                });
            }

            // 5. Remove the old services
            if (servicesToRemove.length > 0) {
                await tx.appointmentService.deleteMany({
                    where: {
                        appointmentId: id,
                        serviceId: { in: servicesToRemove },
                    },
                });
            }
        });

        revalidatePath('/calander');
        return { success: true };
    } catch (error) {
        console.error('Failed to update appointment with services:', error);
        return { success: false, error: 'Failed to update appointment with services' };
    }
}