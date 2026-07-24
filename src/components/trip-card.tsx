import { computeTripStatus, type TripStatus } from "@/lib/domain/trip-status";
import type { Leg } from "@/lib/validation/trip.schema";
import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";

interface TripCardProps {
  id: string;
  name: string;
  legs: Array<{
    country: string;
    city: string;
    startDate: string;
    endDate: string;
  }>;
}

const STATUS_STYLES: Record<
  TripStatus,
  { label: string; bg: string; color: string }
> = {
  active: {
    label: "Em andamento",
    bg: "oklch(0.52 0.14 150 / 15%)",
    color: "oklch(0.38 0.12 150)",
  },
  upcoming: {
    label: "Próxima",
    bg: "oklch(0.5 0.14 240 / 15%)",
    color: "oklch(0.38 0.12 240)",
  },
  past: {
    label: "Concluída",
    bg: "var(--color-muted)",
    color: "var(--color-muted-foreground)",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function TripCard({ id, name, legs }: TripCardProps) {
  const legsForStatus = legs.map((l) => ({
    ...l,
    legId: "",
    countryCode: "",
    currency: "",
    startDate: new Date(l.startDate),
    endDate: new Date(l.endDate),
    budget: { cash: 0, debit: 0, credit: 0 },
  })) as Leg[];

  const status = computeTripStatus(legsForStatus);
  const style = STATUS_STYLES[status];

  const cities = legs
    .map((l) => l.city)
    .slice(0, 3)
    .join(" → ");
  const firstDate = legs[0]?.startDate;
  const lastDate = legs[legs.length - 1]?.endDate;

  return (
    <Link href={`/trips/${id}`}>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-colors hover:bg-[var(--color-muted)]">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{name}</h3>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: style.bg, color: style.color }}
          >
            {style.label}
          </span>
        </div>

        {cities && (
          <div className="mb-1.5 flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
            <MapPin size={12} />
            <span className="truncate">{cities}</span>
          </div>
        )}

        {firstDate && lastDate && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
            <Calendar size={11} />
            <span>
              {formatDate(firstDate)} – {formatDate(lastDate)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
