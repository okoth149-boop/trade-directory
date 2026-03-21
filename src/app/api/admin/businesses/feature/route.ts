import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  } catch {
    return null;
  }
}

// POST - Feature/Unfeature a business
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
    const { id, featured } = body;

    if (!id || typeof featured !== 'boolean') {
      return NextResponse.json(
        { error: 'Business ID and featured status are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if business exists and is approved
    const existingBusiness = await prisma.business.findUnique({
      where: { id },
    });

    if (!existingBusiness) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (existingBusiness.verificationStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only approved businesses can be featured' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update business
    const business = await prisma.business.update({
      where: { id },
      data: {
        featured,
        featuredAt: featured ? new Date() : null,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create notification for business owner
    await prisma.notification.create({
      data: {
        userId: business.ownerId,
        title: featured ? 'Business Featured' : 'Business Unfeatured',
        message: featured
          ? `Congratulations! Your business "${business.name}" has been featured on the homepage.`
          : `Your business "${business.name}" is no longer featured on the homepage.`,
        type: 'BUSINESS_VERIFICATION',
        urgency: 'MEDIUM',
      },
    });

    return NextResponse.json(
      {
        business,
        message: `Business ${featured ? 'featured' : 'unfeatured'} successfully`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500, headers: corsHeaders }
    );
  }
}
