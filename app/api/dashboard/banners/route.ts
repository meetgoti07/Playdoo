import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/prismaClient';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    globalThis?.logger?.info({
      meta: {
        requestId,
        endpoint: '/api/dashboard/banners',
      },
      message: 'Fetching dashboard banners.',
    });

    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: new Date() } }
            ]
          }
        ]
      },
      orderBy: {
        sortOrder: 'asc'
      },
      select: {
        id: true, // Use id (string) for client-side work
        title: true,
        description: true,
        imageUrl: true,
        linkUrl: true,
      }
    });

    globalThis?.logger?.info({
      meta: {
        requestId,
        bannersCount: banners.length,
      },
      message: 'Successfully fetched dashboard banners.',
    });

    return NextResponse.json({
      banners
    });
  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/dashboard/banners',
      },
      message: 'Failed to fetch dashboard banners.',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
