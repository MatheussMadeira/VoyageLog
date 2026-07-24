interface ProgressBarProps {
  value: number; // gasto atual
  max: number; // orçamento total
  color?: string; // CSS color value
}

export function ProgressBar({ value, max, color }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const isOver = max > 0 && value > max;

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-muted)]">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: isOver
              ? "var(--color-destructive)"
              : (color ?? "var(--color-brand-primary)"),
          }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-[var(--color-muted-foreground)]">
        {pct}%
      </span>
    </div>
  );
}
