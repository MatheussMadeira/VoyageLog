import { ProgressBar } from "@/components/progress-bar";
import type { CategoryBudgetStatus } from "@/lib/actions/budget.actions";

interface CategoryBudgetProgressProps {
  items: CategoryBudgetStatus[];
  currency: string;
}

export function CategoryBudgetProgress({
  items,
  currency,
}: CategoryBudgetProgressProps) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        Orçamento por categoria
      </h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.categoryId}
            className="rounded-xl border border-[oklch(0.9_0.006_90)] bg-white px-3 py-2.5"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-[oklch(0.18_0.01_260)]">
                {item.categoryName}
              </span>
              <span
                className="text-xs font-semibold tabular-nums"
                style={{
                  color: item.isOver
                    ? "oklch(0.55 0.22 27)"
                    : "oklch(0.5 0.01 260)",
                }}
              >
                {item.isOver ? "+" : ""}
                {Math.abs(item.remaining).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}{" "}
                {item.isOver ? "acima" : "restam"}
              </span>
            </div>

            <ProgressBar
              value={item.spent}
              max={item.allocated}
              color="oklch(0.55 0.16 40)"
            />

            <div className="mt-1 flex items-center justify-between text-xs text-[oklch(0.6_0.01_260)]">
              <span>
                Gasto: {currency}{" "}
                {item.spent.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span>
                Limite: {currency}{" "}
                {item.allocated.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
