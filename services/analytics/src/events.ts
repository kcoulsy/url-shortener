import { z } from "zod";

export const RedirectAnalyticsEventSchema = z.object({
  version: z.literal(1),
  type: z.literal("url.redirected"),
  shortCode: z.string().min(1),
  pathSegment: z.string().min(1),
  occurredAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid ISO date",
  }),
  urlId: z.string().regex(/^\d+$/).optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
});

export type RedirectAnalyticsEvent = z.infer<typeof RedirectAnalyticsEventSchema>;
