import { NextRequest } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    globalThis?.logger?.info({
      meta: {
        requestId: crypto.randomUUID(),
        endpoint: 'search/locations'
      },
      message: 'Locations search request received',
    });

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    if (state) {
      // Get cities for a specific state with trimmed and normalized comparison
      const normalizedState = state.trim();
      
      const cities = await prisma.facility.findMany({
        where: {
          state: normalizedState, // Exact match after trimming
          isActive: true,
          status: 'APPROVED'
        },
        select: {
          city: true
        },
        distinct: ['city'],
        orderBy: {
          city: 'asc'
        }
      });

      const cityList = cities.map(item => item.city.trim()).filter(Boolean);

      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          originalState: state,
          normalizedState,
          cityCount: cityList.length,
          cities: cityList.slice(0, 10) // Log first 10 cities for debugging
        },
        message: 'Cities fetched successfully for state',
      });

      return Response.json({
        state: normalizedState,
        cities: cityList
      });
    } else {
      // Get all states
      const states = await prisma.facility.findMany({
        where: {
          isActive: true,
          status: 'APPROVED'
        },
        select: {
          state: true
        },
        distinct: ['state'],
        orderBy: {
          state: 'asc'
        }
      });

      const stateList = states.map(item => item.state.trim()).filter(Boolean);

      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          stateCount: stateList.length
        },
        message: 'States fetched successfully',
      });

      return Response.json({
        states: stateList
      });
    }

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      message: 'Locations API error',
    });

    console.error('Locations API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
