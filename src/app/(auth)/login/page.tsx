import { ArrowUpRight, Inbox, Layers3, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/auth";
import { hasCoreConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen max-w-[1380px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex items-center justify-between gap-3">
          <BrandMark />
          <ThemeToggle />
        </header>

        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.08fr)_420px]">
          <section className="panel relative overflow-hidden px-6 py-6 sm:px-8 lg:px-10 lg:py-9">
            <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--line-strong),transparent)]" />
            <div className="space-y-5">
              <span className="chip">Single-owner temp mail</span>
              <div className="max-w-[48rem] space-y-4">
                <h1 className="max-w-[12ch] text-[clamp(2.8rem,6vw,5.4rem)] font-medium leading-[0.92] tracking-[-0.06em] text-[var(--ink)]">
                  Private disposable mail with infrastructure-grade control.
                </h1>
                <p className="max-w-[40rem] text-base leading-8 text-[var(--muted)] sm:text-lg">
                  Create addresses on demand, keep every inbox isolated, and
                  inspect inbound mail from a clean single-user dashboard built
                  for deliberate control instead of throwaway clutter.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              <FeatureCard
                icon={<Inbox className="h-4 w-4" />}
                title="Per-alias inboxes"
                detail="Every address gets its own lane, history, and manual lifetime."
              />
              <FeatureCard
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Private by default"
                detail="Single-owner access keeps the control room tight and quiet."
              />
              <FeatureCard
                icon={<Layers3 className="h-4 w-4" />}
                title="Serverless architecture"
                detail="Made for Vercel, Neon, and Resend without self-hosted SMTP."
              />
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="panel-muted overflow-hidden p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Control preview</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Mailboxes stay isolated, readable, and easy to retire.
                    </p>
                  </div>
                  <div className="chip">Live inboxes</div>
                </div>

                <div className="space-y-3">
                  <PreviewRow
                    alias="fable.relay.ocat"
                    subject="Product invite received"
                    detail="Slack • 2m ago"
                  />
                  <PreviewRow
                    alias="launch.batch"
                    subject="Verification code"
                    detail="GitHub • 11m ago"
                  />
                  <PreviewRow
                    alias="quiet.intake"
                    subject="New attachment"
                    detail="Notion • 28m ago"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <aside className="panel-muted p-4">
                  <p className="eyebrow">Why it feels better</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    The interface favors signal over chrome: tighter hierarchy,
                    sharper geometry, and quick actions that stay close to the
                    selected mailbox.
                  </p>
                </aside>
                <aside className="panel-muted p-4">
                  <p className="eyebrow">Mail lifetime</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    Nothing expires unless you choose to archive the mailbox.
                    Every address remains under your control.
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
                    Manual retention
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </aside>
              </div>
            </div>
          </section>

          <section className="panel flex flex-col justify-between p-6 sm:p-8">
            <div className="space-y-3">
              <span className="chip">Access</span>
              <div className="space-y-2">
                <h2 className="text-[1.85rem] font-medium tracking-[-0.04em] text-[var(--ink)]">
                  Unlock the dashboard
                </h2>
                <p className="text-sm leading-7 text-[var(--muted)]">
                  This control room is single-user and locked behind your app
                  password.
                </p>
              </div>
            </div>

            <div className="mt-8">
              {hasCoreConfig() ? (
                <LoginForm />
              ) : (
                <div className="rounded-[var(--radius-card)] border border-[var(--warning-line)] bg-[var(--warning-surface)] p-5">
                  <p className="text-lg font-medium tracking-[-0.03em] text-[var(--warning-ink)]">
                    Core configuration is missing
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--warning-ink)]/85">
                    Set `AUTH_SECRET`, `ADMIN_PASSWORD_HASH`, and `DATABASE_URL`
                    before the login flow can unlock the app.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-[var(--line)] pt-5 text-xs uppercase tracking-[0.16em] text-[var(--muted-strong)]">
              <span>Private deployment</span>
              <span>Manual mailbox lifecycle</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function FeatureCard(props: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="panel-muted p-4">
      <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)]">
        {props.icon}
      </div>
      <p className="text-base font-medium tracking-[-0.03em] text-[var(--ink)]">
        {props.title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {props.detail}
      </p>
    </div>
  );
}

function PreviewRow(props: {
  alias: string;
  subject: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
      <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[0.78rem] text-[var(--muted-strong)]">
          {props.alias}
        </p>
        <p className="truncate text-sm font-medium text-[var(--ink)]">
          {props.subject}
        </p>
      </div>
      <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
        {props.detail}
      </span>
    </div>
  );
}
