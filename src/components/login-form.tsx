"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { loginAction, type ActionState } from "@/app/actions";

export function LoginForm() {
  const initialState: ActionState = { error: null };
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
          Admin Password
        </span>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoFocus
            placeholder="Enter your dashboard password"
            className="field pr-14"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-panel)] text-[var(--muted-strong)] transition duration-200 hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </label>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] transition duration-200 hover:translate-y-[-1px] hover:shadow-[var(--shadow-glow)]"
      >
        <LockKeyhole className="h-4 w-4" />
        Unlock Mailroom
      </button>

      {state.error ? (
        <p className="rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger-ink)]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
