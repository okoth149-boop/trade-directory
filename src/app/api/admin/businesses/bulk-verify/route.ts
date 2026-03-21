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
    if (decoded.role !== 'ADMIN') {
      return null;
    }
    return decoded;
  } catch ( u) {
    return null;
  }
}

// POST - Bulk verify or reject businesses
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
    const { businessIds, action } = body;
    let { status } = body;

    // Map action to status if action is provided
    if (action) {
      const actionMap: Record<string, string> = {
        'VERIFY': 'VERIFIED',
        'REJECT': 'REJECTED',
        'PENDING': 'PENDING',
        'UNDER_REVIEW': 'UNDER_REVIEW'
      };
      status = actionMap[action.toUpperCase()] || action;
    }

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return NextResponse.json(
        { error: 'Business IDs are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!status || !['VERIFIED', 'REJECTED', 'PENDING', 'UNDER_REVIEW'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (VERIFIED, REJECTED, PENDING, UNDER_REVIEW)' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update all businesses
    const updateResults = await Promise.all(
      businessIds.map(async (businessId) => {
        try {
          const business = await prisma.business.update({
            where: { id: businessId },
            data: { verificationStatus: status },
          });
          return { id: businessId, success: true, business };
        } catch (error) {
          return { id: businessId, success: false, error: 'Business not found' };
        }
      })
    );

    const successful = updateResults.filter(r => r.success).length;
    const failed = updateResults.filter(r => !r.success).length;

    return NextResponse.json(
      {
        message: `Successfully updated ${successful} business(es)`,
        successful,
        failed,
        results: updateResults,
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update businesses' },
      { status: 500, headers: corsHeaders }
    );
  }
}
