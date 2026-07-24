"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createTrip } from "@/lib/actions/trips.actions";
import { COUNTRIES } from "@/lib/data/countries";
import { CityAutocomplete } from "@/components/city-autocomplete";
import { useOnlineStatus } from "@/components/hooks/use-online-status";
import { ObjectId } from "bson";

interface LegForm {
  tempId: string;
  country: string;
  countryCode: string;
  city: string;
  currency: string;
  startDate: string;
  endDate: string;
  budgetCash: string;
  budgetDebit: string;
  budgetCredit: string;
}

function newLeg(): LegForm {
  return {
    tempId: new ObjectId().toString(),
    country: "",
    countryCode: "",
    city: "",
    currency: "",
    startDate: "",
    endDate: "",
    budgetCash: "0",
    budgetDebit: "0",
    budgetCredit: "0",
  };
}

export default function NewTripPage() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [referenceCurrency, setReferenceCurrency] = useState("USD");
  const [legs, setLegs] = useState<LegForm[]>([newLeg()]);

  function updateLeg(index: number, patch: Partial<LegForm>) {
    setLegs((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );
  }

  function handleCountryChange(index: number, code: string) {
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) return;
    updateLeg(index, {
      countryCode: country.code,
      country: country.name,
      currency: country.currency,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input = {
      name,
      referenceCurrency,
      legs: legs.map((l) => ({
        legId: l.tempId,
        country: l.country,
        countryCode: l.countryCode,
        city: l.city,
        currency: l.currency,
        startDate: new Date(l.startDate),
        endDate: new Date(l.endDate),
        budget: {
          cash: parseFloat(l.budgetCash) || 0,
          debit: parseFloat(l.budgetDebit) || 0,
          credit: parseFloat(l.budgetCredit) || 0,
        },
      })),
    };

    startTransition(async () => {
      const result = await createTrip(input);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.replace(`/trips/${result.data!.id}`);
    });
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <div
        className="mb-6 rounded-2xl px-5 py-4"
        style={{ backgroundColor: "var(--color-brand-ink)" }}
      >
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--color-brand-ink-foreground)" }}
        >
          Nova viagem
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nome + moeda */}
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da viagem"
            required
            className="flex-1 rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          />
          <select
            value={referenceCurrency}
            onChange={(e) => setReferenceCurrency(e.target.value)}
            className="rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          >
            {["USD", "EUR", "BRL", "GBP", "ARS", "CLP", "COP"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Pernas */}
        <h2 className="text-sm font-semibold text-[var(--color-muted-foreground)]">
          Pernas da viagem
        </h2>

        {legs.map((leg, i) => (
          <div
            key={leg.tempId}
            className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 overflow-visible"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Perna {i + 1}
              </span>
              {legs.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLegs((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="text-[var(--color-destructive)]"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <select
              value={leg.countryCode}
              onChange={(e) => handleCountryChange(i, e.target.value)}
              required
              className="rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            >
              <option value="">País</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <CityAutocomplete
                countryCode={leg.countryCode}
                value={leg.city}
                onChange={(city) => updateLeg(i, { city })}
                required
              />
              <input
                value={leg.currency}
                onChange={(e) =>
                  updateLeg(i, { currency: e.target.value.toUpperCase() })
                }
                placeholder="Moeda (ex: BRL)"
                maxLength={3}
                required
                className="rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
                  Início
                </label>
                <input
                  type="date"
                  value={leg.startDate}
                  onChange={(e) => updateLeg(i, { startDate: e.target.value })}
                  required
                  className="w-full rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
                  Fim
                </label>
                <input
                  type="date"
                  value={leg.endDate}
                  onChange={(e) => updateLeg(i, { endDate: e.target.value })}
                  required
                  className="w-full rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["Cash", "Debit", "Credit"] as const).map((m) => (
                <div key={m}>
                  <label className="mb-1 block text-xs text-[var(--color-muted-foreground)]">
                    {m}
                  </label>
                  <input
                    type="number"
                    value={leg[`budget${m}` as keyof LegForm]}
                    onChange={(e) =>
                      updateLeg(i, {
                        [`budget${m}`]: e.target.value,
                      } as Partial<LegForm>)
                    }
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setLegs((prev) => [...prev, newLeg()])}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] py-3 text-sm text-[var(--color-muted-foreground)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]"
        >
          <Plus size={15} />
          Adicionar perna
        </button>

        {error && (
          <p className="text-sm text-[var(--color-destructive)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending || !isOnline}
          className="rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-brand-primary)",
            color: "var(--color-brand-primary-foreground)",
          }}
        >
          {isPending ? "Criando..." : "Criar viagem"}
        </button>
      </form>
    </main>
  );
}
