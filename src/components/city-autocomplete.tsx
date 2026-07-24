"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";

interface CityAutocompleteProps {
  countryCode: string;
  value: string;
  onChange: (city: string) => void;
  required?: boolean;
}

export function CityAutocomplete({
  countryCode,
  value,
  onChange,
  required,
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!countryCode || val.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/geo/cities?countryCode=${countryCode}&q=${encodeURIComponent(val)}`,
        );
        const data = await res.json();
        setSuggestions(data.cities ?? []);
        setOpen((data.cities ?? []).length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function select(city: string) {
    setQuery(city);
    onChange(city);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin
          size={13}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
        />
        <input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={
            countryCode ? "Buscar cidade..." : "Selecione o país primeiro"
          }
          disabled={!countryCode}
          required={required}
          className="w-full rounded-xl border border-[var(--color-input)] bg-transparent py-2.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50"
        />
        {loading && (
          <ChevronDown
            size={13}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-muted-foreground)]"
          />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 z-[300] mt-1 max-h-44 overflow-y-auto rounded-xl border shadow-xl"
          style={{
            backgroundColor: "oklch(0.995 0.002 90)",
            borderColor: "oklch(0.9 0.006 90)",
            color: "oklch(0.18 0.01 260)",
          }}
        >
          {suggestions.map((city) => (
            <li key={city}>
              <button
                type="button"
                onMouseDown={() => select(city)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[oklch(0.955_0.006_90)]"
              >
                <MapPin
                  size={11}
                  className="text-[var(--color-muted-foreground)]"
                />
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
