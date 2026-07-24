import { z } from "zod";

const dateFromString = z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) {
    const date = new Date(arg);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}, z.date());

export const BudgetSchema = z.object({
  cash: z.number().nonnegative(),
  debit: z.number().nonnegative(),
  credit: z.number().nonnegative(),
});

export const LegSchema = z
  .object({
    legId: z.string().min(1),
    country: z.string().min(1),
    countryCode: z.string().length(2),
    city: z.string().min(1),
    currency: z.string().min(3).max(3),
    startDate: dateFromString,
    endDate: dateFromString,
    budget: BudgetSchema,
  })
  .refine((leg) => leg.startDate <= leg.endDate, {
    message: "Leg startDate must be on or before endDate.",
    path: ["endDate"],
  });

export const LegsSchema = z
  .array(LegSchema)
  .min(1)
  .refine(
    (legs) => {
      for (let index = 1; index < legs.length; index += 1) {
        const previous = legs[index - 1];
        const current = legs[index];

        if (previous.endDate >= current.startDate) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Legs must be chronologically ordered and not overlap.",
    },
  );

export const TripSchema = z.object({
  _id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string().min(1),
  referenceCurrency: z.string().min(3).max(3),
  legs: LegsSchema,
  createdAt: dateFromString.optional(),
  updatedAt: dateFromString.optional(),
});

export type Budget = z.infer<typeof BudgetSchema>;
export type Leg = z.infer<typeof LegSchema>;
export type Trip = z.infer<typeof TripSchema>;
