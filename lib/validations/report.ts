import { z } from 'zod';

export const reportSchema = z.object({
  type: z.enum(['FACILITY_ISSUE', 'USER_BEHAVIOR', 'PAYMENT_ISSUE', 'SAFETY_CONCERN', 'SPAM', 'OTHER']),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional().or(z.literal('')),
  reportedUserId: z.string().optional(),
  reportedFacilityId: z.string().optional(),
}).refine(
  (data) => data.reportedUserId || data.reportedFacilityId,
  {
    message: "Either a user or facility must be reported",
    path: ["reportedUserId", "reportedFacilityId"],
  }
);
