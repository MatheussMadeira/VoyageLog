"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Plus } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Início" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-card)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-4 py-1"
              >
                <Icon
                  size={22}
                  style={{
                    color: active
                      ? "var(--color-brand-primary)"
                      : "var(--color-muted-foreground)",
                  }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: active
                      ? "var(--color-brand-primary)"
                      : "var(--color-muted-foreground)",
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {/* FAB — nova viagem */}
          <Link
            href="/trips/new"
            className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
            style={{ backgroundColor: "var(--color-brand-primary)" }}
          >
            <Plus
              size={22}
              style={{ color: "var(--color-brand-primary-foreground)" }}
            />
          </Link>
        </div>
      </nav>
    </div>
  );
}
