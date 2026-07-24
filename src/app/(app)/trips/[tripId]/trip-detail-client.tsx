"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { AddExpenseSheet } from "@/components/add-expense-sheet";
import { BudgetAllocationSheet } from "@/components/budget-allocation-sheet";
import { useOnlineStatus } from "@/components/hooks/use-online-status";
import type { CategoryBudgetStatus } from "@/lib/actions/budget.actions";

interface Props {
  tripId: string;
  referenceCurrency: string;
  totalBudget: number;
  categories: Array<{
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  }>;
  budgetStatus: CategoryBudgetStatus[];
}

export function TripDetailClient({
  tripId,
  referenceCurrency,
  totalBudget,
  categories,
  budgetStatus,
}: Props) {
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const isOnline = useOnlineStatus();

  return (
    <>
      {/* Botão inline "Configurar orçamento" */}
      <button
        onClick={() => setBudgetOpen(true)}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[oklch(0.9_0.006_90)] py-2.5 text-sm text-[oklch(0.5_0.01_260)] transition-colors hover:border-[oklch(0.55_0.16_40)] hover:text-[oklch(0.55_0.16_40)]"
      >
        <Wallet size={14} />
        {budgetStatus.length > 0
          ? "Editar orçamento por categoria"
          : "Configurar orçamento por categoria"}
      </button>

      {/* FAB adicionar despesa */}
      <button
        onClick={() => setExpenseOpen(true)}
        disabled={!isOnline}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-xl disabled:opacity-40"
        style={{ backgroundColor: "var(--color-brand-primary)" }}
        title={isOnline ? "Adicionar despesa" : "Offline"}
      >
        <Plus
          size={24}
          style={{ color: "var(--color-brand-primary-foreground)" }}
        />
      </button>

      {expenseOpen && (
        <AddExpenseSheet
          tripId={tripId}
          categories={categories}
          budgetStatus={budgetStatus}
          referenceCurrency={referenceCurrency}
          onClose={() => setExpenseOpen(false)}
        />
      )}

      {budgetOpen && (
        <BudgetAllocationSheet
          tripId={tripId}
          categories={categories}
          totalBudget={totalBudget}
          currency={referenceCurrency}
          existing={budgetStatus.map((b) => ({
            categoryId: b.categoryId,
            allocated: b.allocated,
          }))}
          onClose={() => setBudgetOpen(false)}
        />
      )}
    </>
  );
}
