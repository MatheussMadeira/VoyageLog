"use client";

import { useActionState, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/actions/auth.actions";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const router = useRouter();

  // Sign up via Server Action
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    null,
  );

  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  useEffect(() => {
    if (signUpState?.success) {
      signIn("credentials", {
        email: signUpEmail,
        password: signUpPassword,
        redirect: false,
      }).then((result) => {
        if (result?.ok) router.replace("/");
      });
    }
  }, [signUpState?.success]);

  const [signInPending, setSignInPending] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSignInError(null);
    setSignInPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });
    setSignInPending(false);
    if (result?.ok) router.replace("/");
    else setSignInError("E-mail ou senha incorretos.");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Header card */}
      <div
        className="mb-8 w-full max-w-sm rounded-2xl px-6 py-5 text-center"
        style={{ backgroundColor: "var(--color-brand-ink)" }}
      >
        <h1
          className="font-serif text-2xl font-semibold"
          style={{ color: "var(--color-brand-ink-foreground)" }}
        >
          Voyage Log
        </h1>
        <p className="mt-1 text-sm" style={{ color: "oklch(0.7 0.01 260)" }}>
          Registre suas aventuras
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
        {/* Toggle */}
        <div className="mb-5 flex rounded-xl bg-[var(--color-muted)] p-1">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  mode === m ? "var(--color-card)" : "transparent",
                color:
                  mode === m
                    ? "var(--color-foreground)"
                    : "var(--color-muted-foreground)",
              }}
            >
              {m === "signin" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              required
              className="rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              required
              className="rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
            <button
              type="submit"
              disabled={signInPending}
              className="mt-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-brand-primary)",
                color: "var(--color-brand-primary-foreground)",
              }}
            >
              {signInPending ? "Entrando..." : "Entrar"}
            </button>
            {signInError && (
              <p className="text-xs text-[var(--color-destructive)]">
                {signInError}
              </p>
            )}
          </form>
        ) : (
          <form action={signUpAction} className="flex flex-col gap-3">
            <input
              name="name"
              type="text"
              placeholder="Seu nome"
              required
              className="rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              required
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              className="rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
            <input
              name="password"
              type="password"
              placeholder="Senha (mín. 8 caracteres)"
              required
              minLength={8}
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              className="rounded-xl border border-[var(--color-input)] bg-transparent px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            />
            {signUpState && !signUpState.success && (
              <p className="text-xs text-[var(--color-destructive)]">
                {signUpState.error}
              </p>
            )}
            <button
              type="submit"
              disabled={signUpPending}
              className="mt-1 rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-brand-primary)",
                color: "var(--color-brand-primary-foreground)",
              }}
            >
              {signUpPending ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
