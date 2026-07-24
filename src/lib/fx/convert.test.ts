import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRates } from "./convert";

test("normaliza respostas de câmbio com chaves em lowercase", () => {
  const raw = {
    date: "2026-07-24",
    usd: {
      brl: 5.42,
      eur: 0.92,
    },
  };

  assert.deepEqual(normalizeRates(raw), {
    USD: {
      BRL: 5.42,
      EUR: 0.92,
    },
  });
});
