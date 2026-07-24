import { z } from "zod";

const dateFromString = z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) {
    const date = new Date(arg);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}, z.date());

export const ExpenseMethodSchema = z.enum(["cash", "debit", "credit"]);

export const ExpenseInputSchema = z.object({
  description: z.string().min(1),
  method: ExpenseMethodSchema,
  timestamp: dateFromString,
  amount: z.number().positive(),
  categoryId: z.string().optional(),
});

export const ExpenseSchema = z.object({
  _id: z.string().optional(),
  tripId: z.string(),
  legId: z.string(),
  userId: z.string(),
  description: z.string().min(1),
  method: ExpenseMethodSchema,
  timestamp: dateFromString,
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  amountConverted: z.number().nullable().optional(),
  referenceCurrency: z.string().min(3).max(3),
  categoryId: z.string(),
  categoryName: z.string(),
  createdAt: dateFromString.optional(),
  updatedAt: dateFromString.optional(),
});

export type ExpenseMethod = z.infer<typeof ExpenseMethodSchema>;
export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
