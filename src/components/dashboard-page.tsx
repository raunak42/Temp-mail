import Link from "next/link";
import { redirect } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  Archive,
  CircleDot,
  DatabaseZap,
  FolderInput,
  LogOut,
  Mail,
  Orbit,
  Paperclip,
  Search,
  Sparkles,
} from "lucide-react";
import { demoIngestAction, logoutAction, toggleMailboxStatusAction } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { CopyButton } from "@/components/copy-button";
import { CreateMailboxPanel } from "@/components/create-mailbox-panel";
import { env, hasCoreConfig, hasResendConfig, hasStorageConfig } from "@/lib/env";
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
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-[-14rem] mx-auto h-[38rem] w-[42rem] rounded-full bg-[radial-gradient(circle,var(--accent-wash),transparent_60%)] blur-3xl" />
        <div className="absolute bottom-[-16rem] right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,var(--accent-fog),transparent_60%)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1750px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-[22rem_26rem_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
            <div className="flex h-full flex-col gap-4 rounded-[2.2rem] border border-[var(--line-strong)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-start justify-between gap-3">
                <BrandMark />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition duration-200 hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
                    aria-label="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>

              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                <MetricCard
                  label="Active inboxes"
                  value={String(data.stats.activeMailboxes)}
                  detail="Manual expiry only"
                />
                <MetricCard
                  label="Unread mail"
                  value={String(data.stats.unreadMessages)}
                  detail="Across every address"
                />
                <MetricCard
                  label="Attachment vault"
                  value={data.stats.attachmentStorageLabel}
                  detail={hasStorageConfig() ? "Persisted to R2" : "Metadata only"}
                />
              </div>

              <CreateMailboxPanel />

              <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg text-[var(--ink)]">
                      Mailboxes
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {env.emailDomain}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                    <CircleDot className="h-3.5 w-3.5 text-[var(--accent-strong)]" />
                    Private
                  </div>
                </div>

                <div className="space-y-2 overflow-y-auto pr-1 xl:max-h-[26rem]">
                  {data.mailboxes.length === 0 ? (
                    <EmptyRail />
                  ) : (
                    data.mailboxes.map((mailbox) => {
                      const href = `/mailboxes/${mailbox.id}`;
                      const selected = mailbox.id === data.selectedMailbox?.id;

                      return (
                        <Link
                          key={mailbox.id}
                          href={href}
                          className={[
                            "block rounded-[1.7rem] border px-4 py-3 transition duration-200",
                            selected
                              ? "border-[var(--line-strong)] bg-[var(--surface-strong)] shadow-[var(--shadow-soft)]"
                              : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]",
                          ].join(" ")}
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div>
                              <p className="font-display text-base text-[var(--ink)]">
                                {mailbox.label || mailbox.localPart}
                              </p>
                              <p className="font-mono text-[0.73rem] text-[var(--muted)]">
                                {mailbox.emailAddress}
                              </p>
                            </div>
                            <MailboxStatus status={mailbox.status} />
                          </div>

                          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                            <span>{mailbox.messageCount} total</span>
                            <span>{mailbox.unreadCount} unread</span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-auto grid gap-3 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-4">
                <ProviderStatus
                  icon={<FolderInput className="h-4 w-4" />}
                  label="Inbound edge"
                  status={hasResendConfig() ? "Armed" : "Awaiting Resend"}
                  detail="Resend webhooks"
                />
                <ProviderStatus
                  icon={<DatabaseZap className="h-4 w-4" />}
                  label="Attachment storage"
                  status={hasStorageConfig() ? "Pinned" : "Fallback mode"}
                  detail={hasStorageConfig() ? "Cloudflare R2" : "Signed source links"}
                />
              </div>
            </div>
          </aside>

          <section className="rounded-[2.2rem] border border-[var(--line-strong)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-soft)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-display text-2xl text-[var(--ink)]">
                  {data.selectedMailbox
                    ? data.selectedMailbox.label || data.selectedMailbox.localPart
                    : "No active inboxes yet"}
                </p>
                <p className="max-w-[28ch] text-sm leading-6 text-[var(--muted)]">
                  {data.selectedMailbox
                    ? data.selectedMailbox.notes ||
                      "New messages queue here as soon as the address receives mail."
                    : "Create your first address to start collecting inbound mail."}
                </p>
              </div>

              {data.selectedMailbox ? (
                <div className="flex flex-wrap items-center gap-2">
                  <CopyButton value={data.selectedMailbox.emailAddress} />

                  <form action={toggleMailboxStatusAction}>
                    <input
                      type="hidden"
                      name="mailboxId"
                      value={data.selectedMailbox.id}
                    />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition duration-200 hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
                    >
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
                      <input
                        type="hidden"
                        name="redirectTo"
                        value={redirectTo}
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] transition duration-200 hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
                      >
                        <Sparkles className="h-4 w-4" />
                        Demo mail
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </div>

            {data.selectedMailbox ? (
              <>
                <form method="get" action={selectedPath} className="mb-4">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                      type="search"
                      name="q"
                      defaultValue={data.searchQuery}
                      placeholder="Search subject, sender, or snippet"
                      className="field pl-11"
                    />
                  </label>
                </form>

                <div className="space-y-2 overflow-y-auto pr-1 xl:max-h-[74vh]">
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
                            "block rounded-[1.8rem] border px-4 py-4 transition duration-200",
                            selected
                              ? "border-[var(--line-strong)] bg-[var(--surface-strong)] shadow-[var(--shadow-soft)]"
                              : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]",
                          ].join(" ")}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="truncate font-display text-base text-[var(--ink)]">
                              {message.subject || "(No subject)"}
                            </p>
                            {!message.isRead ? (
                              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-strong)]" />
                            ) : null}
                          </div>

                          <div className="mb-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">
                              {message.fromName || message.fromEmail}
                            </span>
                          </div>

                          <p className="mb-3 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                            {message.snippet || "No preview text available."}
                          </p>

                          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                            <span>{formatWhen(message.receivedAt)}</span>
                            {message.hasAttachments ? (
                              <span className="inline-flex items-center gap-1">
                                <Paperclip className="h-3.5 w-3.5" />
                                Attachments
                              </span>
                            ) : null}
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="grid min-h-[42rem] place-items-center rounded-[2rem] border border-dashed border-[var(--line)] bg-[var(--surface)] p-6">
                <div className="max-w-md space-y-4 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-[var(--line)] bg-[var(--surface-panel)] text-[var(--accent-strong)]">
                    <Orbit className="h-7 w-7" />
                  </div>
                  <h2 className="font-display text-3xl text-[var(--ink)]">
                    The deck is empty
                  </h2>
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    Generate a mailbox from the left rail, then wire your domain
                    to Resend when you are ready to receive real mail.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[2.2rem] border border-[var(--line-strong)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-soft)]">
            {data.selectedMessage ? (
              <article className="flex h-full flex-col gap-4">
                <header className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <MailboxStatus status={data.selectedMailbox?.status ?? "active"} />
                    <span className="rounded-full border border-[var(--line)] bg-[var(--surface-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                      {formatWhen(data.selectedMessage.receivedAt)}
                    </span>
                  </div>

                  <h2 className="mb-4 font-display text-[clamp(1.8rem,2.4vw,2.6rem)] leading-tight text-[var(--ink)]">
                    {data.selectedMessage.subject || "(No subject)"}
                  </h2>

                  <dl className="grid gap-3 text-sm text-[var(--muted)] lg:grid-cols-2">
                    <MetaRow
                      label="From"
                      value={
                        data.selectedMessage.fromName
                          ? `${data.selectedMessage.fromName} · ${data.selectedMessage.fromEmail}`
                          : data.selectedMessage.fromEmail
                      }
                    />
                    <MetaRow
                      label="To"
                      value={data.selectedMessage.toAddresses.join(", ")}
                    />
                    {data.selectedMessage.replyTo.length > 0 ? (
                      <MetaRow
                        label="Reply-To"
                        value={data.selectedMessage.replyTo.join(", ")}
                      />
                    ) : null}
                    {data.selectedMessage.ccAddresses.length > 0 ? (
                      <MetaRow
                        label="Cc"
                        value={data.selectedMessage.ccAddresses.join(", ")}
                      />
                    ) : null}
                  </dl>
                </header>

                {data.selectedMessage.attachmentItems.length > 0 ? (
                  <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="font-display text-xl text-[var(--ink)]">
                        Attachments
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
                        {data.selectedMessage.attachmentItems.length} files
                      </span>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      {data.selectedMessage.attachmentItems.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={`/api/attachments/${attachment.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] px-4 py-3 transition duration-200 hover:border-[var(--line-strong)] hover:bg-[var(--surface-strong)]"
                        >
                          <p className="truncate font-medium text-[var(--ink)]">
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

                <section className="flex-1 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-4">
                  {data.selectedMessage.htmlBody ? (
                    <iframe
                      title={data.selectedMessage.subject || "Email preview"}
                      sandbox="allow-popups allow-popups-to-escape-sandbox"
                      className="h-[68vh] w-full rounded-[1.5rem] border border-[var(--line)] bg-white"
                      srcDoc={data.selectedMessage.htmlBody}
                    />
                  ) : (
                    <pre className="h-[68vh] overflow-auto rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface-panel)] p-5 text-sm leading-7 whitespace-pre-wrap text-[var(--ink)]">
                      {data.selectedMessage.textBody || "No email body was provided."}
                    </pre>
                  )}
                </section>
              </article>
            ) : (
              <div className="grid min-h-[42rem] place-items-center rounded-[2rem] border border-dashed border-[var(--line)] bg-[var(--surface)] p-6">
                <div className="max-w-md space-y-4 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-[var(--line)] bg-[var(--surface-panel)] text-[var(--accent-strong)]">
                    <Mail className="h-7 w-7" />
                  </div>
                  <h2 className="font-display text-3xl text-[var(--ink)]">
                    Select a message
                  </h2>
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    The right pane becomes a clean reader once mail starts
                    landing in the selected address.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
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
    <div className="rounded-[1.7rem] border border-[var(--line)] bg-[var(--surface)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-strong)]">
        {props.label}
      </p>
      <p className="mt-2 font-display text-2xl text-[var(--ink)]">
        {props.value}
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">{props.detail}</p>
    </div>
  );
}

function ProviderStatus(props: {
  icon: React.ReactNode;
  label: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--surface-panel)] text-[var(--accent-strong)]">
          {props.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--ink)]">{props.label}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-strong)]">
            {props.detail}
          </p>
        </div>
      </div>
      <span className="rounded-full border border-[var(--line)] bg-[var(--surface-panel)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
        {props.status}
      </span>
    </div>
  );
}

function MailboxStatus(props: { status: "active" | "expired" }) {
  const tone =
    props.status === "active"
      ? "border-[var(--success-line)] bg-[var(--success-surface)] text-[var(--success-ink)]"
      : "border-[var(--warning-line)] bg-[var(--warning-surface)] text-[var(--warning-ink)]";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone}`}
    >
      {props.status}
    </span>
  );
}

function MetaRow(props: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface-panel)] px-4 py-3">
      <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-strong)]">
        {props.label}
      </dt>
      <dd className="font-mono text-[0.75rem] leading-6 text-[var(--ink)]">
        {props.value}
      </dd>
    </div>
  );
}

function EmptyRail() {
  return (
    <div className="rounded-[1.7rem] border border-dashed border-[var(--line)] bg-[var(--surface-panel)] px-4 py-6 text-center">
      <p className="font-display text-lg text-[var(--ink)]">No addresses yet</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Generate the first mailbox to make this rail come alive.
      </p>
    </div>
  );
}

function EmptyMessages() {
  return (
    <div className="rounded-[1.8rem] border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-center">
      <p className="font-display text-xl text-[var(--ink)]">No messages found</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Real mail will appear here once the address is live. Use the demo mail
        button if you want to test the reader now.
      </p>
    </div>
  );
}
