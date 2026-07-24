"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { MethodBadge } from "@/components/method-badge";
import { CategoryBadge } from "@/components/category-badge";
import { AddExpenseSheet } from "@/components/add-expense-sheet";
import { deleteExpense } from "@/lib/actions/expenses.actions";
import type { ExpenseMethod } from "@/lib/validation/expense.schema";
import type { CategoryBudgetStatus } from "@/lib/actions/budget.actions";

interface Expense {
  id: string;
  description: string;
  method: ExpenseMethod;
  amount: number;
  currency: string;
  amountConverted: number | null;
  referenceCurrency: string;
  categoryId: string;
  categoryName: string;
  timestamp: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface ExpenseListClientProps {
  tripId: string;
  expenses: Expense[];
  categories: Category[];
  budgetStatus: CategoryBudgetStatus[];
  referenceCurrency: string;
}

export function ExpenseListClient({
  tripId,
  expenses,
  categories,
  budgetStatus,
  referenceCurrency,
}: ExpenseListClientProps) {
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteExpense(id);
    setDeletingId(null);
    setConfirmingId(null);
    if (!result.success) {
      alert(result.error);
    }
  }
  if (expenses.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[oklch(0.5_0.01_260)]">
        Nenhuma despesa ainda.
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {expenses.map((expense) => (
          <li
            key={expense.id}
            className="flex items-center justify-between rounded-2xl border border-[oklch(0.9_0.006_90)] bg-white px-3 py-2.5"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[oklch(0.18_0.01_260)]">
                {expense.description}
              </span>
              <div className="flex items-center gap-1.5">
                <MethodBadge method={expense.method} size="sm" />
                <CategoryBadge name={expense.categoryName} size="sm" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold tabular-nums text-[oklch(0.18_0.01_260)]">
                  {expense.currency}{" "}
                  {expense.amount.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                {expense.amountConverted != null &&
                  expense.currency !== referenceCurrency && (
                    <span className="text-xs tabular-nums text-[oklch(0.5_0.01_260)]">
                      ≈ {referenceCurrency}{" "}
                      {expense.amountConverted.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  )}
              </div>

              <button
                type="button"
                onClick={() => setEditing(expense)}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[oklch(0.955_0.006_90)]"
                title="Editar despesa"
              >
                <Pencil size={13} style={{ color: "oklch(0.55 0.16 40)" }} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmingId(expense.id)}
                disabled={deletingId === expense.id}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[oklch(0.98_0.02_27)] disabled:opacity-40"
                title="Excluir despesa"
              >
                <Trash2 size={13} style={{ color: "oklch(0.55 0.22 27)" }} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {confirmingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setConfirmingId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-base font-semibold text-[oklch(0.18_0.01_260)]">
              Excluir despesa?
            </h3>
            <p className="mb-4 text-sm text-[oklch(0.5_0.01_260)]">
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingId(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-[oklch(0.5_0.01_260)] hover:bg-[oklch(0.96_0.006_90)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmingId)}
                disabled={deletingId === confirmingId}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "oklch(0.55 0.22 27)" }}
              >
                {deletingId === confirmingId ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <AddExpenseSheet
          tripId={tripId}
          categories={categories}
          budgetStatus={budgetStatus}
          referenceCurrency={referenceCurrency}
          editing={{
            id: editing.id,
            description: editing.description,
            method: editing.method,
            amount: editing.amount,
            timestamp: editing.timestamp,
            categoryId: editing.categoryId,
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
