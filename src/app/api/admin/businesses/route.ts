/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Helper function to verify admin token
async function verifyAdminToken(request: NextRequest): Promise<{ userId: string; role: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; role: string };
    if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') {
      return null;
    }
    return decoded;
  } catch ( u) {
    return null;
  }
}

// GET - Fetch businesses with pagination, sorting, and filtering
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sector = searchParams.get('sector') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    // Build where clause
    const where: any = {};

    // Enhanced search - includes registration number
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactEmail: { contains: search } },
        { location: { contains: search } },
        { county: { contains: search } },
        { town: { contains: search } },
        { registrationNumber: { contains: search } },
        { kraPin: { contains: search } },
      ];
    }

    if (status) {
      where.verificationStatus = status;
    }

    if (sector) {
      where.sector = sector;
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set to end of day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Get total count
    const total = await prisma.business.count({ where });

    // Get paginated businesses
    const businesses = await prisma.business.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: order,
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        businesses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Create a new business
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const {
      name,
      registrationNumber,
      kraPin,
      sector,
      contactEmail,
      contactPhone,
      physicalAddress,
      location,
      county,
      town,
      website,
      description,
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPhone,
    } = body;

    // Validate required fields
    if (!name || !sector || !contactEmail) {
      return NextResponse.json(
        { error: 'Business name, sector, and email are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find or create owner user
    let owner = await prisma.user.findUnique({
      where: { email: ownerEmail || contactEmail },
    });

    if (!owner) {
      // Create new user as owner
      owner = await prisma.user.create({
        data: {
          email: ownerEmail || contactEmail,
          firstName: ownerFirstName || 'Business',
          lastName: ownerLastName || 'Owner',
          phoneNumber: ownerPhone || contactPhone,
          password: Math.random().toString(36).slice(-8), // Random password - should be changed
          role: 'EXPORTER',
          isVerified: true, // Admin-created accounts are auto-verified
        },
      });
    }

    // Create business
    const business = await prisma.business.create({
      data: {
        name,
        description,
        location,
        county,
        town,
        sector,
        contactEmail,
        contactPhone,
        website,
        physicalAddress,
        registrationNumber,
        kraPin,
        verificationStatus: 'PENDING',
        ownerId: owner.id,
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json(
      { business, message: 'Business created successfully' },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500, headers: corsHeaders }
    );
  }
}
