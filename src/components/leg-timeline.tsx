import { MapPin, Calendar } from "lucide-react";

interface Leg {
  legId: string;
  country: string;
  city: string;
  currency: string;
  startDate: string;
  endDate: string;
}

interface LegTimelineProps {
  legs: Leg[];
  activeLegId?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export function LegTimeline({ legs, activeLegId }: LegTimelineProps) {
  return (
    <ol className="relative flex flex-col gap-0">
      {legs.map((leg, i) => {
        const isActive = leg.legId === activeLegId;
        const isLast = i === legs.length - 1;

        return (
          <li key={leg.legId} className="flex gap-3">
            {/* Linha vertical */}
            <div className="flex flex-col items-center">
              <div
                className="mt-1 h-3 w-3 shrink-0 rounded-full border-2"
                style={{
                  borderColor: isActive
                    ? "var(--color-brand-primary)"
                    : "var(--color-border)",
                  backgroundColor: isActive
                    ? "var(--color-brand-primary)"
                    : "var(--color-card)",
                }}
              />
              {!isLast && (
                <div
                  className="w-px flex-1"
                  style={{
                    backgroundColor: "var(--color-border)",
                    minHeight: "1.5rem",
                  }}
                />
              )}
            </div>

            {/* Conteúdo */}
            <div className="pb-4">
              <p
                className="text-sm font-medium"
                style={{
                  color: isActive
                    ? "var(--color-brand-primary)"
                    : "var(--color-foreground)",
                }}
              >
                {leg.city}, {leg.country}
              </p>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {formatDate(leg.startDate)} – {formatDate(leg.endDate)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={10} />
                  {leg.currency}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
