import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { WebhookEventPayload } from "resend";
import {
  attachments,
  ingestEvents,
  ingestStatusEnum,
  mailboxes,
  messages,
} from "@/db/schema";
import { db } from "@/lib/db";
import { env, hasStorageConfig } from "@/lib/env";
import {
  buildEmailAddress,
  extractSnippet,
  formatBytes,
  generateLocalPart,
  isValidLocalPart,
  makeId,
  normalizeLocalPart,
  parseAddress,
} from "@/lib/mail";
import { getReceivedEmail, listReceivedAttachments } from "@/lib/resend";
import { getAttachmentStream, uploadAttachment } from "@/lib/storage";

type MailboxRow = typeof mailboxes.$inferSelect;
type MessageRow = typeof messages.$inferSelect;

export type DashboardStats = {
  activeMailboxes: number;
  unreadMessages: number;
  attachmentStorageLabel: string;
};

export type MailboxListItem = MailboxRow & {
  unreadCount: number;
  messageCount: number;
};

export type MessageListItem = Pick<
  MessageRow,
  | "id"
  | "subject"
  | "snippet"
  | "fromName"
  | "fromEmail"
  | "isRead"
  | "hasAttachments"
  | "receivedAt"
>;

export type SelectedMessage = MessageRow & {
  attachmentItems: (typeof attachments.$inferSelect)[];
};

export type DashboardData = {
  mailboxes: MailboxListItem[];
  selectedMailbox: MailboxListItem | null;
  messages: MessageListItem[];
  selectedMessage: SelectedMessage | null;
  stats: DashboardStats;
  searchQuery: string;
};

function coerceNumber(value: unknown) {
  return Number(value ?? 0);
}

function sanitizeFilename(input: string | null | undefined) {
  const value = input?.trim() || "attachment";
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function mailboxOrderExpression() {
  return sql`coalesce(max(${messages.receivedAt}), ${mailboxes.createdAt})`;
}

async function getMailboxById(mailboxId: string) {
  const [mailbox] = await db()
    .select()
    .from(mailboxes)
    .where(eq(mailboxes.id, mailboxId))
    .limit(1);

  return mailbox ?? null;
}

async function getMailboxByEmail(emailAddress: string) {
  const normalized = emailAddress.trim().toLowerCase();
  const [mailbox] = await db()
    .select()
    .from(mailboxes)
    .where(eq(mailboxes.emailAddress, normalized))
    .limit(1);

  return mailbox ?? null;
}

async function reserveLocalPart(preferred?: string) {
  if (preferred) {
    const normalized = normalizeLocalPart(preferred);

    if (!isValidLocalPart(normalized)) {
      throw new Error(
        "Use lowercase letters, numbers, dots, hyphens, or underscores for custom aliases.",
      );
    }

    const existing = await getMailboxByEmail(buildEmailAddress(normalized));

    if (existing) {
      throw new Error("That alias is already in use.");
    }

    return normalized;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = generateLocalPart();
    const existing = await getMailboxByEmail(buildEmailAddress(candidate));

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique mailbox address.");
}

export async function createMailbox(options?: {
  preferredLocalPart?: string;
  label?: string;
  notes?: string;
}) {
  const localPart = await reserveLocalPart(options?.preferredLocalPart);
  const mailboxId = makeId();
  const record = {
    id: mailboxId,
    localPart,
    emailAddress: buildEmailAddress(localPart),
    label: options?.label?.trim() || null,
    notes: options?.notes?.trim() || null,
  };

  const [mailbox] = await db().insert(mailboxes).values(record).returning();

  return mailbox;
}

export async function toggleMailboxStatus(mailboxId: string) {
  const mailbox = await getMailboxById(mailboxId);

  if (!mailbox) {
    throw new Error("Mailbox not found.");
  }

  const nextStatus = mailbox.status === "active" ? "expired" : "active";

  await db()
    .update(mailboxes)
    .set({
      status: nextStatus,
      expiredAt: nextStatus === "expired" ? new Date() : null,
    })
    .where(eq(mailboxes.id, mailboxId));

  return nextStatus;
}

export async function listMailboxes() {
  const rows = await db()
    .select({
      id: mailboxes.id,
      localPart: mailboxes.localPart,
      emailAddress: mailboxes.emailAddress,
      label: mailboxes.label,
      notes: mailboxes.notes,
      status: mailboxes.status,
      createdAt: mailboxes.createdAt,
      lastReceivedAt: mailboxes.lastReceivedAt,
      expiredAt: mailboxes.expiredAt,
      unreadCount: sql<number>`count(*) filter (where ${messages.isRead} = false)`,
      messageCount: sql<number>`count(${messages.id})`,
    })
    .from(mailboxes)
    .leftJoin(messages, eq(messages.mailboxId, mailboxes.id))
    .groupBy(mailboxes.id)
    .orderBy(desc(mailboxOrderExpression()));

  return rows.map((row) => ({
    ...row,
    unreadCount: coerceNumber(row.unreadCount),
    messageCount: coerceNumber(row.messageCount),
  }));
}

async function getStats(): Promise<DashboardStats> {
  const [mailboxCountRow, unreadCountRow, attachmentBytesRow] = await Promise.all(
    [
      db()
        .select({
          count: sql<number>`count(*) filter (where ${mailboxes.status} = 'active')`,
        })
        .from(mailboxes),
      db()
        .select({
          count: sql<number>`count(*) filter (where ${messages.isRead} = false)`,
        })
        .from(messages),
      db()
        .select({
          bytes: sql<number>`coalesce(sum(${attachments.size}), 0)`,
        })
        .from(attachments),
    ],
  );

  return {
    activeMailboxes: coerceNumber(mailboxCountRow[0]?.count),
    unreadMessages: coerceNumber(unreadCountRow[0]?.count),
    attachmentStorageLabel: formatBytes(
      coerceNumber(attachmentBytesRow[0]?.bytes),
    ),
  };
}

export async function getDashboardData(
  mailboxId?: string,
  searchQuery = "",
  selectedMessageId?: string,
  options?: {
    autoSelectFirstMailbox?: boolean;
  },
): Promise<DashboardData> {
  const [mailboxItems, stats] = await Promise.all([listMailboxes(), getStats()]);
  const autoSelectFirstMailbox = options?.autoSelectFirstMailbox ?? true;
  const selectedMailbox =
    mailboxItems.find((item) => item.id === mailboxId) ??
    (autoSelectFirstMailbox ? mailboxItems[0] : null) ??
    null;

  if (!selectedMailbox) {
    return {
      mailboxes: mailboxItems,
      selectedMailbox: null,
      messages: [],
      selectedMessage: null,
      stats,
      searchQuery,
    };
  }

  const normalizedSearch = searchQuery.trim();
  const searchPattern = `%${normalizedSearch.replace(/\s+/g, "%")}%`;
  const filters = [eq(messages.mailboxId, selectedMailbox.id)];

  if (normalizedSearch) {
    filters.push(
      or(
        ilike(messages.subject, searchPattern),
        ilike(messages.snippet, searchPattern),
        ilike(messages.fromEmail, searchPattern),
        ilike(messages.fromName, searchPattern),
      )!,
    );
  }

  const messageItems = await db()
    .select({
      id: messages.id,
      subject: messages.subject,
      snippet: messages.snippet,
      fromName: messages.fromName,
      fromEmail: messages.fromEmail,
      isRead: messages.isRead,
      hasAttachments: messages.hasAttachments,
      receivedAt: messages.receivedAt,
    })
    .from(messages)
    .where(and(...filters))
    .orderBy(desc(messages.receivedAt))
    .limit(200);

  const activeMessageId =
    messageItems.find((item) => item.id === selectedMessageId)?.id ??
    messageItems[0]?.id ??
    null;

  if (!activeMessageId) {
    return {
      mailboxes: mailboxItems,
      selectedMailbox,
      messages: messageItems,
      selectedMessage: null,
      stats,
      searchQuery,
    };
  }

  const [selectedMessage] = await db()
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.id, activeMessageId),
        eq(messages.mailboxId, selectedMailbox.id),
      ),
    )
    .limit(1);

  if (!selectedMessage) {
    return {
      mailboxes: mailboxItems,
      selectedMailbox,
      messages: messageItems,
      selectedMessage: null,
      stats,
      searchQuery,
    };
  }

  if (!selectedMessage.isRead) {
    await db()
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, selectedMessage.id));

    const message = messageItems.find((item) => item.id === selectedMessage.id);
    if (message) {
      message.isRead = true;
    }

    const mailbox = mailboxItems.find((item) => item.id === selectedMailbox.id);
    if (mailbox && mailbox.unreadCount > 0) {
      mailbox.unreadCount -= 1;
    }

    if (stats.unreadMessages > 0) {
      stats.unreadMessages -= 1;
    }
  }

  const attachmentItems = await db()
    .select()
    .from(attachments)
    .where(eq(attachments.messageId, selectedMessage.id))
    .orderBy(desc(attachments.createdAt));

  return {
    mailboxes: mailboxItems,
    selectedMailbox,
    messages: messageItems,
    selectedMessage: {
      ...selectedMessage,
      isRead: true,
      attachmentItems,
    },
    stats,
    searchQuery,
  };
}

function buildDemoContent(mailbox: MailboxRow) {
  const samples = [
    {
      subject: "Access link ready for review",
      from: "Onboarding Crew <team@onboardkit.pro>",
      text: `Your shared login bundle is ready.\n\nMailbox: ${mailbox.emailAddress}\n\nEverything is wired for a private review pass.`,
      html: `<p>Your shared login bundle is ready.</p><p><strong>Mailbox:</strong> ${mailbox.emailAddress}</p><p>Everything is wired for a private review pass.</p>`,
    },
    {
      subject: "Product feedback request",
      from: "Research Desk <signals@onboardkit.pro>",
      text: `We just pushed a new signup concept and need a fast gut-check.\n\nReply with the first thing that feels off.`,
      html: `<p>We just pushed a new signup concept and need a fast gut-check.</p><p>Reply with the first thing that feels off.</p>`,
    },
    {
      subject: "Trial confirmation",
      from: "Billing Relay <receipts@onboardkit.pro>",
      text: `Your internal trial environment has been activated.\n\nNo action needed.`,
      html: `<p>Your internal trial environment has been activated.</p><p>No action needed.</p>`,
    },
  ];

  return samples[Math.floor(Math.random() * samples.length)];
}

export async function seedDemoMessage(mailboxId: string) {
  const mailbox = await getMailboxById(mailboxId);

  if (!mailbox) {
    throw new Error("Mailbox not found.");
  }

  const content = buildDemoContent(mailbox);
  const parsedFrom = parseAddress(content.from);

  await db().insert(messages).values({
    id: makeId(),
    mailboxId,
    source: "demo",
    providerEmailId: null,
    messageIdHeader: null,
    subject: content.subject,
    snippet: extractSnippet(content.text, content.html),
    fromName: parsedFrom.name,
    fromEmail: parsedFrom.email,
    replyTo: [parsedFrom.email],
    toAddresses: [mailbox.emailAddress],
    ccAddresses: [],
    bccAddresses: [],
    headers: {
      "x-demo-source": "mailroom",
    },
    textBody: content.text,
    htmlBody: content.html,
    hasAttachments: false,
    receivedAt: new Date(),
  });

  await db()
    .update(mailboxes)
    .set({ lastReceivedAt: new Date() })
    .where(eq(mailboxes.id, mailboxId));
}

async function storeAttachmentFromRemote(options: {
  mailboxId: string;
  messageId: string;
  attachmentId: string;
  filename: string | null;
  contentType: string;
  downloadUrl: string | null;
  expiresAt: string | null;
  contentDisposition: string | null;
  contentId: string | null;
  size?: number;
}) {
  let storageKey: string | null = null;
  let sourceDownloadUrl = options.downloadUrl;
  let sourceExpiresAt = options.expiresAt ? new Date(options.expiresAt) : null;

  if (options.downloadUrl && hasStorageConfig()) {
    try {
      const response = await fetch(options.downloadUrl);

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const fileName = sanitizeFilename(options.filename);
        const key = `mailboxes/${options.mailboxId}/messages/${options.messageId}/${options.attachmentId}-${fileName}`;
        storageKey = await uploadAttachment(key, buffer, options.contentType);
        sourceDownloadUrl = null;
        sourceExpiresAt = null;
      }
    } catch {
      storageKey = null;
    }
  }

  return {
    id: makeId(),
    messageId: options.messageId,
    providerAttachmentId: options.attachmentId,
    filename: options.filename,
    contentType: options.contentType,
    contentDisposition: options.contentDisposition,
    contentId: options.contentId,
    size: options.size ?? 0,
    storageKey,
    sourceDownloadUrl,
    sourceExpiresAt,
  };
}

async function upsertIngestEvent(input: {
  id?: string;
  providerEmailId: string;
  recipientAddress: string | null;
  status: (typeof ingestStatusEnum.enumValues)[number];
  payload: Record<string, unknown>;
  error?: string | null;
}) {
  const payload = {
    id: input.id ?? makeId(),
    provider: "resend",
    providerEmailId: input.providerEmailId,
    recipientAddress: input.recipientAddress,
    status: input.status,
    payload: input.payload,
    error: input.error ?? null,
    processedAt:
      input.status === "received" ? null : new Date(),
  };

  await db().insert(ingestEvents).values(payload);
}

function pickRecipient(addresses: string[]) {
  return (
    addresses.find((address) =>
      address.toLowerCase().endsWith(`@${env.emailDomain.toLowerCase()}`),
    ) ?? addresses[0] ?? null
  );
}

export async function ingestResendEvent(event: WebhookEventPayload) {
  if (event.type !== "email.received") {
    return { stored: false, reason: "ignored-event" };
  }

  const providerEmailId = event.data.email_id;
  const recipientAddress = pickRecipient(event.data.to);

  const existingMessage = await db()
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.providerEmailId, providerEmailId))
    .limit(1);

  if (existingMessage.length > 0) {
    await upsertIngestEvent({
      providerEmailId,
      recipientAddress,
      status: "ignored",
      payload: event as unknown as Record<string, unknown>,
      error: "Duplicate provider email id.",
    });

    return { stored: false, reason: "duplicate" };
  }

  let mailbox =
    recipientAddress ? await getMailboxByEmail(recipientAddress) : null;

  if (!mailbox && env.autoCreateOnReceive && recipientAddress) {
    const localPart = recipientAddress.split("@")[0]!;
    mailbox = await createMailbox({
      preferredLocalPart: localPart,
      label: "Auto-captured",
    });
  }

  if (!mailbox || mailbox.status !== "active") {
    await upsertIngestEvent({
      providerEmailId,
      recipientAddress,
      status: "ignored",
      payload: event as unknown as Record<string, unknown>,
      error: "No active mailbox matched the incoming recipient.",
    });

    return { stored: false, reason: "no-active-mailbox" };
  }

  try {
    const fullEmail = await getReceivedEmail(providerEmailId);
    const remoteAttachments = await listReceivedAttachments(providerEmailId);
    const parsedFrom = parseAddress(fullEmail.from);
    const messageId = makeId();

    const attachmentRecords = await Promise.all(
      fullEmail.attachments.map(async (attachment) => {
        const remoteAttachment = remoteAttachments.find(
          (candidate) => candidate.id === attachment.id,
        );

        return storeAttachmentFromRemote({
          mailboxId: mailbox.id,
          messageId,
          attachmentId: attachment.id,
          filename: attachment.filename,
          contentType: attachment.content_type,
          downloadUrl: remoteAttachment?.download_url ?? null,
          expiresAt: remoteAttachment?.expires_at ?? null,
          contentDisposition: attachment.content_disposition,
          contentId: attachment.content_id,
          size: attachment.size,
        });
      }),
    );

    await db().insert(messages).values({
      id: messageId,
      mailboxId: mailbox.id,
      providerEmailId,
      source: "resend",
      messageIdHeader: fullEmail.message_id,
      subject: fullEmail.subject,
      snippet: extractSnippet(fullEmail.text, fullEmail.html),
      fromName: parsedFrom.name,
      fromEmail: parsedFrom.email,
      replyTo: fullEmail.reply_to ?? [],
      toAddresses: fullEmail.to,
      ccAddresses: fullEmail.cc ?? [],
      bccAddresses: fullEmail.bcc ?? [],
      headers: fullEmail.headers,
      textBody: fullEmail.text,
      htmlBody: fullEmail.html,
      hasAttachments: attachmentRecords.length > 0,
      receivedAt: new Date(fullEmail.created_at),
    });

    if (attachmentRecords.length > 0) {
      await db().insert(attachments).values(attachmentRecords);
    }

    await db()
      .update(mailboxes)
      .set({ lastReceivedAt: new Date(fullEmail.created_at) })
      .where(eq(mailboxes.id, mailbox.id));

    await db().insert(ingestEvents).values({
      id: makeId(),
      provider: "resend",
      providerEmailId,
      recipientAddress,
      status: "stored",
      payload: event as unknown as Record<string, unknown>,
      processedAt: new Date(),
    });

    return { stored: true, reason: "stored" };
  } catch (error) {
    await upsertIngestEvent({
      providerEmailId,
      recipientAddress,
      status: "failed",
      payload: event as unknown as Record<string, unknown>,
      error: error instanceof Error ? error.message : "Unknown ingest failure",
    });

    throw error;
  }
}

export async function resolveAttachmentDownload(attachmentId: string) {
  const [attachment] = await db()
    .select()
    .from(attachments)
    .where(eq(attachments.id, attachmentId))
    .limit(1);

  if (!attachment) {
    return null;
  }

  if (attachment.storageKey) {
    const object = await getAttachmentStream(attachment.storageKey);
    return {
      filename: attachment.filename,
      contentType: attachment.contentType,
      body: object.Body,
    };
  }

  if (attachment.sourceDownloadUrl) {
    const response = await fetch(attachment.sourceDownloadUrl);

    if (!response.ok) {
      throw new Error("The temporary attachment source is no longer available.");
    }

    return {
      filename: attachment.filename,
      contentType: attachment.contentType,
      body: response.body,
    };
  }

  return null;
}
