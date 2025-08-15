import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import {admin as adminPlugin, emailOTP } from "better-auth/plugins";
import { prisma } from "@/lib/prisma/prismaClient";
import { getRedisClient } from "@/lib/redis/redisClient";
import { EmailService } from "./email";
import { ac, admin as adminRole, user, facilityOwner } from "./permissions";
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
 
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-07-30.basil",
})


export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      
      // Contact Information
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      
      // Personal Information
      dateOfBirth: {
        type: "date",
        required: false,
        input: true,
      },
      
      gender: {
        type: "string",
        required: false,
        input: true,
      },
      
      // Location Information
      city: {
        type: "string",
        required: false,
        input: true,
      },
      
      state: {
        type: "string",
        required: false,
        input: true,
      },
      
      country: {
        type: "string",
        required: false,
        defaultValue: "India",
        input: true,
      },
      
      isPhoneVerified: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: true,
      },
    },
  },
  secondaryStorage: {
    get: async (key) => {
      const redis = await getRedisClient();
      const value = await redis.get(key);
      return value ?? null;
    },
    set: async (key, value, ttl) => {
      const redis = await getRedisClient();
      if (ttl) await redis.set(key, value, { EX: ttl });
      else await redis.set(key, value);
    },
    delete: async (key) => {
      const redis = await getRedisClient();
      await redis.del(key);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      try {
        // Send the verification email
        const emailService = EmailService.getInstance();
        await emailService.sendEmailVerification(
          user.email,
          url,
          user.name || "User"
        );
        globalThis?.logger?.info({
          meta: {
            requestId: crypto.randomUUID(),
            userId: user.id,
            email: user.email,
          },
          message: "Email verification sent successfully.",
        });
      } catch (error) {
        globalThis?.logger?.error({
          err: error,
          meta: {
            userId: user.id,
            email: user.email,
          },
          message: "Failed to send email verification.",
        });
        throw error;
      }
    },
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
    },
  },

  plugins: [
    nextCookies(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        const emailService = EmailService.getInstance();
        await emailService.sendOTP(email, otp, type);
      },
    }),
    stripe({
            stripeClient,
            stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
            createCustomerOnSignUp: true,
    }),
    adminPlugin({
      ac,
      roles: {
        admin: adminRole,
        user,
        facilityOwner
      }
    }),
  
  ],

  rateLimit: {
    window: 10, // time window in seconds
    max: 5, // max requests in the window
    storage: "database",
    modelName: "rateLimit",
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated),
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
});