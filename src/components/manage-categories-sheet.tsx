"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { CategoryBadge } from "./category-badge";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories.actions";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
};

interface ManageCategoriesSheetProps {
  initialCategories: Category[];
}

export function ManageCategoriesSheet({
  initialCategories,
}: ManageCategoriesSheetProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function refresh() {
    const updated = await listCategories();
    setCategories(updated);
  }

  function handleStartEdit(cat: Category) {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setError(null);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditingName("");
    setError(null);
  }

  function handleSaveEdit(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateCategory(id, { name: editingName });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setEditingId(null);
      await refresh();
    });
  }

  function handleCreate() {
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createCategory({ name: newName.trim() });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNewName("");
      await refresh();
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCategory(deleteTarget.id);
      if (!result.success) {
        setError(result.error);
      }
      setDeleteTarget(null);
      await refresh();
    });
  }

  const disabled = isPending || !isOnline;

  return (
    <div className="flex flex-col gap-4">
      {!isOnline && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Você está offline — ações desabilitadas.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Lista de categorias */}
      <ul className="flex flex-col gap-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2"
          >
            {editingId === cat.id ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  className="flex-1 rounded-md border border-[var(--color-input)] bg-transparent px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(cat.id);
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                />
                <button
                  onClick={() => handleSaveEdit(cat.id)}
                  disabled={disabled}
                  className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-40"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CategoryBadge
                    name={cat.name}
                    icon={cat.icon}
                    color={cat.color}
                    size="sm"
                  />
                  {cat.isDefault && (
                    <span className="text-[10px] text-[var(--color-muted-foreground)]">
                      padrão
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(cat)}
                    disabled={disabled}
                    className="rounded p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] disabled:opacity-40"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    disabled={disabled}
                    className="rounded p-1.5 text-[var(--color-destructive)] hover:bg-red-50 disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Formulário de nova categoria */}
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:opacity-40"
          placeholder="Nova categoria..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          maxLength={30}
        />
        <button
          onClick={handleCreate}
          disabled={disabled || !newName.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--color-brand-primary)] px-3 py-2 text-sm font-medium text-[var(--color-brand-primary-foreground)] disabled:opacity-40"
        >
          <Plus size={14} />
          Criar
        </button>
      </div>

      {/* AlertDialog de confirmação de deleção */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-card)] p-5 shadow-xl">
            <h3 className="mb-1 font-semibold text-[var(--color-card-foreground)]">
              Apagar categoria
            </h3>
            <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
              Todas as despesas de{" "}
              <strong>&ldquo;{deleteTarget.name}&rdquo;</strong> serão movidas
              para <strong>Outros</strong>. Deseja continuar?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-[var(--color-border)] py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="flex-1 rounded-xl bg-[var(--color-destructive)] py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
