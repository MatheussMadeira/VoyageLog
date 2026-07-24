"use client";

import { useState, useTransition, useRef } from "react";
import { Search, Plus, Check } from "lucide-react";
import { CategoryBadge } from "@/components/category-badge";
import {
  createCategory,
  listCategories,
} from "@/lib/actions/categories.actions";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface CategorySelectProps {
  categories: Category[];
  value: string | null;
  onChange: (id: string, name: string) => void;
}

export function CategorySelect({
  categories: initial,
  value,
  onChange,
  upward = false,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>(initial);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );
  const exactMatch = categories.some(
    (c) => c.name.toLowerCase() === query.toLowerCase(),
  );
  const selected = categories.find((c) => c.id === value);

  function handleSelect(cat: Category) {
    onChange(cat.id, cat.name);
    setOpen(false);
    setQuery("");
  }

  function handleCreateInline() {
    if (!query.trim()) return;
    startTransition(async () => {
      const result = await createCategory({ name: query.trim() });
      if (result.success && result.data) {
        const updated = await listCategories();
        setCategories(updated);
        onChange(result.data.id, result.data.name);
        setOpen(false);
        setQuery("");
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex w-full items-center justify-between rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm"
      >
        {selected ? (
          <CategoryBadge
            name={selected.name}
            icon={selected.icon}
            color={selected.color}
            size="sm"
          />
        ) : (
          <span className="text-[var(--color-muted-foreground)]">
            Selecionar categoria
          </span>
        )}
        <Search size={14} className="text-[var(--color-muted-foreground)]" />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-[300] mt-1 rounded-xl border shadow-xl"
          style={{
            top: "100%",
            backgroundColor: "oklch(0.995 0.002 90)",
            borderColor: "oklch(0.9 0.006 90)",
            color: "oklch(0.18 0.01 260)",
          }}
        >
          <div className="border-b border-[var(--color-border)] p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar categoria..."
              className="w-full bg-transparent px-1 py-1 text-sm outline-none"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter" && !exactMatch && query.trim())
                  handleCreateInline();
              }}
            />
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-[oklch(0.955_0.006_90)]"
                >
                  <CategoryBadge
                    name={cat.name}
                    icon={cat.icon}
                    color={cat.color}
                    size="sm"
                  />
                  {cat.id === value && (
                    <Check
                      size={13}
                      style={{ color: "var(--color-brand-primary)" }}
                    />
                  )}
                </button>
              </li>
            ))}

            {!exactMatch && query.trim() && (
              <li>
                <button
                  type="button"
                  onClick={handleCreateInline}
                  disabled={isPending}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[oklch(0.955_0.006_90)] disabled:opacity-50"
                  style={{ color: "var(--color-brand-primary)" }}
                >
                  <Plus size={13} />
                  Criar &ldquo;{query}&rdquo;
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
