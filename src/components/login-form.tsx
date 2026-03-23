"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { loginAction, type ActionState } from "@/app/actions";

export function LoginForm() {
  const initialState: ActionState = { error: null };
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <label className="space-y-2.5">
        <span className="eyebrow">Admin password</span>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoFocus
            placeholder="Enter the app password"
            className="field pr-14"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="button-secondary absolute right-1.5 top-1/2 h-10 min-h-10 -translate-y-1/2 px-2.5"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </label>

      <button type="submit" className="button-primary w-full">
        <LockKeyhole className="h-4 w-4" />
        Unlock dashboard
      </button>

      {state.error ? (
        <p className="rounded-[var(--radius-control)] border border-[var(--danger-line)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger-ink)]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
