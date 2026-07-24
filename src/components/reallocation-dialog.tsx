"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { reallocateBudget } from "@/lib/actions/budget.actions";
import type { CategoryBudgetStatus } from "@/lib/actions/budget.actions";

interface ReallocationDialogProps {
  tripId: string;
  overCategory: CategoryBudgetStatus;
  overAmount: number; // quanto está faltando
  otherCategories: CategoryBudgetStatus[]; // com remaining > 0
  currency: string;
  onConfirm: () => void; // salvar a despesa depois de realocado
  onCancel: () => void;
}

export function ReallocationDialog({
  tripId,
  overCategory,
  overAmount,
  otherCategories,
  currency,
  onConfirm,
  onCancel,
}: ReallocationDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(
    otherCategories[0]?.categoryId ?? "",
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const available = otherCategories.find((c) => c.categoryId === selectedId);
  const transferAmount = Math.min(overAmount, available?.remaining ?? 0);

  function handleConfirm() {
    if (!selectedId) return;
    setError(null);
    startTransition(async () => {
      const result = await reallocateBudget(
        tripId,
        selectedId,
        overCategory.categoryId,
        transferAmount,
      );
      if (!result.success) {
        setError(result.error);
        return;
      }
      onConfirm();
    });
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-[oklch(0.18_0.01_260)]">
              Orçamento insuficiente
            </h3>
            <p className="mt-0.5 text-sm text-[oklch(0.5_0.01_260)]">
              Faltam{" "}
              <strong>
                {currency}{" "}
                {overAmount.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </strong>{" "}
              em <strong>{overCategory.categoryName}</strong>.
            </p>
          </div>
        </div>

        <p className="mb-3 text-sm text-[oklch(0.4_0.01_260)]">
          Escolha uma categoria para transferir o saldo faltante:
        </p>

        {/* Lista de categorias disponíveis */}
        <ul className="mb-4 flex flex-col gap-2">
          {otherCategories.map((cat) => (
            <li key={cat.categoryId}>
              <button
                type="button"
                onClick={() => setSelectedId(cat.categoryId)}
                className="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors"
                style={{
                  backgroundColor:
                    selectedId === cat.categoryId
                      ? "oklch(0.55 0.16 40 / 8%)"
                      : "oklch(0.955 0.006 90)",
                  borderColor:
                    selectedId === cat.categoryId
                      ? "oklch(0.55 0.16 40 / 40%)"
                      : "oklch(0.9 0.006 90)",
                }}
              >
                <span className="font-medium">{cat.categoryName}</span>
                <span className="tabular-nums text-[oklch(0.5_0.01_260)]">
                  {currency}{" "}
                  {cat.remaining.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  disponível
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Preview da transferência */}
        {available && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[oklch(0.955_0.006_90)] px-3 py-2 text-xs">
            <span>{available.categoryName}</span>
            <ArrowRight size={12} className="text-[oklch(0.5_0.01_260)]" />
            <span
              className="font-semibold"
              style={{ color: "oklch(0.55 0.16 40)" }}
            >
              {currency}{" "}
              {transferAmount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
            <ArrowRight size={12} className="text-[oklch(0.5_0.01_260)]" />
            <span>{overCategory.categoryName}</span>
          </div>
        )}

        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

        {/* Ações */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-[oklch(0.9_0.006_90)] py-2.5 text-sm font-medium text-[oklch(0.5_0.01_260)] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !selectedId}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{
              backgroundColor: "oklch(0.55 0.16 40)",
              color: "oklch(0.985 0.003 90)",
            }}
          >
            {isPending ? "Transferindo..." : "Confirmar e salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
