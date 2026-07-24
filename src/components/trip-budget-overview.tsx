"use client";

import type { CategoryBudgetStatus } from "@/lib/actions/budget.actions";

interface TripBudgetOverviewProps {
  totalBudget: number;
  totalSpent: number;
  budgetStatus: CategoryBudgetStatus[];
  currency: string;
}

const R = 54; // raio do anel
const CIRC = 2 * Math.PI * R;

function DonutRing({
  spentPct,
  allocatedPct,
}: {
  spentPct: number;
  allocatedPct: number;
}) {
  const spentLen = (spentPct / 100) * CIRC;
  const allocLen = Math.max(0, ((allocatedPct - spentPct) / 100) * CIRC);
  const freeLen = Math.max(0, CIRC - spentLen - allocLen);

  // rotação inicial para começar no topo
  const startOffset = CIRC * 0.25;

  return (
    <svg viewBox="0 0 130 130" className="w-full">
      {/* Trilha (fundo) */}
      <circle
        cx="65"
        cy="65"
        r={R}
        fill="none"
        stroke="oklch(0.93 0.006 90)"
        strokeWidth="14"
      />

      {/* Não alocado (cinza médio) */}
      {freeLen > 0 && (
        <circle
          cx="65"
          cy="65"
          r={R}
          fill="none"
          stroke="oklch(0.88 0.006 90)"
          strokeWidth="14"
          strokeDasharray={`${freeLen} ${CIRC - freeLen}`}
          strokeDashoffset={startOffset + spentLen + allocLen}
          strokeLinecap="round"
        />
      )}

      {/* Alocado mas não gasto (laranja suave) */}
      {allocLen > 0 && (
        <circle
          cx="65"
          cy="65"
          r={R}
          fill="none"
          stroke="oklch(0.75 0.12 60)"
          strokeWidth="14"
          strokeDasharray={`${allocLen} ${CIRC - allocLen}`}
          strokeDashoffset={startOffset + spentLen}
          strokeLinecap="round"
        />
      )}

      {/* Gasto (laranja escuro / brand) */}
      {spentLen > 0 && (
        <circle
          cx="65"
          cy="65"
          r={R}
          fill="none"
          stroke="oklch(0.55 0.16 40)"
          strokeWidth="14"
          strokeDasharray={`${spentLen} ${CIRC - spentLen}`}
          strokeDashoffset={startOffset}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function TripBudgetOverview({
  totalBudget,
  totalSpent,
  budgetStatus,
  currency,
}: TripBudgetOverviewProps) {
  const totalAllocated = budgetStatus.reduce((s, b) => s + b.allocated, 0);
  const totalRemaining = totalBudget - totalSpent;

  const spentPct =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const allocPct =
    totalBudget > 0 ? Math.min((totalAllocated / totalBudget) * 100, 100) : 0;

  const isOver = totalSpent > totalBudget;

  function fmt(n: number) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  }

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[oklch(0.5_0.01_260)]">
        Visão geral do orçamento
      </h2>

      {/* Card principal com rosca */}
      <div className="rounded-2xl border border-[oklch(0.9_0.006_90)] bg-white p-4">
        <div className="flex items-center gap-4">
          {/* Rosca */}
          <div className="relative w-[110px] shrink-0">
            <DonutRing spentPct={spentPct} allocatedPct={allocPct} />
            {/* Centro da rosca */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-lg font-bold tabular-nums leading-none"
                style={{
                  color: isOver
                    ? "oklch(0.55 0.22 27)"
                    : "oklch(0.18 0.01 260)",
                }}
              >
                {Math.round(spentPct)}%
              </span>
              <span className="mt-0.5 text-[10px] text-[oklch(0.6_0.01_260)]">
                gasto
              </span>
            </div>
          </div>

          {/* Métricas */}
          <div className="flex flex-1 flex-col gap-2">
            <Metric
              label="Total da viagem"
              value={`${currency} ${fmt(totalBudget)}`}
              color="oklch(0.88 0.006 90)"
            />
            <Metric
              label="Gasto até agora"
              value={`${currency} ${fmt(totalSpent)}`}
              color="oklch(0.55 0.16 40)"
            />
            <Metric
              label={isOver ? "Acima do orçamento" : "Ainda disponível"}
              value={`${currency} ${fmt(Math.abs(totalRemaining))}`}
              color={isOver ? "oklch(0.55 0.22 27)" : "oklch(0.38 0.12 150)"}
              bold
            />
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[oklch(0.93_0.006_90)] pt-3">
          <LegendItem color="oklch(0.55 0.16 40)" label="Gasto" />
          {totalAllocated > 0 && (
            <LegendItem
              color="oklch(0.75 0.12 60)"
              label="Alocado (não gasto)"
            />
          )}
          <LegendItem color="oklch(0.88 0.006 90)" label="Livre" />
        </div>
      </div>

      {/* Barras por categoria */}
      {budgetStatus.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {budgetStatus.map((item) => {
            const pct =
              item.allocated > 0
                ? Math.min((item.spent / item.allocated) * 100, 100)
                : 0;
            return (
              <div
                key={item.categoryId}
                className="rounded-xl border border-[oklch(0.9_0.006_90)] bg-white px-3 py-2.5"
              >
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-[oklch(0.18_0.01_260)]">
                    {item.categoryName}
                  </span>
                  <span
                    className="tabular-nums text-xs font-semibold"
                    style={{
                      color: item.isOver
                        ? "oklch(0.55 0.22 27)"
                        : "oklch(0.5_0.01_260)",
                    }}
                  >
                    {item.isOver ? "▲ " : ""}
                    {currency} {fmt(Math.abs(item.remaining))}{" "}
                    {item.isOver ? "acima" : "restam"}
                  </span>
                </div>

                {/* Barra */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-[oklch(0.93_0.006_90)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.isOver
                        ? "oklch(0.55 0.22 27)"
                        : "oklch(0.55 0.16 40)",
                    }}
                  />
                </div>

                <div className="mt-1 flex justify-between text-[10px] text-[oklch(0.6_0.01_260)]">
                  <span>
                    Gasto: {currency} {fmt(item.spent)}
                  </span>
                  <span>
                    Limite: {currency} {fmt(item.allocated)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="flex flex-1 items-baseline justify-between gap-1 min-w-0">
        <span className="truncate text-xs text-[oklch(0.5_0.01_260)]">
          {label}
        </span>
        <span
          className={`shrink-0 tabular-nums text-xs ${bold ? "font-bold" : "font-medium"}`}
          style={{ color: bold ? color : "oklch(0.18 0.01 260)" }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-[oklch(0.55_0.01_260)]">{label}</span>
    </div>
  );
}
