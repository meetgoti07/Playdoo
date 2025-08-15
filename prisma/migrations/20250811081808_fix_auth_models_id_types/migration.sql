/*
  Warnings:

  - The primary key for the `account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `account` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[hashId]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hashId]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - The required column `hashId` was added to the `account` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Changed the type of `userId` on the `account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - The required column `hashId` was added to the `user` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Made the column `createdAt` on table `verification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `verification` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'FACILITY_OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."FacilityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."SportType" AS ENUM ('BADMINTON', 'TENNIS', 'FOOTBALL', 'BASKETBALL', 'CRICKET', 'SQUASH', 'TABLE_TENNIS', 'VOLLEYBALL', 'SWIMMING', 'GYM', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VenueType" AS ENUM ('INDOOR', 'OUTDOOR', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET', 'CASH');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('FACILITY_ISSUE', 'USER_BEHAVIOR', 'PAYMENT_ISSUE', 'SAFETY_CONCERN', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_CANCELLATION', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'FACILITY_APPROVED', 'FACILITY_REJECTED', 'MAINTENANCE_ALERT', 'PROMOTIONAL', 'SYSTEM_UPDATE');

-- DropForeignKey
ALTER TABLE "public"."account" DROP CONSTRAINT "account_userId_fkey";

-- AlterTable
ALTER TABLE "public"."account" DROP CONSTRAINT "account_pkey",
ADD COLUMN     "hashId" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."user" DROP CONSTRAINT "user_pkey",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "hashId" TEXT NOT NULL,
ADD COLUMN     "isPhoneVerified" BOOLEAN DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "emailVerified" SET DEFAULT false,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "role",
ADD COLUMN     "role" "public"."UserRole" DEFAULT 'USER',
ALTER COLUMN "banned" SET DEFAULT false,
ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."verification" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."user_profiles" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "fullName" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "preferredSports" TEXT NOT NULL DEFAULT '',
    "maxDistance" INTEGER,
    "priceRangeMin" DOUBLE PRECISION,
    "priceRangeMax" DOUBLE PRECISION,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."facilities" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "website" TEXT,
    "status" "public"."FacilityStatus" NOT NULL DEFAULT 'PENDING',
    "venueType" "public"."VenueType" NOT NULL,
    "rating" DOUBLE PRECISION DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."courts" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sportType" "public"."SportType" NOT NULL,
    "description" TEXT,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "capacity" INTEGER,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "surface" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."time_slots" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "courtId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "courtId" INTEGER NOT NULL,
    "timeSlotId" INTEGER NOT NULL,
    "bookingDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalAmount" DOUBLE PRECISION NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING',
    "specialRequests" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "noShowAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "paymentGateway" TEXT,
    "transactionId" TEXT,
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "refundAmount" DOUBLE PRECISION,
    "refundedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."amenities" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."facility_amenities" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "amenityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facility_amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."facility_photos" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facility_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."operating_hours" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "courtId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reports" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "reportedById" INTEGER NOT NULL,
    "reportedUserId" INTEGER,
    "reportedFacilityId" INTEGER,
    "type" "public"."ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_logs" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'string',
    "category" TEXT NOT NULL DEFAULT 'general',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."banners" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetRole" "public"."UserRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_analytics" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalFacilities" INTEGER NOT NULL DEFAULT 0,
    "popularSport" "public"."SportType",
    "peakHour" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."facility_analytics" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "occupancyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peakHour" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facility_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."coupons" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "minBookingAmount" DOUBLE PRECISION,
    "maxDiscountAmount" DOUBLE PRECISION,
    "usageLimit" INTEGER,
    "userUsageLimit" INTEGER,
    "currentUsage" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "applicableSports" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_coupons" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "couponId" INTEGER NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_templates" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sms_templates" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cities" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."faqs" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."support_tickets" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "userId" INTEGER,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."commissions" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "facilityId" INTEGER,
    "bookingId" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blog_posts" (
    "id" SERIAL NOT NULL,
    "hashId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "authorId" INTEGER,
    "coverImage" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_hashId_key" ON "public"."user_profiles"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "public"."user_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_profiles_hashId_idx" ON "public"."user_profiles"("hashId");

-- CreateIndex
CREATE INDEX "user_profiles_userId_idx" ON "public"."user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_hashId_key" ON "public"."facilities"("hashId");

-- CreateIndex
CREATE INDEX "facilities_hashId_idx" ON "public"."facilities"("hashId");

-- CreateIndex
CREATE INDEX "facilities_ownerId_status_idx" ON "public"."facilities"("ownerId", "status");

-- CreateIndex
CREATE INDEX "facilities_city_isActive_idx" ON "public"."facilities"("city", "isActive");

-- CreateIndex
CREATE INDEX "facilities_status_idx" ON "public"."facilities"("status");

-- CreateIndex
CREATE INDEX "facilities_venueType_idx" ON "public"."facilities"("venueType");

-- CreateIndex
CREATE UNIQUE INDEX "courts_hashId_key" ON "public"."courts"("hashId");

-- CreateIndex
CREATE INDEX "courts_hashId_idx" ON "public"."courts"("hashId");

-- CreateIndex
CREATE INDEX "courts_sportType_isActive_idx" ON "public"."courts"("sportType", "isActive");

-- CreateIndex
CREATE INDEX "courts_facilityId_isActive_idx" ON "public"."courts"("facilityId", "isActive");

-- CreateIndex
CREATE INDEX "courts_facilityId_idx" ON "public"."courts"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_hashId_key" ON "public"."time_slots"("hashId");

-- CreateIndex
CREATE INDEX "time_slots_hashId_idx" ON "public"."time_slots"("hashId");

-- CreateIndex
CREATE INDEX "time_slots_courtId_date_startTime_idx" ON "public"."time_slots"("courtId", "date", "startTime");

-- CreateIndex
CREATE INDEX "time_slots_date_isBlocked_isBooked_idx" ON "public"."time_slots"("date", "isBlocked", "isBooked");

-- CreateIndex
CREATE INDEX "time_slots_courtId_idx" ON "public"."time_slots"("courtId");

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_courtId_date_startTime_key" ON "public"."time_slots"("courtId", "date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_hashId_key" ON "public"."bookings"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_timeSlotId_key" ON "public"."bookings"("timeSlotId");

-- CreateIndex
CREATE INDEX "bookings_hashId_idx" ON "public"."bookings"("hashId");

-- CreateIndex
CREATE INDEX "bookings_userId_status_idx" ON "public"."bookings"("userId", "status");

-- CreateIndex
CREATE INDEX "bookings_facilityId_bookingDate_idx" ON "public"."bookings"("facilityId", "bookingDate");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "public"."bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_bookingDate_idx" ON "public"."bookings"("bookingDate");

-- CreateIndex
CREATE UNIQUE INDEX "payments_hashId_key" ON "public"."payments"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bookingId_key" ON "public"."payments"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "public"."payments"("transactionId");

-- CreateIndex
CREATE INDEX "payments_hashId_idx" ON "public"."payments"("hashId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_transactionId_idx" ON "public"."payments"("transactionId");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "public"."payments"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_hashId_key" ON "public"."reviews"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_bookingId_key" ON "public"."reviews"("bookingId");

-- CreateIndex
CREATE INDEX "reviews_hashId_idx" ON "public"."reviews"("hashId");

-- CreateIndex
CREATE INDEX "reviews_facilityId_isApproved_idx" ON "public"."reviews"("facilityId", "isApproved");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "public"."reviews"("userId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "public"."reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_hashId_key" ON "public"."amenities"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "amenities_name_key" ON "public"."amenities"("name");

-- CreateIndex
CREATE INDEX "amenities_hashId_idx" ON "public"."amenities"("hashId");

-- CreateIndex
CREATE INDEX "amenities_name_idx" ON "public"."amenities"("name");

-- CreateIndex
CREATE INDEX "amenities_isActive_idx" ON "public"."amenities"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "facility_amenities_hashId_key" ON "public"."facility_amenities"("hashId");

-- CreateIndex
CREATE INDEX "facility_amenities_hashId_idx" ON "public"."facility_amenities"("hashId");

-- CreateIndex
CREATE INDEX "facility_amenities_facilityId_idx" ON "public"."facility_amenities"("facilityId");

-- CreateIndex
CREATE INDEX "facility_amenities_amenityId_idx" ON "public"."facility_amenities"("amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "facility_amenities_facilityId_amenityId_key" ON "public"."facility_amenities"("facilityId", "amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "facility_photos_hashId_key" ON "public"."facility_photos"("hashId");

-- CreateIndex
CREATE INDEX "facility_photos_hashId_idx" ON "public"."facility_photos"("hashId");

-- CreateIndex
CREATE INDEX "facility_photos_facilityId_idx" ON "public"."facility_photos"("facilityId");

-- CreateIndex
CREATE INDEX "facility_photos_isPrimary_idx" ON "public"."facility_photos"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "operating_hours_hashId_key" ON "public"."operating_hours"("hashId");

-- CreateIndex
CREATE INDEX "operating_hours_hashId_idx" ON "public"."operating_hours"("hashId");

-- CreateIndex
CREATE INDEX "operating_hours_facilityId_idx" ON "public"."operating_hours"("facilityId");

-- CreateIndex
CREATE UNIQUE INDEX "operating_hours_facilityId_dayOfWeek_key" ON "public"."operating_hours"("facilityId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_hashId_key" ON "public"."maintenance"("hashId");

-- CreateIndex
CREATE INDEX "maintenance_hashId_idx" ON "public"."maintenance"("hashId");

-- CreateIndex
CREATE INDEX "maintenance_courtId_idx" ON "public"."maintenance"("courtId");

-- CreateIndex
CREATE INDEX "maintenance_startDate_endDate_idx" ON "public"."maintenance"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "reports_hashId_key" ON "public"."reports"("hashId");

-- CreateIndex
CREATE INDEX "reports_hashId_idx" ON "public"."reports"("hashId");

-- CreateIndex
CREATE INDEX "reports_status_createdAt_idx" ON "public"."reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "reports_reportedById_idx" ON "public"."reports"("reportedById");

-- CreateIndex
CREATE INDEX "reports_type_idx" ON "public"."reports"("type");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_hashId_key" ON "public"."notifications"("hashId");

-- CreateIndex
CREATE INDEX "notifications_hashId_idx" ON "public"."notifications"("hashId");

-- CreateIndex
CREATE INDEX "notifications_userId_type_isRead_idx" ON "public"."notifications"("userId", "type", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "public"."notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "activity_logs_hashId_key" ON "public"."activity_logs"("hashId");

-- CreateIndex
CREATE INDEX "activity_logs_hashId_idx" ON "public"."activity_logs"("hashId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "public"."activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_entity_entityId_idx" ON "public"."activity_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "public"."activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_hashId_key" ON "public"."system_settings"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "public"."system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_hashId_idx" ON "public"."system_settings"("hashId");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "public"."system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "public"."system_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "banners_hashId_key" ON "public"."banners"("hashId");

-- CreateIndex
CREATE INDEX "banners_hashId_idx" ON "public"."banners"("hashId");

-- CreateIndex
CREATE INDEX "banners_isActive_idx" ON "public"."banners"("isActive");

-- CreateIndex
CREATE INDEX "banners_sortOrder_idx" ON "public"."banners"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "booking_analytics_hashId_key" ON "public"."booking_analytics"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_analytics_date_key" ON "public"."booking_analytics"("date");

-- CreateIndex
CREATE INDEX "booking_analytics_hashId_idx" ON "public"."booking_analytics"("hashId");

-- CreateIndex
CREATE INDEX "booking_analytics_date_idx" ON "public"."booking_analytics"("date");

-- CreateIndex
CREATE INDEX "booking_analytics_totalRevenue_idx" ON "public"."booking_analytics"("totalRevenue");

-- CreateIndex
CREATE UNIQUE INDEX "facility_analytics_hashId_key" ON "public"."facility_analytics"("hashId");

-- CreateIndex
CREATE INDEX "facility_analytics_hashId_idx" ON "public"."facility_analytics"("hashId");

-- CreateIndex
CREATE INDEX "facility_analytics_facilityId_idx" ON "public"."facility_analytics"("facilityId");

-- CreateIndex
CREATE INDEX "facility_analytics_date_idx" ON "public"."facility_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "facility_analytics_facilityId_date_key" ON "public"."facility_analytics"("facilityId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_hashId_key" ON "public"."coupons"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "public"."coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_hashId_idx" ON "public"."coupons"("hashId");

-- CreateIndex
CREATE INDEX "coupons_code_isActive_validFrom_validUntil_idx" ON "public"."coupons"("code", "isActive", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "public"."coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_isActive_idx" ON "public"."coupons"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "booking_coupons_hashId_key" ON "public"."booking_coupons"("hashId");

-- CreateIndex
CREATE INDEX "booking_coupons_hashId_idx" ON "public"."booking_coupons"("hashId");

-- CreateIndex
CREATE INDEX "booking_coupons_bookingId_idx" ON "public"."booking_coupons"("bookingId");

-- CreateIndex
CREATE INDEX "booking_coupons_couponId_idx" ON "public"."booking_coupons"("couponId");

-- CreateIndex
CREATE UNIQUE INDEX "booking_coupons_bookingId_couponId_key" ON "public"."booking_coupons"("bookingId", "couponId");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_hashId_key" ON "public"."email_templates"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "public"."email_templates"("name");

-- CreateIndex
CREATE INDEX "email_templates_hashId_idx" ON "public"."email_templates"("hashId");

-- CreateIndex
CREATE INDEX "email_templates_name_idx" ON "public"."email_templates"("name");

-- CreateIndex
CREATE INDEX "email_templates_isActive_idx" ON "public"."email_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "sms_templates_hashId_key" ON "public"."sms_templates"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "sms_templates_name_key" ON "public"."sms_templates"("name");

-- CreateIndex
CREATE INDEX "sms_templates_hashId_idx" ON "public"."sms_templates"("hashId");

-- CreateIndex
CREATE INDEX "sms_templates_name_idx" ON "public"."sms_templates"("name");

-- CreateIndex
CREATE INDEX "sms_templates_isActive_idx" ON "public"."sms_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "cities_hashId_key" ON "public"."cities"("hashId");

-- CreateIndex
CREATE INDEX "cities_hashId_idx" ON "public"."cities"("hashId");

-- CreateIndex
CREATE INDEX "cities_name_idx" ON "public"."cities"("name");

-- CreateIndex
CREATE INDEX "cities_state_idx" ON "public"."cities"("state");

-- CreateIndex
CREATE INDEX "cities_isActive_idx" ON "public"."cities"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_state_country_key" ON "public"."cities"("name", "state", "country");

-- CreateIndex
CREATE UNIQUE INDEX "faqs_hashId_key" ON "public"."faqs"("hashId");

-- CreateIndex
CREATE INDEX "faqs_hashId_idx" ON "public"."faqs"("hashId");

-- CreateIndex
CREATE INDEX "faqs_category_idx" ON "public"."faqs"("category");

-- CreateIndex
CREATE INDEX "faqs_isActive_idx" ON "public"."faqs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_hashId_key" ON "public"."support_tickets"("hashId");

-- CreateIndex
CREATE INDEX "support_tickets_hashId_idx" ON "public"."support_tickets"("hashId");

-- CreateIndex
CREATE INDEX "support_tickets_userId_idx" ON "public"."support_tickets"("userId");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "public"."support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "public"."support_tickets"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_hashId_key" ON "public"."commissions"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_bookingId_key" ON "public"."commissions"("bookingId");

-- CreateIndex
CREATE INDEX "commissions_hashId_idx" ON "public"."commissions"("hashId");

-- CreateIndex
CREATE INDEX "commissions_facilityId_idx" ON "public"."commissions"("facilityId");

-- CreateIndex
CREATE INDEX "commissions_bookingId_idx" ON "public"."commissions"("bookingId");

-- CreateIndex
CREATE INDEX "commissions_status_idx" ON "public"."commissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_hashId_key" ON "public"."blog_posts"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "public"."blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_hashId_idx" ON "public"."blog_posts"("hashId");

-- CreateIndex
CREATE INDEX "blog_posts_slug_idx" ON "public"."blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_authorId_idx" ON "public"."blog_posts"("authorId");

-- CreateIndex
CREATE INDEX "blog_posts_isPublished_idx" ON "public"."blog_posts"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "account_hashId_key" ON "public"."account"("hashId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "public"."account"("userId");

-- CreateIndex
CREATE INDEX "account_hashId_idx" ON "public"."account"("hashId");

-- CreateIndex
CREATE INDEX "rateLimit_id_idx" ON "public"."rateLimit"("id");

-- CreateIndex
CREATE INDEX "rateLimit_key_idx" ON "public"."rateLimit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "user_hashId_key" ON "public"."user"("hashId");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "user_hashId_idx" ON "public"."user"("hashId");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "public"."user"("role");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "public"."user"("status");

-- CreateIndex
CREATE INDEX "verification_id_idx" ON "public"."verification"("id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "public"."verification"("identifier");

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."facilities" ADD CONSTRAINT "facilities_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."courts" ADD CONSTRAINT "courts_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_slots" ADD CONSTRAINT "time_slots_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."courts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "public"."time_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."facility_amenities" ADD CONSTRAINT "facility_amenities_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."facility_amenities" ADD CONSTRAINT "facility_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "public"."amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."facility_photos" ADD CONSTRAINT "facility_photos_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."operating_hours" ADD CONSTRAINT "operating_hours_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance" ADD CONSTRAINT "maintenance_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "public"."courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reportedFacilityId_fkey" FOREIGN KEY ("reportedFacilityId") REFERENCES "public"."facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."facility_analytics" ADD CONSTRAINT "facility_analytics_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "public"."facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_coupons" ADD CONSTRAINT "booking_coupons_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_coupons" ADD CONSTRAINT "booking_coupons_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "public"."coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
