import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma/prismaClient';
import { reportSchema } from '@/lib/validations/report';
import { ReportType } from '@/lib/generated/prisma';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate the request body
    const validatedData = reportSchema.parse(body);
    
    // Create the report
    const report = await prisma.report.create({
      data: {
        reportedById: session.user.id,
        reportedUserId: validatedData.reportedUserId,
        reportedFacilityId: validatedData.reportedFacilityId,
        type: validatedData.type as ReportType,
        title: validatedData.title,
        description: validatedData.description || "none",
        status: 'PENDING',
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        reportedFacility: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
      },
    });

    // Log the report creation for admin visibility
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_REPORT',
        entity: 'Report',
        entityId: report.id,
        newData: {
          reportId: report.hashId,
          type: report.type,
          title: report.title,
          reportedUserId: report.reportedUserId,
          reportedFacilityId: report.reportedFacilityId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully. Our team will review it shortly.',
      report: {
        id: report.hashId,
        type: report.type,
        title: report.title,
        status: report.status,
        createdAt: report.createdAt,
      },
    });

  } catch (error: any) {
    console.error('Error creating report:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
