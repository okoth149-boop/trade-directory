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
    if (decoded.role !== 'ADMIN') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Fetch inquiries with pagination, sorting, and filtering
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
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { message: { contains: search } },
        { product: { name: { contains: search } } },
        { buyer: { firstName: { contains: search } } },
        { buyer: { lastName: { contains: search } } },
        { buyer: { email: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.inquiry.count({ where });

    // Get paginated inquiries
    const inquiries = await prisma.inquiry.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: order,
      },
      include: {
        product: {
          select: {
            name: true,
            business: {
              select: {
                name: true,
              },
            },
          },
        },
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        inquiries,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500, headers: corsHeaders }
    );
  }
}
