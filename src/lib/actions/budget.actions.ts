"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getMongoose } from "@/lib/db/client";
import { getTripModel, getExpenseModel } from "@/lib/db/collections";
import type { ICategoryBudget } from "@/lib/db/collections";
import { resolveBudgetAmountForReferenceCurrency } from "@/lib/domain/budget-amount";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export interface CategoryBudgetStatus extends ICategoryBudget {
  spent: number;
  remaining: number;
  isOver: boolean;
  percentage: number;
}

// Retorna o status de orçamento de cada categoria na viagem
export async function getCategoryBudgetStatus(
  tripId: string,
): Promise<CategoryBudgetStatus[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  await getMongoose();
  const TripModel = getTripModel();
  const ExpenseModel = getExpenseModel();

  const trip = await TripModel.findOne({
    _id: tripId,
    userId: session.user.id,
  }).lean();

  if (!trip || !trip.categoryBudgets?.length) return [];

  // Agrega gastos por categoria para esta viagem
  const expenses = await ExpenseModel.find({ tripId: trip._id }).lean();

  const spentMap = expenses.reduce<Record<string, number>>((acc, expense) => {
    const amount = resolveBudgetAmountForReferenceCurrency({
      amount: expense.amount,
      amountConverted: expense.amountConverted ?? null,
      currency: expense.currency,
      referenceCurrency: trip.referenceCurrency,
    });

    if (amount == null) return acc;

    const categoryId = expense.categoryId.toString();
    acc[categoryId] = (acc[categoryId] ?? 0) + amount;
    return acc;
  }, {});

  return trip.categoryBudgets.map((cb) => {
    const spentAmount = spentMap[cb.categoryId] ?? 0;
    const remaining = cb.allocated - spentAmount;
    return {
      ...cb,
      spent: Math.round(spentAmount * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      isOver: remaining < 0,
      percentage:
        cb.allocated > 0
          ? Math.min(Math.round((spentAmount / cb.allocated) * 100), 100)
          : 0,
    };
  });
}

// Define/atualiza a alocação de orçamento por categoria
export async function setCategoryBudgets(
  tripId: string,
  budgets: ICategoryBudget[],
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  await getMongoose();
  const TripModel = getTripModel();

  const trip = await TripModel.findOne({
    _id: tripId,
    userId: session.user.id,
  });
  if (!trip) return { success: false, error: "Viagem não encontrada." };

  trip.categoryBudgets = budgets;
  await trip.save();
  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}

// Move `amount` do orçamento de `fromCategoryId` para `toCategoryId`
export async function reallocateBudget(
  tripId: string,
  fromCategoryId: string,
  toCategoryId: string,
  amount: number,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Não autenticado." };

  await getMongoose();
  const TripModel = getTripModel();

  const trip = await TripModel.findOne({
    _id: tripId,
    userId: session.user.id,
  });
  if (!trip) return { success: false, error: "Viagem não encontrada." };

  const from = trip.categoryBudgets.find(
    (cb) => cb.categoryId === fromCategoryId,
  );
  const to = trip.categoryBudgets.find((cb) => cb.categoryId === toCategoryId);

  if (!from || !to)
    return { success: false, error: "Categoria não encontrada." };
  if (from.allocated < amount)
    return {
      success: false,
      error: "Saldo insuficiente na categoria de origem.",
    };

  from.allocated = Math.round((from.allocated - amount) * 100) / 100;
  to.allocated = Math.round((to.allocated + amount) * 100) / 100;

  trip.markModified("categoryBudgets");
  await trip.save();
  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
