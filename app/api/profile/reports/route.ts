import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    // Build where clause for user's own reports
    const where: any = {
      reportedById: session.user.id,
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reportedUser: {
            select: {
              id: true,
              name: true,
            },
          },
          reportedFacility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    const response = {
      reports,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
