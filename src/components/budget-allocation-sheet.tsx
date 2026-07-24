"use client";

import { useState, useTransition } from "react";
import { X, Wallet } from "lucide-react";
import { setCategoryBudgets } from "@/lib/actions/budget.actions";

interface Category {
  id: string;
  name: string;
}

interface BudgetAllocationSheetProps {
  tripId: string;
  categories: Category[];
  totalBudget: number;
  currency: string;
  /** Alocações já existentes */
  existing: { categoryId: string; allocated: number }[];
  onClose: () => void;
}

export function BudgetAllocationSheet({
  tripId,
  categories,
  totalBudget,
  currency,
  existing,
  onClose,
}: BudgetAllocationSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Estado: map categoryId → valor alocado (string para input)
  const [allocations, setAllocations] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const cat of categories) {
      const found = existing.find((e) => e.categoryId === cat.id);
      init[cat.id] = found ? found.allocated.toString() : "0";
    }
    return init;
  });

  const totalAllocated = Object.values(allocations).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0,
  );
  const remaining = totalBudget - totalAllocated;
  const isOver = remaining < -0.001;

  function setAlloc(id: string, val: string) {
    setAllocations((prev) => ({ ...prev, [id]: val }));
  }

  function handleSave() {
    setError(null);
    const budgets = categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      allocated: parseFloat(allocations[cat.id]) || 0,
    }));

    startTransition(async () => {
      const result = await setCategoryBudgets(tripId, budgets);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div
        className="w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 pb-10"
        style={{ backgroundColor: "oklch(0.995 0.002 90)", maxHeight: "88dvh" }}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={16} style={{ color: "oklch(0.55 0.16 40)" }} />
            <h2 className="font-semibold text-[oklch(0.18_0.01_260)]">
              Orçamento por categoria
            </h2>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-[oklch(0.5_0.01_260)]" />
          </button>
        </div>

        {/* Totalizador */}
        <div className="mb-4 rounded-xl bg-[oklch(0.955_0.006_90)] px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[oklch(0.5_0.01_260)]">Total da viagem</span>
            <span className="font-semibold tabular-nums text-[oklch(0.18_0.01_260)]">
              {currency}{" "}
              {totalBudget.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-[oklch(0.5_0.01_260)]">Alocado</span>
            <span className="font-semibold tabular-nums text-[oklch(0.18_0.01_260)]">
              {currency}{" "}
              {totalAllocated.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="mt-1.5 h-px bg-[oklch(0.9_0.006_90)]" />
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-[oklch(0.4_0.01_260)]">
              Não alocado
            </span>
            <span
              className="font-bold tabular-nums"
              style={{
                color: isOver ? "oklch(0.55 0.22 27)" : "oklch(0.38 0.12 150)",
              }}
            >
              {isOver ? "-" : ""}
              {currency}{" "}
              {Math.abs(remaining).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Inputs por categoria */}
        <ul className="mb-5 flex flex-col gap-2">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[oklch(0.9_0.006_90)] px-3 py-2.5"
            >
              <span className="text-sm font-medium text-[oklch(0.18_0.01_260)]">
                {cat.name}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[oklch(0.6_0.01_260)]">
                  {currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={allocations[cat.id]}
                  onChange={(e) => setAlloc(cat.id, e.target.value)}
                  className="w-28 rounded-lg border border-[oklch(0.9_0.006_90)] bg-[oklch(0.955_0.006_90)] px-2 py-1 text-right text-sm tabular-nums outline-none focus:ring-2 focus:ring-[oklch(0.55_0.16_40/40%)]"
                />
              </div>
            </li>
          ))}
        </ul>

        {error && (
          <p className="mb-3 text-xs text-[oklch(0.55_0.22_27)]">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
          style={{
            backgroundColor: "oklch(0.55 0.16 40)",
            color: "oklch(0.985 0.003 90)",
          }}
        >
          {isPending ? "Salvando..." : "Salvar orçamento"}
        </button>
      </div>
    </div>
  );
}
