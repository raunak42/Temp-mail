import { Orbit } from "lucide-react";
import { env } from "@/lib/env";

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-strong)] text-[var(--accent-strong)] shadow-[var(--shadow-soft)]">
        <Orbit className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="font-display text-[0.7rem] uppercase tracking-[0.32em] text-[var(--muted-strong)]">
          Private Relay Deck
        </p>
        <h1 className="font-display text-xl text-[var(--ink)]">
          {env.appName}
        </h1>
      </div>
    </div>
  );
}
