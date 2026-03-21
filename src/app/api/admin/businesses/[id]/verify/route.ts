/* eslint-disable @typescript-eslint/no-unused-vars */
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

// PUT - Update business verification status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminToken(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be VERIFIED, REJECTED, or PENDING' },
        { status: 400, headers: corsHeaders }
      );
    }

    const business = await prisma.business.update({
      where: { id },
      data: { verificationStatus: status },
    });

    return NextResponse.json(
      { business, message: `Business ${status.toLowerCase()} successfully` },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update business status' },
      { status: 500, headers: corsHeaders }
    );
  }
}
