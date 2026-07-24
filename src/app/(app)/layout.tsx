"use client";

import { useOnlineStatus } from "@/components/hooks/use-online-status";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();

  return (
    <AppShell>
      {!isOnline && (
        <div
          className="sticky top-0 z-50 px-4 py-2 text-center text-xs font-medium"
          style={{
            backgroundColor: "oklch(0.55 0.14 65 / 15%)",
            color: "oklch(0.45 0.14 65)",
          }}
        >
          Você está offline — exibindo dados salvos
        </div>
      )}
      {children}
    </AppShell>
  );
}
