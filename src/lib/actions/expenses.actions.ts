"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import mongoose from "mongoose";
import { getMongoose } from "@/lib/db/client";
import {
  getExpenseModel,
  getTripModel,
  getCategoryModel,
} from "@/lib/db/collections";
import { ExpenseInputSchema } from "@/lib/validation/expense.schema";
import { resolveActiveLeg } from "@/lib/domain/active-leg";
import { convertAmount } from "@/lib/fx/convert";
import { ensureOutrosCategory } from "@/lib/domain/default-categories";
import type { z } from "zod";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type ExpenseInput = z.infer<typeof ExpenseInputSchema>;

// ─── listExpenses ─────────────────────────────────────────────────────────────

export async function listExpenses(tripId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  await getMongoose();
  const ExpenseModel = getExpenseModel();

  const expenses = await ExpenseModel.find({
    tripId: new mongoose.Types.ObjectId(tripId),
    userId: new mongoose.Types.ObjectId(session.user.id),
  }).sort({ timestamp: -1 });

  return expenses.map((e) => ({
    id: e._id.toString(),
    tripId: e.tripId.toString(),
    legId: e.legId.toString(),
    description: e.description,
    method: e.method,
    timestamp: e.timestamp.toISOString(),
    amount: e.amount,
    currency: e.currency,
    amountConverted: e.amountConverted,
    referenceCurrency: e.referenceCurrency,
    categoryId: e.categoryId.toString(),
    categoryName: e.categoryName,
    createdAt: e.createdAt.toISOString(),
  }));
}

// ─── addExpense ───────────────────────────────────────────────────────────────

export async function addExpense(
  tripId: string,
  input: ExpenseInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  const parsed = ExpenseInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await getMongoose();
  const TripModel = getTripModel();
  const ExpenseModel = getExpenseModel();
  const CategoryModel = getCategoryModel();
  const userId = new mongoose.Types.ObjectId(session.user.id);

  const trip = await TripModel.findOne({
    _id: new mongoose.Types.ObjectId(tripId),
    userId,
  });
  if (!trip) return { success: false, error: "Viagem não encontrada." };

  // Resolve perna a partir do timestamp
  const legs = trip.legs.map((l) => ({
    legId: l.legId,
    country: l.country,
    countryCode: l.countryCode,
    city: l.city,
    currency: l.currency,
    startDate: l.startDate,
    endDate: l.endDate,
    budget: l.budget,
  }));

  const resolved = resolveActiveLeg(legs, new Date(parsed.data.timestamp));
  if (!resolved) {
    return {
      success: false,
      error: "A data da despesa está fora do itinerário da viagem.",
    };
  }

  // Resolve categoria
  let categoryId: mongoose.Types.ObjectId;
  let categoryName: string;

  if (parsed.data.categoryId) {
    const cat = await CategoryModel.findOne({
      _id: new mongoose.Types.ObjectId(parsed.data.categoryId),
      userId,
    });
    if (!cat) return { success: false, error: "Categoria não encontrada." };
    categoryId = cat._id as mongoose.Types.ObjectId;
    categoryName = cat.name;
  } else {
    const outrosId = await ensureOutrosCategory(session.user.id);
    const outros = await CategoryModel.findById(outrosId);
    categoryId = outrosId;
    categoryName = outros?.name ?? "Outros";
  }

  // Snapshot da conversão FX
  const amountConverted = await convertAmount(
    parsed.data.amount,
    resolved.leg.currency,
    trip.referenceCurrency,
  );

  const expense = await ExpenseModel.create({
    tripId: trip._id,
    legId: new mongoose.Types.ObjectId(resolved.leg.legId),
    userId,
    description: parsed.data.description,
    method: parsed.data.method,
    timestamp: new Date(parsed.data.timestamp),
    amount: parsed.data.amount,
    currency: resolved.leg.currency,
    amountConverted,
    referenceCurrency: trip.referenceCurrency,
    categoryId,
    categoryName,
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true, data: { id: expense._id.toString() } };
}

// ─── updateExpense ────────────────────────────────────────────────────────────

export async function updateExpense(
  expenseId: string,
  input: ExpenseInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  const parsed = ExpenseInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await getMongoose();
  const ExpenseModel = getExpenseModel();
  const TripModel = getTripModel();
  const CategoryModel = getCategoryModel();
  const userId = new mongoose.Types.ObjectId(session.user.id);

  const expense = await ExpenseModel.findOne({
    _id: new mongoose.Types.ObjectId(expenseId),
    userId,
  });
  if (!expense) return { success: false, error: "Despesa não encontrada." };

  const trip = await TripModel.findOne({ _id: expense.tripId, userId });
  if (!trip) return { success: false, error: "Viagem não encontrada." };

  const legs = trip.legs.map((l) => ({
    legId: l.legId,
    country: l.country,
    countryCode: l.countryCode,
    city: l.city,
    currency: l.currency,
    startDate: l.startDate,
    endDate: l.endDate,
    budget: l.budget,
  }));

  const resolved = resolveActiveLeg(legs, new Date(parsed.data.timestamp));
  if (!resolved) {
    return {
      success: false,
      error: "A data da despesa está fora do itinerário da viagem.",
    };
  }

  // Re-resolve categoria
  let categoryId: mongoose.Types.ObjectId;
  let categoryName: string;

  if (parsed.data.categoryId) {
    const cat = await CategoryModel.findOne({
      _id: new mongoose.Types.ObjectId(parsed.data.categoryId),
      userId,
    });
    if (!cat) return { success: false, error: "Categoria não encontrada." };
    categoryId = cat._id as mongoose.Types.ObjectId;
    categoryName = cat.name;
  } else {
    const outrosId = await ensureOutrosCategory(session.user.id);
    const outros = await CategoryModel.findById(outrosId);
    categoryId = outrosId;
    categoryName = outros?.name ?? "Outros";
  }

  const amountConverted = await convertAmount(
    parsed.data.amount,
    resolved.leg.currency,
    trip.referenceCurrency,
  );

  expense.legId = new mongoose.Types.ObjectId(resolved.leg.legId);
  expense.description = parsed.data.description;
  expense.method = parsed.data.method;
  expense.timestamp = new Date(parsed.data.timestamp);
  expense.amount = parsed.data.amount;
  expense.currency = resolved.leg.currency;
  expense.amountConverted = amountConverted;
  expense.categoryId = categoryId;
  expense.categoryName = categoryName;

  await expense.save();
  revalidatePath(`/trips/${expense.tripId.toString()}`);
  return { success: true };
}

// ─── deleteExpense ────────────────────────────────────────────────────────────

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  await getMongoose();
  const ExpenseModel = getExpenseModel();
  const userId = new mongoose.Types.ObjectId(session.user.id);

  const expense = await ExpenseModel.findOne({
    _id: new mongoose.Types.ObjectId(expenseId),
    userId,
  });
  if (!expense) return { success: false, error: "Despesa não encontrada." };

  const tripId = expense.tripId.toString();
  await ExpenseModel.deleteOne({ _id: expense._id });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
export async function checkBudgetOverage(
  tripId: string,
  amount: number,
  timestamp: Date | string,
  remaining: number,
): Promise<{ overAmount: number; convertedAmount: number | null }> {
  const session = await auth();
  if (!session?.user?.id) return { overAmount: 0, convertedAmount: null };

  await getMongoose();
  const TripModel = getTripModel();
  const userId = new mongoose.Types.ObjectId(session.user.id);

  const trip = await TripModel.findOne({
    _id: new mongoose.Types.ObjectId(tripId),
    userId,
  });
  if (!trip) return { overAmount: 0, convertedAmount: null };

  const legs = trip.legs.map((l) => ({
    legId: l.legId,
    country: l.country,
    countryCode: l.countryCode,
    city: l.city,
    currency: l.currency,
    startDate: l.startDate,
    endDate: l.endDate,
    budget: l.budget,
  }));

  const parsedTimestamp = new Date(timestamp); // ← conversão explícita, aceita Date ou string
  const resolved = resolveActiveLeg(legs, parsedTimestamp);
  if (!resolved) return { overAmount: 0, convertedAmount: null };

  const convertedAmount = await convertAmount(
    amount,
    resolved.leg.currency,
    trip.referenceCurrency,
  );
  if (convertedAmount == null) return { overAmount: 0, convertedAmount: null };

  return {
    overAmount: Math.max(0, convertedAmount - remaining),
    convertedAmount,
  };
}
