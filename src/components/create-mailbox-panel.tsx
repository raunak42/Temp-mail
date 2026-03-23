"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { createMailboxAction, type ActionState } from "@/app/actions";
import { env } from "@/lib/env";

function SubmitButton() {
  return (
    <button type="submit" className="button-primary w-full">
      <Sparkles className="h-4 w-4" />
      Create mailbox
      <ArrowRight className="h-4 w-4" />
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
    <section className="panel-muted p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="eyebrow">Mailbox control</p>
          <h2 className="text-lg font-medium tracking-[-0.03em] text-[var(--ink)]">
            Generate a fresh address
          </h2>
          <p className="max-w-[34ch] text-sm leading-6 text-[var(--muted)]">
            One click creates an isolated inbox. Use the advanced section only
            when you need a memorable alias.
          </p>
        </div>
        <span className="chip hidden sm:inline-flex">{env.emailDomain}</span>
      </div>

      <form action={formAction} className="space-y-3">
        <label className="space-y-2">
          <span className="eyebrow">Label</span>
          <input
            name="label"
            placeholder="Optional internal label"
            className="field"
          />
        </label>

        <details className="group panel-strong px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-medium text-[var(--ink)]">
            Advanced alias setup
          </summary>
          <div className="mt-4 grid gap-3 group-open:animate-[rise-in_240ms_var(--ease-out)_both]">
            <label className="space-y-2">
              <span className="eyebrow">Custom alias</span>
              <input
                name="preferredLocalPart"
                placeholder="for example: launch.batch"
                className="field"
              />
            </label>

            <label className="space-y-2">
              <span className="eyebrow">Notes</span>
              <textarea
                name="notes"
                rows={3}
                placeholder="Why this mailbox exists"
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
          <p className="rounded-[var(--radius-control)] border border-[var(--danger-line)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger-ink)]">
            {state.error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
