// FILE: app/api/employees/route.ts
// This route provides a list of employees for the booking page.

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Function to add CORS headers to a response
function setCorsHeaders(response: NextResponse) {
  // Allow requests from any origin. For better security in production,
  // you might want to replace '*' with your specific frontend domain.
  // Example: 'https://your-frontend-app.com'
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

// Handle GET requests
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

    // Create the JSON response and then apply CORS headers
    const response = NextResponse.json(employees);
    return setCorsHeaders(response);

  } catch (error) {
    console.error('Failed to fetch employees:', error);

    // Create the error response and then apply CORS headers
    const errorResponse = NextResponse.json({ error: 'An error occurred while fetching employees' }, { status: 500 });
    return setCorsHeaders(errorResponse);
  }
}