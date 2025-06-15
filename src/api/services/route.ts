// app/api/services/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Handle CORS headers
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

// Handle GET requests
export async function GET(request: NextRequest) {
  try {
    const services = await prisma.service.findMany({
      where: {
        isActive: true // Only return active services
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        category: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    const response = NextResponse.json({
      success: true,
      data: services
    });

    return setCorsHeaders(response);
  } catch (error) {
    console.error('Error fetching services:', error);
    
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch services'
      },
      { status: 500 }
    );

    return setCorsHeaders(response);
  }
}

// Handle unsupported methods
export async function POST() {
  const response = NextResponse.json(
    { error: 'Method POST Not Allowed' },
    { status: 405 }
  );
  response.headers.set('Allow', 'GET, OPTIONS');
  return setCorsHeaders(response);
}

export async function PUT() {
  const response = NextResponse.json(
    { error: 'Method PUT Not Allowed' },
    { status: 405 }
  );
  response.headers.set('Allow', 'GET, OPTIONS');
  return setCorsHeaders(response);
}

export async function DELETE() {
  const response = NextResponse.json(
    { error: 'Method DELETE Not Allowed' },
    { status: 405 }
  );
  response.headers.set('Allow', 'GET, OPTIONS');
  return setCorsHeaders(response);
}