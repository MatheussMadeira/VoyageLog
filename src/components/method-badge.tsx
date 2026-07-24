import type { ExpenseMethod } from "@/lib/validation/expense.schema";

interface MethodBadgeProps {
  method: ExpenseMethod;
  size?: "sm" | "md";
}

const METHOD_CONFIG: Record<
  ExpenseMethod,
  { label: string; bg: string; color: string }
> = {
  cash: {
    label: "Dinheiro",
    bg: "oklch(0.52 0.14 150 / 15%)",
    color: "oklch(0.38 0.12 150)",
  },
  debit: {
    label: "Débito",
    bg: "oklch(0.5 0.14 240 / 15%)",
    color: "oklch(0.38 0.12 240)",
  },
  credit: {
    label: "Crédito",
    bg: "oklch(0.55 0.14 65 / 15%)",
    color: "oklch(0.42 0.13 65)",
  },
};

export function MethodBadge({ method, size = "md" }: MethodBadgeProps) {
  const cfg = METHOD_CONFIG[method];
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}
