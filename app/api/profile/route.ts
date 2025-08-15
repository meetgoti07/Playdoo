import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma/prismaClient';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().optional().refine((val) => !val || val.length >= 2, {
    message: 'Name must be at least 2 characters',
  }),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date string
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  // UserProfile fields
  fullName: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  preferredSports: z.array(z.string()).optional(),
  maxDistance: z.number().int().min(1).max(500).optional(),
  priceRangeMin: z.number().min(0).optional(),
  priceRangeMax: z.number().min(0).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export async function GET() {
  const requestId = crypto.randomUUID();
  
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        endpoint: '/api/profile',
        method: 'GET',
      },
      message: 'Fetching user profile.',
    });

    // Get user with profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        city: true,
        state: true,
        country: true,
        isPhoneVerified: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userProfile: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            bio: true,
            preferredSports: true,
            maxDistance: true,
            priceRangeMin: true,
            priceRangeMax: true,
            emailNotifications: true,
            smsNotifications: true,
            pushNotifications: true,
            emergencyContact: true,
            emergencyPhone: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse preferred sports if it exists
    let preferredSports = [];
    if (user.userProfile?.preferredSports) {
      try {
        preferredSports = JSON.parse(user.userProfile.preferredSports);
      } catch (error) {
        preferredSports = [];
      }
    }

    const profileData = {
      ...user,
      userProfile: user.userProfile ? {
        ...user.userProfile,
        preferredSports,
      } : null,
    };

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        hasProfile: !!user.userProfile,
      },
      message: 'User profile fetched successfully.',
    });

    return NextResponse.json({ user: profileData });

  } catch (error) {
    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/profile',
        method: 'GET',
      },
      message: 'Failed to fetch user profile.',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        endpoint: '/api/profile',
        method: 'PUT',
        updatedFields: Object.keys(validatedData),
      },
      message: 'Updating user profile.',
    });

    // Separate user fields from profile fields
    const userFields: any = {};
    const profileFields: any = {};

    // User table fields
    if (validatedData.name !== undefined) userFields.name = validatedData.name;
    if (validatedData.phone !== undefined) userFields.phone = validatedData.phone;
    if (validatedData.dateOfBirth !== undefined) {
      userFields.dateOfBirth = validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null;
    }
    if (validatedData.gender !== undefined) userFields.gender = validatedData.gender;
    if (validatedData.city !== undefined) userFields.city = validatedData.city;
    if (validatedData.state !== undefined) userFields.state = validatedData.state;
    if (validatedData.country !== undefined) userFields.country = validatedData.country;

    // UserProfile table fields
    if (validatedData.fullName !== undefined) profileFields.fullName = validatedData.fullName;
    if (validatedData.bio !== undefined) profileFields.bio = validatedData.bio;
    if (validatedData.preferredSports !== undefined) {
      profileFields.preferredSports = JSON.stringify(validatedData.preferredSports);
    }
    if (validatedData.maxDistance !== undefined) profileFields.maxDistance = validatedData.maxDistance;
    if (validatedData.priceRangeMin !== undefined) profileFields.priceRangeMin = validatedData.priceRangeMin;
    if (validatedData.priceRangeMax !== undefined) profileFields.priceRangeMax = validatedData.priceRangeMax;
    if (validatedData.emailNotifications !== undefined) profileFields.emailNotifications = validatedData.emailNotifications;
    if (validatedData.smsNotifications !== undefined) profileFields.smsNotifications = validatedData.smsNotifications;
    if (validatedData.pushNotifications !== undefined) profileFields.pushNotifications = validatedData.pushNotifications;
    if (validatedData.emergencyContact !== undefined) profileFields.emergencyContact = validatedData.emergencyContact;
    if (validatedData.emergencyPhone !== undefined) profileFields.emergencyPhone = validatedData.emergencyPhone;

    // Use transaction to update both tables
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user table if there are user fields
      if (Object.keys(userFields).length > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: userFields,
        });
      }

      // Update or create user profile if there are profile fields
      if (Object.keys(profileFields).length > 0) {
        await tx.userProfile.upsert({
          where: { userId: session.user.id },
          update: profileFields,
          create: {
            userId: session.user.id,
            ...profileFields,
          },
        });
      }

      // Return updated user with profile
      return await tx.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          city: true,
          state: true,
          country: true,
          isPhoneVerified: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          userProfile: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              bio: true,
              preferredSports: true,
              maxDistance: true,
              priceRangeMin: true,
              priceRangeMax: true,
              emailNotifications: true,
              smsNotifications: true,
              pushNotifications: true,
              emergencyContact: true,
              emergencyPhone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Parse preferred sports
    let preferredSports = [];
    if (updatedUser.userProfile?.preferredSports) {
      try {
        preferredSports = JSON.parse(updatedUser.userProfile.preferredSports);
      } catch (error) {
        preferredSports = [];
      }
    }

    const responseData = {
      ...updatedUser,
      userProfile: updatedUser.userProfile ? {
        ...updatedUser.userProfile,
        preferredSports,
      } : null,
    };

    globalThis?.logger?.info({
      meta: {
        requestId,
        userId: session.user.id,
        updatedUserFields: Object.keys(userFields),
        updatedProfileFields: Object.keys(profileFields),
      },
      message: 'User profile updated successfully.',
    });

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: responseData
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    globalThis?.logger?.error({
      err: error,
      meta: {
        requestId,
        endpoint: '/api/profile',
        method: 'PUT',
      },
      message: 'Failed to update user profile.',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
