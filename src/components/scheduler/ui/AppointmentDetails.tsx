"use client";

import React, { useState, useEffect } from 'react';
import { Prisma } from '@prisma/client';
import { updateAppointmentWithServices } from '@/lib/actions';

type AppointmentWithDetails = Omit<Prisma.AppointmentGetPayload<{
  include: {
    customer: true;
    employee: true;
    appointmentServices: {
      include: {
        service: true;
      };
    };
    payment: true;
  };
}>, 'appointmentServices' | 'payment'> & {
  appointmentServices: (Omit<Prisma.AppointmentServiceGetPayload<{ include: { service: true } }>, 'price' | 'service'> & { 
    price: string; 
    service: Omit<Prisma.ServiceGetPayload<{}>, 'price'> & { price: string };
  })[];
  payment: (Omit<Prisma.PaymentGetPayload<{}>, 'amount' | 'tip' | 'tax' | 'total'> & { 
    amount: string; 
    tip: string; 
    tax: string; 
    total: string; 
  }) | null;
};

interface AppointmentDetailsProps {
  appointment: AppointmentWithDetails;
  allServices: (Omit<Prisma.ServiceGetPayload<{}>, 'price'> & { price: string })[];
  allEmployees: { id: string; name: string; }[];
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ appointment, allServices, allEmployees }) => {
  const [originalData, setOriginalData] = useState(appointment);
  const [formData, setFormData] = useState(appointment);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [selectedService, setSelectedService] = useState('');

  useEffect(() => {
    setOriginalData(appointment);
    setFormData(appointment);
    setHasChanges(false);
  }, [appointment]);

  // Check if there are changes whenever formData updates
  useEffect(() => {
    const checkForChanges = () => {
      const changes = 
        formData.employeeId !== originalData.employeeId ||
        new Date(formData.startTime).getTime() !== new Date(originalData.startTime).getTime() ||
        new Date(formData.endTime).getTime() !== new Date(originalData.endTime).getTime() ||
        formData.status !== originalData.status ||
        (formData.notes || '') !== (originalData.notes || '') ||
        formData.appointmentServices.length !== originalData.appointmentServices.length ||
        formData.appointmentServices.some((service, index) => 
          !originalData.appointmentServices[index] || 
          service.serviceId !== originalData.appointmentServices[index].serviceId ||
          service.price !== originalData.appointmentServices[index].price
        );
      
      setHasChanges(changes);
    };

    const validateTimes = () => {
      const startTime = new Date(formData.startTime);
      const endTime = new Date(formData.endTime);
      
      if (endTime <= startTime) {
        setValidationError('End time must be after start time');
      } else {
        setValidationError('');
      }
    };

    checkForChanges();
    validateTimes();
  }, [formData, originalData]);

  if (!appointment) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select an appointment to see details.
      </div>
    );
  }

  const { id, customer, employee, startTime, endTime, appointmentServices, status } = formData;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'employeeId') {
        const selectedEmployee = allEmployees.find(emp => emp.id === value);
        if(selectedEmployee) {
            setFormData(prev => ({
                ...prev,
                employeeId: selectedEmployee.id,
                employee: { ...prev.employee, id: selectedEmployee.id, firstName: selectedEmployee.name.split(' ')[0], lastName: selectedEmployee.name.split(' ')[1] || '' }
            }));
        }
    } else if (name === 'notes') {
        setFormData(prev => ({
            ...prev,
            notes: value,
        }));
    } else if (name === 'appointmentDate') {
        // Update both start and end time with new date, keeping existing times
        const currentStartTime = new Date(formData.startTime);
        const currentEndTime = new Date(formData.endTime);
        
        // Parse the date input value (YYYY-MM-DD) and create new dates in local timezone
        const [year, month, day] = value.split('-').map(Number);
        
        const newStartTime = new Date(year, month - 1, day, currentStartTime.getHours(), currentStartTime.getMinutes());
        const newEndTime = new Date(year, month - 1, day, currentEndTime.getHours(), currentEndTime.getMinutes());
        
        setFormData(prev => ({
            ...prev,
            startTime: newStartTime,
            endTime: newEndTime,
        }));
    } else if (name === 'startTimeOnly') {
        // Update start time, keeping existing date
        const currentDate = new Date(formData.startTime);
        const [hours, minutes] = value.split(':').map(Number);
        const newStartTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);
        
        setFormData(prev => ({
            ...prev,
            startTime: newStartTime,
        }));
    } else if (name === 'endTimeOnly') {
        // Update end time, keeping existing date
        const currentDate = new Date(formData.endTime);
        const [hours, minutes] = value.split(':').map(Number);
        const newEndTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);
        
        setFormData(prev => ({
            ...prev,
            endTime: newEndTime,
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    }
  };

  const handleAddService = (serviceId: string) => {
    const serviceToAdd = allServices.find(s => s.id === serviceId);
    if (serviceToAdd && !formData.appointmentServices.some(as => as.serviceId === serviceId)) {
      const newAppointmentService = {
        id: `new-${Math.random()}`,
        appointmentId: id,
        serviceId: serviceToAdd.id,
        price: serviceToAdd.price,
        service: serviceToAdd,
      };
      setFormData(prev => ({
        ...prev,
        appointmentServices: [...prev.appointmentServices, newAppointmentService],
      }));
    }
  };

  const handleRemoveService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      appointmentServices: prev.appointmentServices.filter(as => as.serviceId !== serviceId),
    }));
  };

  const handleCancel = () => {
    setFormData(originalData);
    setHasChanges(false);
    setValidationError('');
  };

  const handleSave = async () => {
    // Don't save if there are validation errors
    if (validationError) {
      return;
    }

    setIsLoading(true);
    const dataToUpdate = {
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        status: formData.status,
        employeeId: formData.employeeId,
        services: formData.appointmentServices.map(as => ({ id: as.serviceId, price: as.price.toString() })),
    };

    const result = await updateAppointmentWithServices(id, dataToUpdate);
    if (result.success) {
        setOriginalData(formData);
        setHasChanges(false);
        setValidationError('');
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
        {hasChanges && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-amber-600 mr-2">Unsaved changes</span>
          
          </div>
        )}
      </div>
      
      {validationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{validationError}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-lg mb-2 text-gray-700">Client</h3>
          <p className="text-gray-600">{customer.name} {customer.lastName}</p>
          <p className="text-gray-500 text-sm">{customer.email}</p>
          <p className="text-gray-500 text-sm">{customer.phone}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-lg mb-2 text-gray-700">Stylist</h3>
          <select 
            name="employeeId" 
            value={employee.id} 
            onChange={handleInputChange} 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {allEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2 text-gray-700">Date</h3>
          <input 
            type="date" 
            name="appointmentDate" 
            value={(() => {
              const date = new Date(startTime);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })()} 
            onChange={handleInputChange} 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2 text-gray-700">Start Time</h3>
          <input 
            type="time" 
            name="startTimeOnly" 
            value={(() => {
              const date = new Date(startTime);
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${hours}:${minutes}`;
            })()} 
            onChange={handleInputChange} 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2 text-gray-700">End Time</h3>
          <input 
            type="time" 
            name="endTimeOnly" 
            value={(() => {
              const date = new Date(endTime);
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${hours}:${minutes}`;
            })()} 
            onChange={handleInputChange} 
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>

        <div className="md:col-span-2">
          <h3 className="font-semibold text-lg mb-2 text-gray-700">Status</h3>
          <select 
            name="status" 
            value={status} 
            onChange={handleInputChange} 
            className="w-full md:w-1/2 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="WAITING">Waiting</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-lg mb-2 text-gray-700">Services</h3>
        <div className="space-y-2">
          {appointmentServices.map(as => (
            <div key={as.serviceId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div>
                <span className="font-medium">{as.service.name}</span>
                <span className="text-sm text-gray-500 ml-2">${as.price}</span>
              </div>
              <button
                onClick={() => handleRemoveService(as.serviceId)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>Select a service to add</option>
            {allServices
              .filter(s => !appointmentServices.some(as => as.serviceId === s.id))
              .map(s => (
                <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (selectedService) {
                handleAddService(selectedService);
                setSelectedService('');
              }
            }}
            disabled={!selectedService}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-lg mb-2 text-gray-700">Notes</h3>
        <textarea 
          name="notes" 
          value={formData.notes || ''} 
          onChange={handleInputChange} 
          placeholder="Add notes about this appointment..."
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
        />
      </div>

      {formData.payment && (
        <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2 text-gray-700">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong>Amount:</strong> ${formData.payment.amount}</p>
                <p><strong>Tip:</strong> ${formData.payment.tip}</p>
                <p><strong>Tax:</strong> ${formData.payment.tax}</p>
                <p><strong>Total:</strong> ${formData.payment.total}</p>
                <p><strong>Method:</strong> {formData.payment.method}</p>
                <p><strong>Status:</strong> {formData.payment.status}</p>
            </div>
        </div>
      )}
      {hasChanges && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-amber-600 mr-2">Unsaved changes</span>
          <button 
            onClick={handleCancel} 
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className={`text-sm text-white rounded px-3 py-1 ${
              validationError 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50`}
            disabled={isLoading || !!validationError}
            title={validationError || ''}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
      <div className="mt-6 text-xs text-gray-400">
        <p>Created: {new Date(formData.createdAt).toLocaleString()}</p>
        <p>Last Updated: {new Date(formData.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default AppointmentDetails;
