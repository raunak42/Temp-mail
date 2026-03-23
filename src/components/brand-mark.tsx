import { PanelTop } from "lucide-react";
import { env } from "@/lib/env";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-[1rem] border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-soft)]">
        <PanelTop className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="eyebrow">Private relay deck</p>
        <p
          className={[
            "truncate font-display font-medium tracking-[-0.03em] text-[var(--ink)]",
            compact ? "text-base" : "text-lg",
          ].join(" ")}
        >
          {env.appName}
        </p>
      </div>
    </div>
  );
}
