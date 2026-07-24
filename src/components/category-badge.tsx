import * as LucideIcons from "lucide-react";

interface CategoryBadgeProps {
  name: string;
  icon?: string | null;
  color?: string | null;
  size?: "sm" | "md";
}

function getIcon(iconName: string | null | undefined) {
  if (!iconName) return null;
  const Icon = (LucideIcons as Record<string, unknown>)[iconName];
  if (typeof Icon !== "function") return null;
  return Icon as React.FC<{ size?: number; className?: string }>;
}

export function CategoryBadge({
  name,
  icon,
  color,
  size = "md",
}: CategoryBadgeProps) {
  const Icon = getIcon(icon);
  const iconSize = size === "sm" ? 10 : 12;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 font-medium ${
        size === "sm" ? "py-0.5 text-[10px]" : "py-1 text-xs"
      }`}
      style={{
        borderColor: color ? `${color}40` : "var(--color-border)",
        backgroundColor: color ? `${color}18` : "var(--color-muted)",
        color: color ?? "var(--color-muted-foreground)",
      }}
    >
      {Icon && <Icon size={iconSize} />}
      {name}
    </span>
  );
}
