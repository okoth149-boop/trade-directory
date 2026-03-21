/**
 * Business Verification API v2 - Production Ready
 * Correctly mapped to Prisma Business schema
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendBusinessVerificationApprovedEmail, sendBusinessVerificationRejectedEmail, sendBusinessSuspendedEmail } from '@/lib/email-templates';

// GET: Fetch businesses for verification with correct schema mapping
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '25');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sector = searchParams.get('sector') || '';
    const county = searchParams.get('county') || '';
    const featured = searchParams.get('featured') || '';
    const minRating = searchParams.get('minRating') || '';
    const publishedParam = searchParams.get('published');

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by verificationStatus (correct schema field)
    if (status && status !== 'all') {
      where.verificationStatus = status;
    }

    // Advanced filters
    if (sector) {
      where.sector = sector;
    }

    if (county) {
      where.county = county;
    }

    if (featured) {
      where.featured = featured === 'true';
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating) };
    }

    if (publishedParam !== null && publishedParam !== undefined && publishedParam !== '') {
      where.published = publishedParam === 'true';
    }

    // Get total count
    const total = await prisma.business.count({ where });

    // Optimized query - prevent N+1, include owner relation
    const businesses = await prisma.business.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { [sortField]: sortOrder },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        certifications: {
          select: {
            id: true,
            name: true,
            issuer: true,
            logoUrl: true,
            imageUrl: true,
            validUntil: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            products: true,
            certifications: true,
            ratings: true,
          },
        },
      },
    });

    // Calculate average rating for each business
    const businessesWithRating = businesses.map(business => {
      const ratings = business.ratings || [];
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

      // Remove the ratings array and add calculated rating
      const { ratings: _, ...businessData } = business;
      
      return {
        ...businessData,
        rating: averageRating > 0 ? Number(averageRating.toFixed(1)) : null,
        totalRatings,
      };
    });

    return NextResponse.json({
      data: businessesWithRating,
      total,
      page,
      pageSize,
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch businesses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH: Update business verification status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, notes, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Handle direct status update
    if (status && !action) {
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'VERIFIED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: PENDING, APPROVED, REJECTED, VERIFIED' },
          { status: 400 }
        );
      }

      const updatedBusiness = await prisma.business.update({
        where: { id },
        data: {
          verificationStatus: status,
          needsVerification: status === 'PENDING',
          verificationNotes: notes || undefined,
          updatedAt: new Date(),
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

      // Send suspension email if status is SUSPENDED
      if (status === 'SUSPENDED' && updatedBusiness.owner?.email) {
        void sendBusinessSuspendedEmail(
          updatedBusiness.owner.email,
          updatedBusiness.owner.firstName,
          updatedBusiness.name,
          notes
        ).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `Business status updated to ${status}`,
        business: updatedBusiness,
      });
    }

    // Handle approve/reject actions
    if (!action) {
      return NextResponse.json(
        { error: 'Action or status is required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'togglePublish'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "approve", "reject", or "togglePublish"' },
        { status: 400 }
      );
    }

    // Handle togglePublish action
    if (action === 'togglePublish') {
      const { published } = body;
      const updatedBusiness = await prisma.business.update({
        where: { id },
        data: { published: published === true, updatedAt: new Date() },
        select: { id: true, name: true, published: true },
      });
      return NextResponse.json({
        success: true,
        message: updatedBusiness.published ? 'Business published successfully' : 'Business unpublished successfully',
        business: updatedBusiness,
      });
    }

    // Get current business
    const currentBusiness = await prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!currentBusiness) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Update verificationStatus (correct schema field)
    // VERIFIED = approved and shows badge in directory
    const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED';
    const updateData: any = {
      verificationStatus: newStatus,
      needsVerification: false,
      updatedAt: new Date(),
    };

    // Add verification notes if provided
    if (notes) {
      updateData.verificationNotes = notes;
    }

    const updatedBusiness = await prisma.business.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        certifications: true,
        _count: {
          select: {
            products: true,
            certifications: true,
            ratings: true,
          },
        },
      },
    });

    // Create notification for business owner
    await prisma.notification.create({
      data: {
        userId: currentBusiness.ownerId,
        title: `Business ${action === 'approve' ? 'Verified' : 'Rejected'}`,
        message: action === 'approve'
          ? `Congratulations! Your business "${currentBusiness.name}" has been verified and is now live on the directory.${notes ? ` Note: ${notes}` : ''}`
          : `Your business "${currentBusiness.name}" verification was rejected.${notes ? ` Reason: ${notes}` : ''} Please update your business details and resubmit: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/exporter/business-profile`,
        type: 'BUSINESS_VERIFICATION',
        urgency: action === 'approve' ? 'MEDIUM' : 'HIGH',
        link: action === 'reject' ? '/dashboard/exporter/business-profile' : undefined,
      },
    });

    // TradeDir.Admin.04 / TradeDir.BR.04 — Send email on approval or rejection
    if (currentBusiness.owner?.email) {
      if (action === 'approve') {
        void sendBusinessVerificationApprovedEmail(
          currentBusiness.owner.email,
          currentBusiness.owner.firstName,
          currentBusiness.name
        ).catch(() => {});
      } else {
        void sendBusinessVerificationRejectedEmail(
          currentBusiness.owner.email,
          currentBusiness.owner.firstName,
          currentBusiness.name,
          notes || 'Please review your submission and ensure all required documents are valid and complete.'
        ).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: `Business ${action === 'approve' ? 'verified' : 'rejected'} successfully`,
      business: updatedBusiness,
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to update business', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete business
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    await prisma.business.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Business deleted successfully' 
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to delete business', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
