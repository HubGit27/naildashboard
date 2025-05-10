import { Day, PrismaClient, UserSex, Role, AppointmentStatus, TransactionType, PaymentMethod, PaymentStatus  } from "@prisma/client";
const prisma = new PrismaClient();
import * as bcrypt from 'bcrypt';


async function loadNailStoreData() {
    await clearDatabase();
    // Create seed data
    await seedUsers();
    await seedCustomers();
    await seedServices();
    await seedProducts();
    await seedEmployees();
    await seedSchedules();
    await seedAppointments();
    await seedSettings();
}

async function clearDatabase(){
    // List of all potential models in order of dependency
    const models = [
      "User",
      "Employee",
      "Customer",
      "Appointment",
      "Schedule",
      "Service",
      "AppointmentService",
      "Product",
      "InventoryTransaction",
      "Payment",
      "Commission",
      "OrderItem",
      "Setting",
      "Admin",
      "Student",
      "Teacher",
      "Parent",
      "Grade",
      "Class",
      "Subject",
      "Lesson",
      "Exam",
      "Assignment",
      "Result",
      "Attendance",
      "Event",
      "Announcement"
    ];
    
    // Check each model and clear if it exists
    for (const model of models) {
      try {
        if (model in prisma) {
          await (prisma as any)[model].deleteMany({});
          console.log(`Cleared ${model} table`);
        }
      } catch (error) {
        console.log(`Note: Could not clear ${model} table - it may not exist in the schema`);
      }
    }
    
    console.log('Database cleared where possible');
}


async function seedUsers() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@nailsalon.com',
      password: adminPassword,
      role: Role.ADMIN,
    }
  });
  
  // Create owner user
  const ownerPassword = await bcrypt.hash('owner123', 10);
  await prisma.user.create({
    data: {
      email: 'owner@nailsalon.com',
      password: ownerPassword,
      role: Role.OWNER,
    }
  });
  
  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10);
  await prisma.user.create({
    data: {
      email: 'manager@nailsalon.com',
      password: managerPassword,
      role: Role.MANAGER,
    }
  });
  
  // Create staff users
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staffUsers = [
    { email: 'john@nailsalon.com' },
    { email: 'sarah@nailsalon.com' },
    { email: 'mike@nailsalon.com' },
    { email: 'lisa@nailsalon.com' },
  ];
  
  for (const user of staffUsers) {
    await prisma.user.create({
      data: {
        email: user.email,
        password: staffPassword,
        role: Role.STAFF,
      }
    });
  }
  
  console.log('Users seeded');
}

async function seedStores() {
  // Get the owner user
  const owner = await prisma.user.findFirst({
    where: { role: Role.OWNER }
  });
  
  if (!owner) {
    console.log('Owner user not found, cannot create store');
    return;
  }
  
  // Create a store linked to the owner
  await prisma.store.create({
    data: {
      storeName: 'Glamour Nails & Spa',
      address: '123 Beauty Blvd, Style City, SC 12345',
      ownerId: owner.id
    }
  });
  
  console.log('Stores seeded');
}

async function seedCustomers() {
  const customers = [
    {
      id: 'CUST-001',
      username: 'emmaj',
      name: 'Emma',
      lastName: 'Johnson',
      email: 'emma.johnson@example.com',
      phone: '555-123-4567',
      address: '123 Oak Street, Anytown, AT 12345',
      img: 'https://example.com/profiles/emma.jpg',
      bloodType: 'O+',
      sex: UserSex.FEMALE,
      birthday: new Date('1990-05-15'),
      notes: 'Prefers gel nails',
      loyaltyPoints: 120
    },
    {
      id: 'CUST-002',
      username: 'jamessmith',
      name: 'James',
      lastName: 'Smith',
      email: 'james.smith@example.com',
      phone: '555-234-5678',
      address: '456 Pine Avenue, Othertown, OT 67890',
      img: 'https://example.com/profiles/james.jpg',
      bloodType: 'A+',
      sex: UserSex.MALE,
      birthday: new Date('1985-11-22'),
      notes: 'Allergic to certain polishes',
      loyaltyPoints: 75
    },
    {
      id: 'CUST-003',
      username: 'sophiaw',
      name: 'Sophia',
      lastName: 'Williams',
      email: 'sophia.williams@example.com',
      phone: '555-345-6789',
      address: '789 Maple Drive, Somewhere, SW 13579',
      img: 'https://example.com/profiles/sophia.jpg',
      bloodType: 'B-',
      sex: UserSex.FEMALE,
      birthday: new Date('1992-08-10'),
      notes: 'VIP customer, always tips well',
      loyaltyPoints: 250
    },
    {
      id: 'CUST-004',
      username: 'michaelb',
      name: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@example.com',
      phone: '555-456-7890',
      address: '321 Cedar Court, Nowhere, NW 97531',
      img: null,
      bloodType: 'AB+',
      sex: UserSex.MALE,
      birthday: new Date('1988-02-28'),
      notes: 'First-time customer',
      loyaltyPoints: 0
    },
    {
      id: 'CUST-005',
      username: 'oliviaj',
      name: 'Olivia',
      lastName: 'Jones',
      email: 'olivia.jones@example.com',
      phone: '555-567-8901',
      address: '654 Birch Street, Anyplace, AP 24680',
      img: 'https://example.com/profiles/olivia.jpg',
      bloodType: 'O-',
      sex: UserSex.FEMALE,
      birthday: new Date('1995-04-12'),
      notes: 'Regular bi-weekly appointment',
      loyaltyPoints: 180
    }
  ];
  
  for (const customer of customers) {
    // Convert the enum string to the actual enum value
    const sexValue = customer.sex as UserSex;
    
    try {
      await prisma.customer.create({
        data: customer
      });
    } catch (error) {
      console.log(`Error creating customer ${customer.username}:`, error);
    }
  }
  
  console.log('Customers seeded');
}

async function seedServices() {
  const services = [
    {
      name: 'Basic Manicure',
      description: 'Includes nail shaping, cuticle care, hand massage, and regular polish.',
      duration: 30,
      price: 25,
      category: 'Manicure'
    },
    {
      name: 'Gel Manicure',
      description: 'Includes nail shaping, cuticle care, hand massage, and gel polish.',
      duration: 45,
      price: 35,
      category: 'Manicure'
    },
    {
      name: 'Basic Pedicure',
      description: 'Includes nail shaping, cuticle care, foot scrub, foot massage, and regular polish.',
      duration: 45,
      price: 35,
      category: 'Pedicure'
    },
    {
      name: 'Deluxe Pedicure',
      description: 'Includes nail shaping, cuticle care, exfoliation, foot mask, extended massage, and polish.',
      duration: 60,
      price: 50,
      category: 'Pedicure'
    },
    {
      name: 'Nail Art',
      description: 'Custom nail art designs.',
      duration: 15,
      price: 10,
      category: 'Add-on'
    },
    {
      name: 'Acrylic Full Set',
      description: 'Full set of acrylic nails.',
      duration: 75,
      price: 60,
      category: 'Acrylic'
    },
    {
      name: 'Acrylic Fill',
      description: 'Fill-in for acrylic nails.',
      duration: 60,
      price: 40,
      category: 'Acrylic'
    },
    {
      name: 'Nail Repair',
      description: 'Repair for broken nails.',
      duration: 15,
      price: 5,
      category: 'Add-on'
    },
    {
      name: 'Polish Change',
      description: 'Removal and application of new polish.',
      duration: 15,
      price: 15,
      category: 'Basic'
    },
    {
      name: 'Mani-Pedi Combo',
      description: 'Basic manicure and pedicure package.',
      duration: 75,
      price: 55,
      category: 'Package'
    }
  ];
  
  for (const service of services) {
    await prisma.service.create({
      data: service
    });
  }
  
  console.log('Services seeded');
}

async function seedProducts() {
  const products = [
    {
      name: 'OPI Red Nail Polish',
      description: 'Classic red nail polish from OPI',
      brand: 'OPI',
      sku: 'OPI-RED-001',
      barcode: '1234567890123',
      price: 12.99,
      cost: 6.50,
      quantity: 25,
      reorderPoint: 5,
      category: 'Nail Polish'
    },
    {
      name: 'Essie Top Coat',
      description: 'Clear top coat for extended wear',
      brand: 'Essie',
      sku: 'ESSIE-TOP-001',
      barcode: '2345678901234',
      price: 10.99,
      cost: 5.25,
      quantity: 20,
      reorderPoint: 5,
      category: 'Nail Polish'
    },
    {
      name: 'Cuticle Oil',
      description: 'Hydrating cuticle oil with vitamin E',
      brand: 'CND',
      sku: 'CND-OIL-001',
      barcode: '3456789012345',
      price: 8.99,
      cost: 4.00,
      quantity: 15,
      reorderPoint: 3,
      category: 'Nail Care'
    },
    {
      name: 'Hand Lotion',
      description: 'Moisturizing hand lotion, 8oz',
      brand: 'Aveeno',
      sku: 'AVEENO-HL-001',
      barcode: '4567890123456',
      price: 14.99,
      cost: 7.25,
      quantity: 18,
      reorderPoint: 4,
      category: 'Skincare'
    },
    {
      name: 'Nail File Set',
      description: 'Set of 3 professional nail files',
      brand: 'Salon Pro',
      sku: 'SP-FILE-001',
      barcode: '5678901234567',
      price: 6.99,
      cost: 2.50,
      quantity: 30,
      reorderPoint: 8,
      category: 'Tools'
    }
  ];
  
  for (const product of products) {
    await prisma.product.create({
      data: product
    });
  }
  
  console.log('Products seeded');
}

async function seedEmployees() {
  const employees = [
    {
      id: 'EMP-001',
      username: 'johnd',
      firstName: 'John',
      lastName: 'Davis',
      email: 'john@nailsalon.com',
      phone: '555-111-2222',
      address: '123 Staff Lane, Employeeville, EV 12345',
      img: 'https://example.com/profiles/john.jpg',
      sex: UserSex.MALE,
      position: 'Nail Technician',
      hireDate: new Date('2020-06-15'),
      birthday: new Date('1988-03-20')
    },
    {
      id: 'EMP-002',
      username: 'sarahm',
      firstName: 'Sarah',
      lastName: 'Miller',
      email: 'sarah@nailsalon.com',
      phone: '555-222-3333',
      address: '456 Worker Street, Employeeville, EV 12345',
      img: 'https://example.com/profiles/sarah.jpg',
      sex: UserSex.FEMALE,
      position: 'Senior Nail Technician',
      hireDate: new Date('2018-03-10'),
      birthday: new Date('1985-07-15')
    },
    {
      id: 'EMP-003',
      username: 'mikew',
      firstName: 'Mike',
      lastName: 'Wilson',
      email: 'mike@nailsalon.com',
      phone: '555-333-4444',
      address: '789 Service Road, Employeeville, EV 12345',
      img: null,
      sex: UserSex.MALE,
      position: 'Nail Technician',
      hireDate: new Date('2021-01-05'),
      birthday: new Date('1990-11-30')
    },
    {
      id: 'EMP-004',
      username: 'lisat',
      firstName: 'Lisa',
      lastName: 'Taylor',
      email: 'lisa@nailsalon.com',
      phone: '555-444-5555',
      address: '321 Reception Ave, Employeeville, EV 12345',
      img: 'https://example.com/profiles/lisa.jpg',
      sex: UserSex.FEMALE,
      position: 'Receptionist',
      hireDate: new Date('2022-02-20'),
      birthday: new Date('1992-04-10')
    }
  ];
  
  for (const employee of employees) {
    // Convert the enum string to the actual enum value
    const sexValue = employee.sex as UserSex;
    
    try {
      await prisma.employee.create({
        data: employee
      });
    } catch (error) {
      console.log(`Error creating employee ${employee.username}:`, error);
    }
  }
  
  console.log('Employees seeded');
}

async function seedSchedules() {
  const employees = await prisma.employee.findMany();
  
  for (const employee of employees) {
    // Skip scheduling for receptionist
    if (employee.position === 'Receptionist') continue;
    
    // Create schedule for each day (Mon-Sat)
    for (let day = 1; day <= 6; day++) {
      await prisma.schedule.create({
        data: {
          employeeId: employee.id,
          day: day,
          startTime: new Date(`2023-01-01T09:00:00`),
          endTime: new Date(`2023-01-01T17:00:00`),
          isTimeOff: false
        }
      });
    }
    
    // Add some time off
    if (employee.firstName === 'Sarah') {
      await prisma.schedule.create({
        data: {
          employeeId: employee.id,
          day: 3, // Wednesday
          startTime: new Date(`2023-01-01T09:00:00`),
          endTime: new Date(`2023-01-01T17:00:00`),
          isTimeOff: true
        }
      });
    }
    
    if (employee.firstName === 'John') {
      await prisma.schedule.create({
        data: {
          employeeId: employee.id,
          day: 5, // Friday
          startTime: new Date(`2023-01-01T09:00:00`),
          endTime: new Date(`2023-01-01T17:00:00`),
          isTimeOff: true
        }
      });
    }
  }
  
  console.log('Schedules seeded');
}

async function seedAppointments() {
  const customers = await prisma.customer.findMany();
  const employees = await prisma.employee.findMany({
    where: {
      position: {
        contains: 'Technician'
      }
    }
  });
  const services = await prisma.service.findMany();
  
  // Helper to get random item from array
  const getRandomItem = (arr: string | any[]) => arr[Math.floor(Math.random() * arr.length)];
  
  // Create some past appointments
  const pastAppointments = [
    {
      customerId: customers[0].id,
      employeeId: employees[0].id,
      date: new Date('2023-04-15'),
      startTime: new Date('2023-04-15T10:00:00'),
      endTime: new Date('2023-04-15T11:30:00'),
      status: AppointmentStatus.COMPLETED,
      notes: 'Customer very satisfied',
      services: [services[0], services[4]] // Basic Manicure + Nail Art
    },
    {
      customerId: customers[1].id,
      employeeId: employees[1].id,
      date: new Date('2023-04-16'),
      startTime: new Date('2023-04-16T14:00:00'),
      endTime: new Date('2023-04-16T15:00:00'),
      status: AppointmentStatus.COMPLETED,
      services: [services[2]] // Basic Pedicure
    },
    {
      customerId: customers[2].id,
      employeeId: employees[0].id,
      date: new Date('2023-04-17'),
      startTime: new Date('2023-04-17T11:00:00'),
      endTime: new Date('2023-04-17T12:15:00'),
      status: AppointmentStatus.COMPLETED,
      services: [services[1]] // Gel Manicure
    }
  ];
  
  for (const appt of pastAppointments) {
    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId: appt.customerId,
        employeeId: appt.employeeId,
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status,
        notes: appt.notes || null
      }
    });
    
    // Add the services
    let totalAmount = 0;
    for (const service of appt.services) {
      await prisma.appointmentService.create({
        data: {
          appointmentId: appointment.id,
          serviceId: service.id,
          price: service.price
        }
      });
      totalAmount += Number(service.price);
    }
    
    // Create payment record
    const tip = parseFloat((totalAmount * 0.15).toFixed(2)); // 15% tip
    const tax = parseFloat((totalAmount * 0.08).toFixed(2)); // 8% tax
    const total = parseFloat((totalAmount + tip + tax).toFixed(2));
    
    const paymentMethods = [
      PaymentMethod.CASH, 
      PaymentMethod.CREDIT_CARD, 
      PaymentMethod.DEBIT_CARD
    ];
    
    const payment = await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        customerId: appt.customerId,
        amount: totalAmount,
        tip: tip,
        tax: tax,
        total: total,
        method: getRandomItem(paymentMethods),
        status: PaymentStatus.COMPLETED,
        externalId: `POS-${Math.floor(Math.random() * 1000000)}`
      }
    });
    
    // Create commission for the employee
    await prisma.commission.create({
      data: {
        employeeId: appt.employeeId,
        paymentId: payment.id,
        amount: parseFloat((totalAmount * 0.4).toFixed(2)), // 40% commission
        rate: 0.4,
        isPaid: true,
        paidDate: new Date()
      }
    });
  }
  
  // Create some upcoming appointments
  const upcomingAppointments = [
    {
      customerId: customers[3].id,
      employeeId: employees[1].id,
      date: new Date(Date.now() + 86400000), // Tomorrow
      startTime: new Date(new Date(Date.now() + 86400000).setHours(9, 0, 0)), // 9 AM
      endTime: new Date(new Date(Date.now() + 86400000).setHours(10, 15, 0)), // 10:15 AM
      status: AppointmentStatus.CONFIRMED,
      notes: null,
      services: [services[3]] // Deluxe Pedicure
    },
    {
      customerId: customers[4].id,
      employeeId: employees[0].id,
      date: new Date(Date.now() + 172800000), // Day after tomorrow
      startTime: new Date(new Date(Date.now() + 172800000).setHours(13, 0, 0)), // 1 PM
      endTime: new Date(new Date(Date.now() + 172800000).setHours(14, 15, 0)), // 2:15 PM
      status: AppointmentStatus.SCHEDULED,
      notes: null,
      services: [services[9]] // Mani-Pedi Combo
    },
    {
      customerId: customers[0].id,
      employeeId: employees[2].id,
      date: new Date(Date.now() + 259200000), // 3 days from now
      startTime: new Date(new Date(Date.now() + 259200000).setHours(16, 0, 0)), // 4 PM
      endTime: new Date(new Date(Date.now() + 259200000).setHours(17, 15, 0)), // 5:15 PM
      status: AppointmentStatus.SCHEDULED,
      notes: null,
      services: [services[5]] // Acrylic Full Set
    }
  ];
  
  for (const appt of upcomingAppointments) {
    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId: appt.customerId,
        employeeId: appt.employeeId,
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status,
        notes: appt.notes || null
      }
    });
    
    // Add the services
    for (const service of appt.services) {
      await prisma.appointmentService.create({
        data: {
          appointmentId: appointment.id,
          serviceId: service.id,
          price: service.price
        }
      });
    }
  }
  
  console.log('Appointments seeded');
}

async function seedSettings() {
  const settings = [
    {
      key: 'business_name',
      value: 'Glamour Nails & Spa',
      description: 'Name of the business'
    },
    {
      key: 'business_address',
      value: '123 Beauty Blvd, Style City, SC 12345',
      description: 'Physical address of the business'
    },
    {
      key: 'business_phone',
      value: '555-888-9999',
      description: 'Primary phone number'
    },
    {
      key: 'business_email',
      value: 'info@glamournails.com',
      description: 'Primary email address'
    },
    {
      key: 'business_hours',
      value: JSON.stringify({
        monday: { open: '9:00', close: '18:00' },
        tuesday: { open: '9:00', close: '18:00' },
        wednesday: { open: '9:00', close: '18:00' },
        thursday: { open: '9:00', close: '18:00' },
        friday: { open: '9:00', close: '20:00' },
        saturday: { open: '9:00', close: '17:00' },
        sunday: { open: 'closed', close: 'closed' }
      }),
      description: 'Business operating hours'
    },
    {
      key: 'tax_rate',
      value: '8.0',
      description: 'Sales tax rate percentage'
    },
    {
      key: 'default_commission_rate',
      value: '40.0',
      description: 'Default commission rate percentage for technicians'
    },
    {
      key: 'appointment_reminder_hours',
      value: '24',
      description: 'Hours before appointment to send reminder'
    },
    {
      key: 'loyalty_points_per_dollar',
      value: '1',
      description: 'Loyalty points earned per dollar spent'
    },
    {
      key: 'points_for_reward',
      value: '100',
      description: 'Points needed for a reward'
    },
    {
      key: 'reward_amount',
      value: '10.00',
      description: 'Reward amount in dollars'
    }
  ];
  
  for (const setting of settings) {
    await prisma.setting.create({
      data: setting
    });
  }
  
  console.log('Settings seeded');
}

async function main() {

  await loadNailStoreData()
  // ADMIN
  await prisma.admin.create({
    data: {
      id: "admin1",
      username: "admin1",
    },
  });
  await prisma.admin.create({
    data: {
      id: "admin2",
      username: "admin2",
    },
  });

  // GRADE
  for (let i = 1; i <= 6; i++) {
    await prisma.grade.create({
      data: {
        level: i,
      },
    });
  }

  // CLASS
  for (let i = 1; i <= 6; i++) {
    await prisma.class.create({
      data: {
        name: `${i}A`, 
        gradeId: i, 
        capacity: Math.floor(Math.random() * (20 - 15 + 1)) + 15,
      },
    });
  }

  // SUBJECT
  const subjectData = [
    { name: "Mathematics" },
    { name: "Science" },
    { name: "English" },
    { name: "History" },
    { name: "Geography" },
    { name: "Physics" },
    { name: "Chemistry" },
    { name: "Biology" },
    { name: "Computer Science" },
    { name: "Art" },
  ];

  for (const subject of subjectData) {
    await prisma.subject.create({ data: subject });
  }

  // TEACHER
  for (let i = 1; i <= 15; i++) {
    await prisma.teacher.create({
      data: {
        id: `teacher${i}`, // Unique ID for the teacher
        username: `teacher${i}`,
        name: `TName${i}`,
        surname: `TSurname${i}`,
        email: `teacher${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        subjects: { connect: [{ id: (i % 10) + 1 }] }, 
        classes: { connect: [{ id: (i % 6) + 1 }] }, 
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 30)),
      },
    });
  }

  // LESSON
  for (let i = 1; i <= 30; i++) {
    await prisma.lesson.create({
      data: {
        name: `Lesson${i}`, 
        day: Day[
          Object.keys(Day)[
            Math.floor(Math.random() * Object.keys(Day).length)
          ] as keyof typeof Day
        ], 
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)), 
        endTime: new Date(new Date().setHours(new Date().getHours() + 3)), 
        subjectId: (i % 10) + 1, 
        classId: (i % 6) + 1, 
        teacherId: `teacher${(i % 15) + 1}`, 
      },
    });
  }

  // PARENT
  for (let i = 1; i <= 25; i++) {
    await prisma.parent.create({
      data: {
        id: `parentId${i}`,
        username: `parentId${i}`,
        name: `PName ${i}`,
        surname: `PSurname ${i}`,
        email: `parent${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
      },
    });
  }

  // STUDENT
  for (let i = 1; i <= 50; i++) {
    await prisma.student.create({
      data: {
        id: `student${i}`, 
        username: `student${i}`, 
        name: `SName${i}`,
        surname: `SSurname ${i}`,
        email: `student${i}@example.com`,
        phone: `987-654-321${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        parentId: `parentId${Math.ceil(i / 2) % 25 || 25}`, 
        gradeId: (i % 6) + 1, 
        classId: (i % 6) + 1, 
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
      },
    });
  }

  // EXAM
  for (let i = 1; i <= 10; i++) {
    await prisma.exam.create({
      data: {
        title: `Exam ${i}`, 
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)), 
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)), 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // ASSIGNMENT
  for (let i = 1; i <= 10; i++) {
    await prisma.assignment.create({
      data: {
        title: `Assignment ${i}`, 
        startDate: new Date(new Date().setHours(new Date().getHours() + 1)), 
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // RESULT
  for (let i = 1; i <= 10; i++) {
    await prisma.result.create({
      data: {
        score: 90, 
        studentId: `student${i}`, 
        ...(i <= 5 ? { examId: i } : { assignmentId: i - 5 }), 
      },
    });
  }

  // ATTENDANCE
  for (let i = 1; i <= 10; i++) {
    await prisma.attendance.create({
      data: {
        date: new Date(), 
        present: true, 
        studentId: `student${i}`, 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // EVENT
  for (let i = 1; i <= 5; i++) {
    await prisma.event.create({
      data: {
        title: `Event ${i}`, 
        description: `Description for Event ${i}`, 
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)), 
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)), 
        classId: (i % 5) + 1, 
      },
    });
  }

  // ANNOUNCEMENT
  for (let i = 1; i <= 5; i++) {
    await prisma.announcement.create({
      data: {
        title: `Announcement ${i}`, 
        description: `Description for Announcement ${i}`, 
        date: new Date(), 
        classId: (i % 5) + 1, 
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
