import { CategoryBadge } from "@/components/category-badge";
import type { CategoryBreakdownItem } from "@/lib/actions/analytics.actions";

interface CategoryBreakdownListProps {
  items: CategoryBreakdownItem[];
  currency: string;
}

export function CategoryBreakdownList({
  items,
  currency,
}: CategoryBreakdownListProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        Por categoria
      </h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.categoryId}
            className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5"
          >
            <CategoryBadge name={item.categoryName} size="sm" />
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--color-muted)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: "var(--color-brand-primary)",
                  }}
                />
              </div>
              <span className="w-10 text-right text-xs tabular-nums text-[var(--color-muted-foreground)]">
                {item.percentage}%
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {currency}{" "}
                {item.total.toLocaleString("pt-BR", {
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
