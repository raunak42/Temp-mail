import Link from "next/link";
import { redirect } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  Archive,
  CircleDot,
  DatabaseZap,
  FolderInput,
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
import {
  env,
  hasCoreConfig,
  hasResendConfig,
  hasStorageConfig,
} from "@/lib/env";
import { getDashboardData } from "@/lib/mailboxes";

type DashboardPageProps = {
  currentPath: string;
  mailboxId?: string;
  messageId?: string;
  searchQuery?: string;
};

function buildHref(pathname: string, messageId?: string, searchQuery?: string) {
  const params = new URLSearchParams();

  if (messageId) {
    params.set("message", messageId);
  }

  if (searchQuery) {
    params.set("q", searchQuery);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function formatWhen(date: Date) {
  return `${formatDistanceToNowStrict(date, { addSuffix: true })} · ${format(
    date,
    "dd MMM yyyy, HH:mm",
  )}`;
}

function formatMailboxMoment(date: Date | null) {
  if (!date) {
    return "No mail received yet";
  }

  return formatWhen(date);
}

export async function DashboardPage({
  currentPath,
  mailboxId,
  messageId,
  searchQuery,
}: DashboardPageProps) {
  if (!hasCoreConfig()) {
    redirect("/login");
  }

  const data = await getDashboardData(mailboxId, searchQuery, messageId);
  const selectedPath = data.selectedMailbox
    ? `/mailboxes/${data.selectedMailbox.id}`
    : currentPath;
  const redirectTo = buildHref(
    currentPath === "/" && data.selectedMailbox ? selectedPath : currentPath,
    data.selectedMessage?.id,
    data.searchQuery,
  );

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--ink)]">
      <div className="mx-auto max-w-[1700px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="panel mb-4 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between xl:justify-start">
              <BrandMark compact />
              <div className="flex flex-wrap items-center gap-2">
                <HeaderPill label="Receiving domain" value={env.emailDomain} />
                <HeaderPill label="Access" value="Private" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ProviderChip
                icon={<FolderInput className="h-3.5 w-3.5" />}
                label="Inbound"
                value={hasResendConfig() ? "Resend armed" : "Resend pending"}
              />
              <ProviderChip
                icon={<DatabaseZap className="h-3.5 w-3.5" />}
                label="Storage"
                value={hasStorageConfig() ? "Persistent" : "Fallback"}
              />
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

        <section className="mb-4 grid gap-3 md:grid-cols-3">
          <MetricCard
            label="Active inboxes"
            value={String(data.stats.activeMailboxes)}
            detail="Each alias stays isolated until you retire it."
          />
          <MetricCard
            label="Unread mail"
            value={String(data.stats.unreadMessages)}
            detail="Unread count rolls up across every mailbox."
          />
          <MetricCard
            label="Attachment footprint"
            value={data.stats.attachmentStorageLabel}
            detail={
              hasStorageConfig()
                ? "Stored in Cloudflare R2"
                : "Using provider-backed links"
            }
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[320px_420px_minmax(0,1fr)]">
          <aside className="panel flex min-h-[32rem] flex-col overflow-hidden">
            <div className="border-b border-[var(--line)] p-4">
              <CreateMailboxPanel />
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-4">
              <div>
                <p className="eyebrow">Mailbox directory</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {data.mailboxes.length} configured addresses
                </p>
              </div>
              <div className="chip">
                <CircleDot className="h-3.5 w-3.5 text-[var(--accent)]" />
                Manual
              </div>
            </div>

            <div className="app-scroll flex-1 space-y-2 overflow-y-auto p-3">
              {data.mailboxes.length === 0 ? (
                <EmptyRail />
              ) : (
                data.mailboxes.map((mailbox) => {
                  const selected = mailbox.id === data.selectedMailbox?.id;

                  return (
                    <Link
                      key={mailbox.id}
                      href={`/mailboxes/${mailbox.id}`}
                      className={[
                        "block rounded-[var(--radius-card)] border px-4 py-3.5",
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent-faint)] shadow-[var(--shadow-soft)]"
                          : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-muted)]",
                      ].join(" ")}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">
                            {mailbox.label || mailbox.localPart}
                          </p>
                          <p className="truncate font-mono text-[0.72rem] text-[var(--muted)]">
                            {mailbox.emailAddress}
                          </p>
                        </div>
                        <MailboxStatus status={mailbox.status} />
                      </div>

                      <div className="grid gap-2 text-xs text-[var(--muted)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                            Messages
                          </span>
                          <span>{mailbox.messageCount}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                            Unread
                          </span>
                          <span>{mailbox.unreadCount}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                            Last received
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
                    </Link>
                  );
                })
              )}
            </div>
          </aside>

          <section className="panel flex min-h-[32rem] flex-col overflow-hidden">
            {data.selectedMailbox ? (
              <>
                <div className="border-b border-[var(--line)] p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="chip">Selected mailbox</span>
                          <MailboxStatus status={data.selectedMailbox.status} />
                        </div>
                        <h2 className="truncate text-[1.6rem] font-medium tracking-[-0.04em] text-[var(--ink)]">
                          {data.selectedMailbox.label || data.selectedMailbox.localPart}
                        </h2>
                        <p className="mt-1 truncate font-mono text-[0.8rem] text-[var(--muted)]">
                          {data.selectedMailbox.emailAddress}
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

                    <div className="grid gap-3 sm:grid-cols-2">
                      <SummaryCard
                        label="Mailbox notes"
                        value={
                          data.selectedMailbox.notes ||
                          "No internal notes yet. This mailbox will keep collecting mail until you archive it."
                        }
                      />
                      <SummaryCard
                        label="Latest activity"
                        value={formatMailboxMoment(data.selectedMailbox.lastReceivedAt)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-b border-[var(--line)] p-4">
                  <form method="get" action={selectedPath}>
                    <label className="relative block">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="search"
                        name="q"
                        defaultValue={data.searchQuery}
                        placeholder="Search subject, sender, or message preview"
                        className="field pl-11"
                      />
                    </label>
                  </form>
                </div>

                <div className="app-scroll flex-1 space-y-2 overflow-y-auto p-3">
                  {data.messages.length === 0 ? (
                    <EmptyMessages />
                  ) : (
                    data.messages.map((message) => {
                      const href = buildHref(selectedPath, message.id, data.searchQuery);
                      const selected = message.id === data.selectedMessage?.id;

                      return (
                        <Link
                          key={message.id}
                          href={href}
                          className={[
                            "relative block overflow-hidden rounded-[var(--radius-card)] border px-4 py-4",
                            selected
                              ? "border-[var(--accent)] bg-[var(--accent-faint)] shadow-[var(--shadow-soft)]"
                              : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-muted)]",
                          ].join(" ")}
                        >
                          {!message.isRead ? (
                            <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-[var(--accent)]" />
                          ) : null}

                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold tracking-[-0.02em] text-[var(--ink)]">
                                {message.subject || "(No subject)"}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">
                                  {message.fromName || message.fromEmail}
                                </span>
                              </div>
                            </div>
                            <span className="whitespace-nowrap text-xs uppercase tracking-[0.14em] text-[var(--muted-strong)]">
                              {format(message.receivedAt, "HH:mm")}
                            </span>
                          </div>

                          <p className="line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                            {message.snippet || "No preview text available."}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                            <span className="chip">{formatWhen(message.receivedAt)}</span>
                            {message.hasAttachments ? (
                              <span className="chip">
                                <Paperclip className="h-3.5 w-3.5" />
                                Attachments
                              </span>
                            ) : null}
                            {!message.isRead ? (
                              <span className="chip">Unread</span>
                            ) : null}
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <PanelEmptyState
                icon={<Inbox className="h-7 w-7" />}
                title="No active inboxes yet"
                detail="Create your first mailbox to start routing incoming mail into isolated inbox views."
              />
            )}
          </section>

          <section className="panel flex min-h-[32rem] flex-col overflow-hidden">
            {data.selectedMessage ? (
              <>
                <header className="border-b border-[var(--line)] p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <MailboxStatus status={data.selectedMailbox?.status ?? "active"} />
                    <span className="chip">{formatWhen(data.selectedMessage.receivedAt)}</span>
                    {data.selectedMessage.hasAttachments ? (
                      <span className="chip">
                        <Paperclip className="h-3.5 w-3.5" />
                        {data.selectedMessage.attachmentItems.length} attachment
                        {data.selectedMessage.attachmentItems.length > 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="text-[clamp(1.8rem,2.5vw,2.8rem)] font-medium leading-tight tracking-[-0.05em] text-[var(--ink)]">
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
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="eyebrow">Attachments</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            Download files captured with this message.
                          </p>
                        </div>
                        <span className="chip">
                          {data.selectedMessage.attachmentItems.length} file
                          {data.selectedMessage.attachmentItems.length > 1 ? "s" : ""}
                        </span>
                      </div>

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
                    <div className="mb-3 flex items-center justify-between gap-3 px-2 pt-1">
                      <div>
                        <p className="eyebrow">Message body</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          HTML previews render inside a sandboxed frame.
                        </p>
                      </div>
                    </div>

                    {data.selectedMessage.htmlBody ? (
                      <iframe
                        title={data.selectedMessage.subject || "Email preview"}
                        sandbox="allow-popups allow-popups-to-escape-sandbox"
                        className="h-[68vh] min-h-[26rem] w-full rounded-[calc(var(--radius-card)-4px)] border border-[var(--line)] bg-white"
                        srcDoc={data.selectedMessage.htmlBody}
                      />
                    ) : (
                      <pre className="h-[68vh] min-h-[26rem] overflow-auto rounded-[calc(var(--radius-card)-4px)] border border-[var(--line)] bg-[var(--surface)] p-5 text-sm leading-7 whitespace-pre-wrap text-[var(--ink)]">
                        {data.selectedMessage.textBody || "No email body was provided."}
                      </pre>
                    )}
                  </section>
                </div>
              </>
            ) : (
              <PanelEmptyState
                icon={<Mail className="h-7 w-7" />}
                title="Select a message"
                detail="Once an email is selected, this pane becomes a focused reader with headers, attachments, and the original body."
              />
            )}
          </section>
        </section>
      </div>
    </main>
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
      <p className="mt-2 text-[1.8rem] font-medium tracking-[-0.05em] text-[var(--ink)]">
        {props.value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{props.detail}</p>
    </div>
  );
}

function ProviderChip(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="chip gap-2 normal-case tracking-normal">
      <span className="text-[var(--muted)]">{props.icon}</span>
      <span className="text-[var(--muted)]">{props.label}</span>
      <span className="font-semibold text-[var(--ink)]">{props.value}</span>
    </div>
  );
}

function HeaderPill(props: { label: string; value: string }) {
  return (
    <div className="chip gap-2 normal-case tracking-normal">
      <span className="text-[var(--muted)]">{props.label}</span>
      <span className="font-medium text-[var(--ink)]">{props.value}</span>
    </div>
  );
}

function SummaryCard(props: { label: string; value: string }) {
  return (
    <div className="panel-muted p-4">
      <p className="eyebrow">{props.label}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{props.value}</p>
    </div>
  );
}

function MailboxStatus(props: { status: "active" | "expired" }) {
  const tone =
    props.status === "active"
      ? "border-[var(--success-line)] bg-[var(--success-surface)] text-[var(--success-ink)]"
      : "border-[var(--warning-line)] bg-[var(--warning-surface)] text-[var(--warning-ink)]";

  return (
    <span className={`chip border ${tone}`}>
      {props.status}
    </span>
  );
}

function MetaField(props: { label: string; value: string }) {
  return (
    <div className="panel-muted p-4">
      <p className="eyebrow">{props.label}</p>
      <p className="mt-2 break-words font-mono text-[0.78rem] leading-6 text-[var(--ink)]">
        {props.value}
      </p>
    </div>
  );
}

function PanelEmptyState(props: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="grid flex-1 place-items-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--ink-soft)]">
          {props.icon}
        </div>
        <h2 className="text-[1.8rem] font-medium tracking-[-0.04em] text-[var(--ink)]">
          {props.title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{props.detail}</p>
      </div>
    </div>
  );
}

function EmptyRail() {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-sm font-medium tracking-[-0.02em] text-[var(--ink)]">
        No mailboxes yet
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Generate an address from the panel above. Each one becomes its own inbox.
      </p>
    </div>
  );
}

function EmptyMessages() {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-sm font-medium tracking-[-0.02em] text-[var(--ink)]">
        No messages yet
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Send mail to this address and it will appear here once the webhook processes it.
      </p>
    </div>
  );
}
