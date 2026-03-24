import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  Archive,
  ArrowLeft,
  ExternalLink,
  Inbox,
  LogOut,
  Mail,
  Paperclip,
  Search,
  Sparkles,
} from "lucide-react";
import {
  demoIngestAction,
  logoutAction,
  toggleMailboxStatusAction,
} from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { CopyButton } from "@/components/copy-button";
import { CreateMailboxPanel } from "@/components/create-mailbox-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { env, hasCoreConfig } from "@/lib/env";
import { getDashboardData } from "@/lib/mailboxes";

type MailboxWorkspacePageProps = {
  mailboxId: string;
  messageId?: string;
  searchQuery?: string;
};

function buildWorkspaceHref(
  mailboxId: string,
  messageId?: string,
  searchQuery?: string,
) {
  const params = new URLSearchParams();

  if (messageId) {
    params.set("message", messageId);
  }

  if (searchQuery) {
    params.set("q", searchQuery);
  }

  const query = params.toString();
  const path = `/mailboxes/${mailboxId}`;
  return query ? `${path}?${query}` : path;
}

function formatWhen(date: Date) {
  return `${formatDistanceToNowStrict(date, { addSuffix: true })} · ${format(
    date,
    "dd MMM yyyy, HH:mm",
  )}`;
}

export async function OverviewPage() {
  if (!hasCoreConfig()) {
    redirect("/login");
  }

  const data = await getDashboardData(undefined, "", undefined, {
    autoSelectFirstMailbox: false,
  });

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--ink)]">
      <div className="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 lg:px-8">
        <MailroomHeader />

        <section className="mb-4 grid gap-3 md:grid-cols-3">
          <MetricCard
            label="Active inboxes"
            value={String(data.stats.activeMailboxes)}
            detail="Inboxes stay active until you archive them."
          />
          <MetricCard
            label="Unread messages"
            value={String(data.stats.unreadMessages)}
            detail="Counted across every mailbox."
          />
          <MetricCard
            label="Attachment size"
            value={data.stats.attachmentStorageLabel}
            detail="Stored payload currently in your account."
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="panel p-4">
            <CreateMailboxPanel />
          </aside>

          <section className="panel flex min-h-[38rem] flex-col overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="eyebrow">Mailbox directory</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {data.mailboxes.length} mailbox
                  {data.mailboxes.length === 1 ? "" : "es"} configured
                </p>
              </div>
              <span className="chip">{env.emailDomain}</span>
            </header>

            <div className="app-scroll flex-1 space-y-2 overflow-y-auto p-3">
              {data.mailboxes.length === 0 ? (
                <PanelEmptyState
                  icon={<Inbox className="h-6 w-6" />}
                  title="No inboxes yet"
                  detail="Create your first mailbox from the left panel and it will appear here."
                />
              ) : (
                data.mailboxes.map((mailbox) => (
                  <Link
                    key={mailbox.id}
                    href={`/mailboxes/${mailbox.id}`}
                    className="block rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 hover:border-[var(--line-strong)] hover:bg-[var(--surface-muted)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">
                          {mailbox.label || mailbox.localPart}
                        </p>
                        <p className="truncate font-mono text-[0.74rem] text-[var(--muted)]">
                          {mailbox.emailAddress}
                        </p>
                      </div>
                      <MailboxStatus status={mailbox.status} />
                    </div>

                    <div className="grid gap-1.5 text-xs text-[var(--muted)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="uppercase tracking-[0.15em] text-[var(--muted-strong)]">
                          Messages
                        </span>
                        <span>{mailbox.messageCount}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="uppercase tracking-[0.15em] text-[var(--muted-strong)]">
                          Unread
                        </span>
                        <span>{mailbox.unreadCount}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="uppercase tracking-[0.15em] text-[var(--muted-strong)]">
                          Last mail
                        </span>
                        <span className="truncate text-right">
                          {mailbox.lastReceivedAt
                            ? formatDistanceToNowStrict(mailbox.lastReceivedAt, {
                                addSuffix: true,
                              })
                            : "Waiting"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-strong)]">
                      Open workspace
                      <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

export async function MailboxWorkspacePage({
  mailboxId,
  messageId,
  searchQuery,
}: MailboxWorkspacePageProps) {
  if (!hasCoreConfig()) {
    redirect("/login");
  }

  const data = await getDashboardData(mailboxId, searchQuery, messageId, {
    autoSelectFirstMailbox: false,
  });

  if (!data.selectedMailbox) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--ink)]">
        <div className="mx-auto max-w-[920px] px-4 py-4 sm:px-6 lg:px-8">
          <MailroomHeader />
          <section className="panel mt-4">
            <PanelEmptyState
              icon={<Inbox className="h-6 w-6" />}
              title="Mailbox not found"
              detail="This address may have been removed. Return to the overview and select an active mailbox."
            />
            <div className="px-6 pb-6">
              <Link href="/" className="button-secondary">
                <ArrowLeft className="h-4 w-4" />
                Back to overview
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const selectedPath = `/mailboxes/${data.selectedMailbox.id}`;
  const redirectTo = buildWorkspaceHref(
    data.selectedMailbox.id,
    data.selectedMessage?.id,
    data.searchQuery,
  );

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--ink)]">
      <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8">
        <MailroomHeader />

        <section className="panel mb-4 mt-4 px-5 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link href="/" className="button-ghost min-h-9 px-3 py-2 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Overview
            </Link>
            <MailboxStatus status={data.selectedMailbox.status} />
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-[1.55rem] font-medium tracking-[-0.04em] text-[var(--ink)]">
                {data.selectedMailbox.label || data.selectedMailbox.localPart}
              </h1>
              <p className="mt-1 truncate font-mono text-[0.8rem] text-[var(--muted)]">
                {data.selectedMailbox.emailAddress}
              </p>
              <p className="mt-3 max-w-[60ch] text-sm leading-7 text-[var(--muted)]">
                {data.selectedMailbox.notes ||
                  "This mailbox keeps all incoming mail until you archive it."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <CopyButton value={data.selectedMailbox.emailAddress} />
              <form action={toggleMailboxStatusAction}>
                <input
                  type="hidden"
                  name="mailboxId"
                  value={data.selectedMailbox.id}
                />
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <button type="submit" className="button-secondary">
                  <Archive className="h-4 w-4" />
                  {data.selectedMailbox.status === "active"
                    ? "Expire mailbox"
                    : "Reactivate"}
                </button>
              </form>
              {env.allowDemoIngest ? (
                <form action={demoIngestAction}>
                  <input
                    type="hidden"
                    name="mailboxId"
                    value={data.selectedMailbox.id}
                  />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <button type="submit" className="button-secondary">
                    <Sparkles className="h-4 w-4" />
                    Seed demo
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="panel flex min-h-[44rem] flex-col overflow-hidden">
            <div className="border-b border-[var(--line)] p-4">
              <form method="get" action={selectedPath}>
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={data.searchQuery}
                    placeholder="Search sender, subject, or preview"
                    className="field pl-11"
                  />
                </label>
              </form>
            </div>

            <div className="app-scroll flex-1 space-y-2 overflow-y-auto p-3">
              {data.messages.length === 0 ? (
                <PanelEmptyState
                  icon={<Mail className="h-6 w-6" />}
                  title="No messages"
                  detail="Send a message to this address and it will appear here."
                />
              ) : (
                data.messages.map((message) => {
                  const selected = message.id === data.selectedMessage?.id;

                  return (
                    <Link
                      key={message.id}
                      href={buildWorkspaceHref(
                        data.selectedMailbox!.id,
                        message.id,
                        data.searchQuery,
                      )}
                      className={[
                        "relative block overflow-hidden rounded-[var(--radius-card)] border px-4 py-4",
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent-faint)]"
                          : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-muted)]",
                      ].join(" ")}
                    >
                      {!message.isRead ? (
                        <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-sm bg-[var(--accent)]" />
                      ) : null}

                      <div className="mb-2 flex items-start justify-between gap-3">
                        <p className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">
                          {message.subject || "(No subject)"}
                        </p>
                        <span className="shrink-0 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--muted-strong)]">
                          {format(message.receivedAt, "HH:mm")}
                        </span>
                      </div>

                      <p className="truncate text-sm text-[var(--muted)]">
                        {message.fromName || message.fromEmail}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                        {message.snippet || "No preview text available."}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
                        <span>{formatWhen(message.receivedAt)}</span>
                        {message.hasAttachments ? (
                          <span className="inline-flex items-center gap-1">
                            <Paperclip className="h-3.5 w-3.5" />
                            files
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </aside>

          <section className="panel flex min-h-[44rem] flex-col overflow-hidden">
            {data.selectedMessage ? (
              <>
                <header className="border-b border-[var(--line)] p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="chip">{formatWhen(data.selectedMessage.receivedAt)}</span>
                    {data.selectedMessage.hasAttachments ? (
                      <span className="chip">
                        <Paperclip className="h-3.5 w-3.5" />
                        {data.selectedMessage.attachmentItems.length} attachment
                        {data.selectedMessage.attachmentItems.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="text-[clamp(1.6rem,2.3vw,2.4rem)] font-medium leading-tight tracking-[-0.04em] text-[var(--ink)]">
                    {data.selectedMessage.subject || "(No subject)"}
                  </h2>

                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    <MetaField
                      label="From"
                      value={
                        data.selectedMessage.fromName
                          ? `${data.selectedMessage.fromName} · ${data.selectedMessage.fromEmail}`
                          : data.selectedMessage.fromEmail
                      }
                    />
                    <MetaField
                      label="To"
                      value={data.selectedMessage.toAddresses.join(", ")}
                    />
                    {data.selectedMessage.replyTo.length > 0 ? (
                      <MetaField
                        label="Reply-To"
                        value={data.selectedMessage.replyTo.join(", ")}
                      />
                    ) : null}
                    {data.selectedMessage.ccAddresses.length > 0 ? (
                      <MetaField
                        label="Cc"
                        value={data.selectedMessage.ccAddresses.join(", ")}
                      />
                    ) : null}
                  </div>
                </header>

                <div className="app-scroll flex-1 space-y-4 overflow-y-auto p-4">
                  {data.selectedMessage.attachmentItems.length > 0 ? (
                    <section className="panel-muted p-4">
                      <p className="eyebrow mb-3">Attachments</p>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {data.selectedMessage.attachmentItems.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/attachments/${attachment.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--line-strong)] hover:bg-[var(--surface-muted)]"
                          >
                            <p className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">
                              {attachment.filename || "attachment"}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {attachment.contentType}
                            </p>
                          </a>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <section className="panel-muted overflow-hidden p-3">
                    {data.selectedMessage.htmlBody ? (
                      <iframe
                        title={data.selectedMessage.subject || "Email preview"}
                        sandbox="allow-popups allow-popups-to-escape-sandbox"
                        className="h-[70vh] min-h-[28rem] w-full rounded-[calc(var(--radius-card)-2px)] border border-[var(--line)] bg-white"
                        srcDoc={data.selectedMessage.htmlBody}
                      />
                    ) : (
                      <pre className="h-[70vh] min-h-[28rem] overflow-auto rounded-[calc(var(--radius-card)-2px)] border border-[var(--line)] bg-[var(--surface)] p-5 text-sm leading-7 whitespace-pre-wrap text-[var(--ink)]">
                        {data.selectedMessage.textBody || "No email body was provided."}
                      </pre>
                    )}
                  </section>
                </div>
              </>
            ) : (
              <PanelEmptyState
                icon={<Mail className="h-6 w-6" />}
                title="Select a message"
                detail="Choose an email from the left column to open it in the reader."
              />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function MailroomHeader() {
  return (
    <header className="panel px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <BrandMark compact />
          <span className="chip">{env.emailDomain}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logoutAction}>
            <button type="submit" className="button-secondary">
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function MetricCard(props: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="panel px-4 py-4">
      <p className="eyebrow">{props.label}</p>
      <p className="mt-2 text-[1.7rem] font-medium tracking-[-0.04em] text-[var(--ink)]">
        {props.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{props.detail}</p>
    </div>
  );
}

function MailboxStatus(props: { status: "active" | "expired" }) {
  const tone =
    props.status === "active"
      ? "border-[var(--success-line)] bg-[var(--success-surface)] text-[var(--success-ink)]"
      : "border-[var(--warning-line)] bg-[var(--warning-surface)] text-[var(--warning-ink)]";

  return <span className={`chip border ${tone}`}>{props.status}</span>;
}

function MetaField(props: { label: string; value: string }) {
  return (
    <div className="panel-muted p-4">
      <p className="eyebrow">{props.label}</p>
      <p className="mt-2 break-words font-mono text-[0.76rem] leading-6 text-[var(--ink)]">
        {props.value}
      </p>
    </div>
  );
}

function PanelEmptyState(props: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="grid min-h-[16rem] place-items-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--ink-soft)]">
          {props.icon}
        </div>
        <h2 className="text-[1.35rem] font-medium tracking-[-0.03em] text-[var(--ink)]">
          {props.title}
        </h2>
        <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{props.detail}</p>
      </div>
    </div>
  );
}
