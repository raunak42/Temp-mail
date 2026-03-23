import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
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
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-[-12rem] mx-auto h-[34rem] w-[38rem] rounded-full bg-[radial-gradient(circle,var(--accent-wash),transparent_60%)] blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="mb-10 max-w-xl space-y-8 lg:mb-0">
          <BrandMark />
          <div className="space-y-5">
            <p className="font-display text-[clamp(2.8rem,6vw,5.6rem)] leading-[0.92] text-[var(--ink)]">
              Disposable inboxes, run like a private control room.
            </p>
            <p className="max-w-[34rem] text-base leading-8 text-[var(--muted)]">
              Create fresh addresses instantly, inspect every inbound message in
              its own lane, and keep mail around until you decide otherwise.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FeatureCard
              title="Per-address inboxes"
              detail="Each generated alias gets its own mailbox, history, and manual expiry toggle."
            />
            <FeatureCard
              title="Serverless-ready"
              detail="Designed for Vercel, Neon, Resend, and Cloudflare R2 with no self-hosted SMTP."
            />
          </div>
        </section>

        <section className="rounded-[2.4rem] border border-[var(--line-strong)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="mb-6 space-y-2">
            <p className="font-display text-3xl text-[var(--ink)]">
              Unlock the dashboard
            </p>
            <p className="text-sm leading-7 text-[var(--muted)]">
              The interface is single-user and private by default.
            </p>
          </div>

          {hasCoreConfig() ? (
            <LoginForm />
          ) : (
            <div className="rounded-[2rem] border border-[var(--warning-line)] bg-[var(--warning-surface)] p-5">
              <p className="font-display text-xl text-[var(--warning-ink)]">
                Core configuration is still missing
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--warning-ink)]/80">
                Set `AUTH_SECRET`, `ADMIN_PASSWORD_HASH`, and `DATABASE_URL` in
                your environment before the login flow can work.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FeatureCard(props: { title: string; detail: string }) {
  return (
    <div className="rounded-[1.8rem] border border-[var(--line)] bg-[var(--surface-panel)] p-4">
      <p className="font-display text-lg text-[var(--ink)]">{props.title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {props.detail}
      </p>
    </div>
  );
}
