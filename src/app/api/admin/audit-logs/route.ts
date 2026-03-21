/**
 * Audit Logs API
 * GET /api/admin/audit-logs?type=audit|activity
 * Super admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const token = await verifyToken(request);
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { isSuperAdmin: true },
    });

    if (!adminUser?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const action = searchParams.get('action') || '';
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'audit'; // 'audit' | 'activity'

    if (type === 'activity') {
      // UserActivity — general user actions (login, profile updates, etc.)
      const where: Record<string, unknown> = {};
      if (action) where.action = { contains: action, mode: 'insensitive' };
      if (search) {
        where.OR = [
          { action: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [logs, total] = await Promise.all([
        prisma.userActivity.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, role: true },
            },
          },
        }),
        prisma.userActivity.count({ where }),
      ]);

      return NextResponse.json({
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // Default: AuditLog — admin CRUD actions
    const where: Record<string, unknown> = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          adminUser: {
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Audit Logs]', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
