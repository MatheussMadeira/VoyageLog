import { notFound } from "next/navigation";
import { getTrip } from "@/lib/actions/trips.actions";
import { listExpenses } from "@/lib/actions/expenses.actions";
import { getCategoryBreakdown } from "@/lib/actions/analytics.actions";
import { getCategoryBudgetStatus } from "@/lib/actions/budget.actions";
import { listCategories } from "@/lib/actions/categories.actions";
import { computeTripStatus } from "@/lib/domain/trip-status";
import { resolveActiveLeg } from "@/lib/domain/active-leg";
import { LegTimeline } from "@/components/leg-timeline";
import { TripBudgetOverview } from "@/components/trip-budget-overview";
import { ExpenseListClient } from "@/components/expense-list-client";
import { TripDetailClient } from "./trip-detail-client";
import type { Leg } from "@/lib/validation/trip.schema";
import { resolveBudgetAmountForReferenceCurrency } from "@/lib/domain/budget-amount";

interface Props {
  params: Promise<{ tripId: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

export default async function TripDetailPage({ params }: Props) {
  const { tripId } = await params;
  const [trip, expenses, breakdown, categories, budgetStatus] =
    await Promise.all([
      getTrip(tripId),
      listExpenses(tripId),
      getCategoryBreakdown(tripId),
      listCategories(),
      getCategoryBudgetStatus(tripId),
    ]);

  if (!trip) notFound();

  const legs = trip.legs.map((l) => ({
    ...l,
    startDate: new Date(l.startDate),
    endDate: new Date(l.endDate),
  })) as Leg[];

  const totalBudget = trip.legs.reduce(
    (sum, l) => sum + l.budget.cash + l.budget.debit + l.budget.credit,
    0,
  );

  const totalSpent = expenses.reduce((sum, e) => {
    const converted = resolveBudgetAmountForReferenceCurrency({
      amount: e.amount,
      amountConverted: e.amountConverted,
      currency: e.currency,
      referenceCurrency: trip.referenceCurrency,
    });
    return sum + (converted ?? 0);
  }, 0);

  const status = computeTripStatus(legs);
  const activeLegResult = resolveActiveLeg(legs, new Date());
  const activeLegId = activeLegResult?.leg.legId;

  const STATUS_LABEL: Record<string, string> = {
    active: "Em andamento",
    upcoming: "Próxima",
    past: "Concluída",
  };
  const budgetStatusWithSpend = budgetStatus.filter((b) => b.spent > 0);

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div
        className="mb-6 rounded-2xl px-5 py-4"
        style={{ backgroundColor: "var(--color-brand-ink)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <h1
            className="font-serif text-xl font-semibold"
            style={{ color: "var(--color-brand-ink-foreground)" }}
          >
            {trip.name}
          </h1>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: "oklch(1 0 0 / 12%)",
              color: "oklch(0.85 0.005 260)",
            }}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: "oklch(0.7 0.01 260)" }}>
          {trip.legs[0] && formatDate(trip.legs[0].startDate)} –{" "}
          {trip.legs.at(-1) && formatDate(trip.legs.at(-1)!.endDate)}
          {" · "}
          {trip.referenceCurrency}
        </p>
      </div>

      {/* Itinerário */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Itinerário
        </h2>
        <LegTimeline legs={trip.legs} activeLegId={activeLegId} />
      </section>

      {/* Orçamento geral + por categoria */}
      <TripBudgetOverview
        totalBudget={totalBudget}
        totalSpent={totalSpent}
        budgetStatus={budgetStatusWithSpend}
        currency={trip.referenceCurrency}
      />

      {/* Lista de despesas */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Despesas
        </h2>
        <ExpenseListClient
          tripId={tripId}
          expenses={expenses}
          categories={categories}
          budgetStatus={budgetStatus}
          referenceCurrency={trip.referenceCurrency}
        />
      </section>

      {/* FAB para adicionar despesa (Client Component) */}
      <TripDetailClient
        tripId={tripId}
        referenceCurrency={trip.referenceCurrency}
        totalBudget={totalBudget}
        categories={categories}
        budgetStatus={budgetStatus}
      />
    </main>
  );
}
