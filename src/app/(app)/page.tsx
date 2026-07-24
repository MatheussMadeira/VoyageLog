import { listTrips } from "@/lib/actions/trips.actions";
import { computeTripStatus } from "@/lib/domain/trip-status";
import { TripCard } from "@/components/trip-card";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Leg } from "@/lib/validation/trip.schema";

export default async function HomePage() {
  const trips = await listTrips();

  const active = trips.filter((t) => {
    const legs = t.legs.map((l) => ({
      ...l,
      legId: l.legId,
      countryCode: "",
      currency: l.currency,
      startDate: new Date(l.startDate),
      endDate: new Date(l.endDate),
      budget: l.budget,
    })) as Leg[];
    return computeTripStatus(legs) === "active";
  });

  const upcoming = trips.filter((t) => {
    const legs = t.legs.map((l) => ({
      ...l,
      legId: l.legId,
      countryCode: "",
      currency: l.currency,
      startDate: new Date(l.startDate),
      endDate: new Date(l.endDate),
      budget: l.budget,
    })) as Leg[];
    return computeTripStatus(legs) === "upcoming";
  });

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div
        className="mb-6 rounded-2xl px-5 py-4"
        style={{ backgroundColor: "var(--color-brand-ink)" }}
      >
        <h1
          className="font-serif text-xl font-semibold"
          style={{ color: "var(--color-brand-ink-foreground)" }}
        >
          Voyage Log
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: "oklch(0.7 0.01 260)" }}>
          Suas expedições
        </p>
      </div>

      {/* Active */}
      {active.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Em andamento
          </h2>
          <div className="flex flex-col gap-3">
            {active.map((t) => (
              <TripCard key={t.id} id={t.id} name={t.name} legs={t.legs} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Próximas
          </h2>
          <div className="flex flex-col gap-3">
            {upcoming.map((t) => (
              <TripCard key={t.id} id={t.id} name={t.name} legs={t.legs} />
            ))}
          </div>
        </section>
      )}

      {trips.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-[var(--color-muted-foreground)]">
            Nenhuma viagem ainda.
          </p>
          <Link
            href="/trips/new"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--color-brand-primary)",
              color: "var(--color-brand-primary-foreground)",
            }}
          >
            <Plus size={15} />
            Nova viagem
          </Link>
        </div>
      )}
    </main>
  );
}
