import Link from "next/link";
import { Tag, ChevronRight } from "lucide-react";

export default function ProfilePage() {
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
          Perfil
        </h1>
      </div>

      {/* Cards de configuração */}
      <ul className="flex flex-col gap-3">
        <li>
          <Link
            href="/profile/categories"
            className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 transition-colors hover:bg-[var(--color-muted)]"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--color-muted)" }}
              >
                <Tag
                  size={17}
                  style={{ color: "var(--color-brand-primary)" }}
                />
              </span>
              <div>
                <p className="text-sm font-medium">Categorias</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Gerencie suas categorias de gasto
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-[var(--color-muted-foreground)]"
            />
          </Link>
        </li>

        {/* Placeholders "Coming Soon" conforme spec §10 */}
        <li>
          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 opacity-50">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--color-muted)" }}
              >
                <span className="text-base">📍</span>
              </span>
              <div>
                <p className="text-sm font-medium">Lugares Visitados</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Em breve
                </p>
              </div>
            </div>
          </div>
        </li>

        <li>
          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 opacity-50">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--color-muted)" }}
              >
                <span className="text-base">📸</span>
              </span>
              <div>
                <p className="text-sm font-medium">Fotos de Viagem</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Em breve
                </p>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </main>
  );
}
