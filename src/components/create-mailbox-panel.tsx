"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createMailboxAction, type ActionState } from "@/app/actions";

function SubmitButton() {
  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent-strong)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] transition duration-200 hover:translate-y-[-1px] hover:shadow-[var(--shadow-glow)]"
    >
      <Sparkles className="h-4 w-4" />
      Generate New Address
    </button>
  );
}

export function CreateMailboxPanel() {
  const router = useRouter();
  const initialState: ActionState = { error: null };
  const [state, formAction, pending] = useActionState(
    createMailboxAction,
    initialState,
  );

  useEffect(() => {
    if (state.mailboxId) {
      router.push(`/mailboxes/${state.mailboxId}`);
    }
  }, [router, state.mailboxId]);

  return (
    <section className="rounded-[2rem] border border-[var(--line-strong)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-soft)]">
      <div className="mb-5 space-y-2">
        <p className="font-display text-base text-[var(--ink)]">
          Spin up a fresh relay
        </p>
        <p className="max-w-[28ch] text-sm leading-6 text-[var(--muted)]">
          One click creates a new inbox. Use the advanced section only when you
          want a deliberate alias.
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
            Label
          </span>
          <input
            name="label"
            placeholder="Optional internal note"
            className="field"
          />
        </label>

        <details className="group rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-medium text-[var(--ink)] marker:hidden">
            Reserve a custom alias
          </summary>
          <div className="mt-4 grid gap-3 group-open:animate-[rise-in_280ms_var(--ease-out)_both]">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                Alias
              </span>
              <input
                name="preferredLocalPart"
                placeholder="for example: trial.alpha"
                className="field"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-strong)]">
                Notes
              </span>
              <textarea
                name="notes"
                rows={3}
                placeholder="Why this address exists"
                className="field min-h-24 resize-none"
              />
            </label>
          </div>
        </details>

        <SubmitButton />

        {pending ? (
          <p className="text-sm text-[var(--muted)]">Creating mailbox...</p>
        ) : null}

        {state.error ? (
          <p className="rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger-ink)]">
            {state.error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
