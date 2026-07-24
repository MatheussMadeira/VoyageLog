import { listCategories } from "@/lib/actions/categories.actions";
import { ManageCategoriesSheet } from "@/components/manage-categories-sheet";

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {/* Header */}
      <div
        className="mb-6 rounded-2xl px-5 py-4"
        style={{ backgroundColor: "var(--color-brand-ink)" }}
      >
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--color-brand-ink-foreground)" }}
        >
          Categorias
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: "oklch(0.75 0.01 260)" }}>
          Organize seus gastos por categoria.
        </p>
      </div>

      <ManageCategoriesSheet initialCategories={categories} />
    </main>
  );
}
