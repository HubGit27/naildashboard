"use client";

import React, { useState, useEffect } from 'react';
import { Prisma } from '@prisma/client';
import { updateAppointment } from '@/lib/actions';

type AppointmentWithDetails = Omit<Prisma.AppointmentGetPayload<{
  include: {
    customer: true;
    employee: true;
    appointmentServices: {
      include: {
        service: true;
      };
    };
  };
}>, 'appointmentServices'> & {
  appointmentServices: (Omit<Prisma.AppointmentServiceGetPayload<{ include: { service: true } }>, 'price' | 'service'> & { 
    price: string; 
    service: Omit<Prisma.ServiceGetPayload<{}>, 'price'> & { price: string };
  })[];
};

interface AppointmentDetailsProps {
  appointment: AppointmentWithDetails;
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ appointment }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(appointment);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFormData(appointment);
    setIsEditing(false);
  }, [appointment]);

  if (!appointment) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select an appointment to see details.
      </div>
    );
  }

  const { id, customer, employee, startTime, endTime, appointmentServices, status } = formData;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    const dataToUpdate = {
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        status: formData.status,
    };

    const result = await updateAppointment(id, dataToUpdate);
    if (result.success) {
        setIsEditing(false);
    } else {
        // Handle error, maybe show a notification
        console.error(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-2xl font-bold text-gray-800">
          Appointment Details
        </h2>
        <div>
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="text-sm text-gray-600 hover:text-gray-900 mr-2">Cancel</button>
              <button onClick={handleSave} className="text-sm text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="text-sm text-white bg-gray-600 hover:bg-gray-700 rounded px-3 py-1">Edit</button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-lg mb-2 text-gray-700">Client</h3>
          {isEditing ? (
            <input type="text" name="customer.name" value={`${customer.name} ${customer.lastName}`} onChange={handleInputChange} className="w-full p-2 border rounded" readOnly />
          ) : (
            <p className="text-gray-600">{customer.name} {customer.lastName}</p>
          )}
          <p className="text-gray-500 text-sm">{customer.email}</p>
          <p className="text-gray-500 text-sm">{customer.phone}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-2 text-gray-700">Stylist</h3>
          {isEditing ? (
            <input type="text" name="employee.firstName" value={`${employee.firstName} ${employee.lastName}`} onChange={handleInputChange} className="w-full p-2 border rounded" readOnly />
          ) : (
            <p className="text-gray-600">{employee.firstName} {employee.lastName}</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2 text-gray-700">Timing</h3>
          {isEditing ? (
            <>
              <input type="datetime-local" name="startTime" value={new Date(startTime).toISOString().substring(0, 16)} onChange={handleInputChange} className="w-full p-2 border rounded mb-2" />
              <input type="datetime-local" name="endTime" value={new Date(endTime).toISOString().substring(0, 16)} onChange={handleInputChange} className="w-full p-2 border rounded" />
            </>
          ) : (
            <>
              <p className="text-gray-600">
                {new Date(startTime).toLocaleDateString()}
              </p>
              <p className="text-gray-500 text-sm">
                {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2 text-gray-700">Status</h3>
          {isEditing ? (
            <select name="status" value={status} onChange={handleInputChange} className="w-full p-2 border rounded">
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          ) : (
            <span className={`px-3 py-1 text-sm rounded-full font-medium ${
              status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {status}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-lg mb-2 text-gray-700">Services</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          {appointmentServices.map(as => (
            <li key={as.service.id}>
              {as.service.name} - <span className="font-medium">${as.price.toString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AppointmentDetails;
