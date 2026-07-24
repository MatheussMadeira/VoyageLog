"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { CategorySelect } from "@/components/category-select";
import { MethodBadge } from "@/components/method-badge";
import { ReallocationDialog } from "@/components/reallocation-dialog";
import { addExpense, updateExpense } from "@/lib/actions/expenses.actions";
import { useOnlineStatus } from "@/components/hooks/use-online-status";
import type { ExpenseMethod } from "@/lib/validation/expense.schema";
import type { CategoryBudgetStatus } from "@/lib/actions/budget.actions";
import { checkBudgetOverage } from "@/lib/actions/expenses.actions";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface AddExpenseSheetProps {
  tripId: string;
  categories: Category[];
  budgetStatus: CategoryBudgetStatus[];
  referenceCurrency: string;
  onClose: () => void;
  editing?: {
    id: string;
    description: string;
    method: ExpenseMethod;
    amount: number;
    timestamp: string;
    categoryId: string;
  };
}

const METHODS: ExpenseMethod[] = ["cash", "debit", "credit"];

export function AddExpenseSheet({
  tripId,
  categories,
  budgetStatus,
  referenceCurrency,
  onClose,
  editing,
}: AddExpenseSheetProps) {
  const isOnline = useOnlineStatus();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reallocationContext, setReallocationContext] = useState<{
    overAmount: number;
    pendingInput: Parameters<typeof addExpense>[1];
  } | null>(null);

  const [description, setDescription] = useState(editing?.description ?? "");
  const [method, setMethod] = useState<ExpenseMethod>(
    editing?.method ?? "cash",
  );
  const [amount, setAmount] = useState(editing?.amount?.toString() ?? "");
  const [timestamp, setTimestamp] = useState(
    editing?.timestamp
      ? new Date(editing.timestamp).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    editing?.categoryId ?? null,
  );
  const [categoryName, setCategoryName] = useState("");

  function handleCategoryChange(id: string, name: string) {
    setCategoryId(id);
    setCategoryName(name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    const parsedTimestamp = new Date(timestamp);
    const input = {
      description,
      method,
      amount: parsedAmount,
      timestamp: parsedTimestamp,
      categoryId: categoryId ?? undefined,
    };

    if (categoryId && !editing) {
      const budgetEntry = budgetStatus.find((b) => b.categoryId === categoryId);
      if (budgetEntry) {
        const { overAmount } = await checkBudgetOverage(
          tripId,
          parsedAmount,
          parsedTimestamp,
          budgetEntry.remaining,
        );
        if (overAmount > 0) {
          setReallocationContext({ overAmount, pendingInput: input });
          return;
        }
      }
    }

    doSave(input);
  }

  function doSave(input: Parameters<typeof addExpense>[1]) {
    startTransition(async () => {
      const result = editing
        ? await updateExpense(editing.id, input)
        : await addExpense(tripId, input);

      if (!result.success) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
        <div
          className="w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 pb-10"
          style={{
            backgroundColor: "oklch(0.995 0.002 90)",
            maxHeight: "92dvh",
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="font-semibold"
              style={{ color: "oklch(0.18 0.01 260)" }}
            >
              {editing ? "Editar despesa" : "Nova despesa"}
            </h2>
            <button onClick={onClose}>
              <X size={18} style={{ color: "oklch(0.7 0.01 260)" }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
              required
              className="rounded-xl border border-[oklch(0.9_0.006_90)] bg-[oklch(0.955_0.006_90)] px-3 py-2.5 text-sm text-[oklch(0.18_0.01_260)] outline-none placeholder:text-[oklch(0.6_0.01_260)] focus:ring-2 focus:ring-[var(--color-ring)]"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Valor"
                step="0.01"
                min="0.01"
                required
                className="rounded-xl border border-[oklch(0.9_0.006_90)] bg-[oklch(0.955_0.006_90)] px-3 py-2.5 text-sm text-[oklch(0.18_0.01_260)] outline-none placeholder:text-[oklch(0.6_0.01_260)] focus:ring-2 focus:ring-[var(--color-ring)]"
              />
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                required
                className="rounded-xl border border-[oklch(0.9_0.006_90)] bg-[oklch(0.955_0.006_90)] px-3 py-2.5 text-sm text-[oklch(0.18_0.01_260)] outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              />
            </div>

            {/* Método */}
            <div className="flex gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className="flex-1 rounded-xl py-2 text-center"
                  style={{
                    backgroundColor:
                      method === m
                        ? "oklch(0.55 0.16 40 / 12%)"
                        : "oklch(0.955 0.006 90)",
                    border:
                      method === m
                        ? "1px solid oklch(0.55 0.16 40 / 40%)"
                        : "1px solid oklch(0.9 0.006 90)",
                  }}
                >
                  <MethodBadge method={m} size="sm" />
                </button>
              ))}
            </div>

            {/* Categoria */}
            <div className="overflow-visible">
              <CategorySelect
                categories={categories}
                value={categoryId}
                onChange={handleCategoryChange}
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={isPending || !isOnline}
              className="mt-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-brand-primary)",
                color: "var(--color-brand-primary-foreground)",
              }}
            >
              {isPending
                ? "Salvando..."
                : editing
                  ? "Salvar alterações"
                  : "Adicionar despesa"}
            </button>
          </form>
        </div>
      </div>

      {/* Modal de realocação de orçamento */}
      {reallocationContext && categoryId && (
        <ReallocationDialog
          tripId={tripId}
          overCategory={budgetStatus.find((b) => b.categoryId === categoryId)!}
          overAmount={reallocationContext.overAmount}
          otherCategories={budgetStatus.filter(
            (b) => b.categoryId !== categoryId && b.remaining > 0,
          )}
          currency={referenceCurrency}
          onConfirm={() => {
            setReallocationContext(null);
            doSave(reallocationContext.pendingInput);
          }}
          onCancel={() => setReallocationContext(null)}
        />
      )}
    </>
  );
}
