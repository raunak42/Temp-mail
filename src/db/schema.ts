import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const mailboxStatusEnum = pgEnum("mailbox_status", [
  "active",
  "expired",
]);

export const messageSourceEnum = pgEnum("message_source", [
  "demo",
  "resend",
]);

export const ingestStatusEnum = pgEnum("ingest_status", [
  "received",
  "stored",
  "ignored",
  "failed",
]);

export const mailboxes = pgTable(
  "mailboxes",
  {
    id: text("id").primaryKey(),
    localPart: text("local_part").notNull(),
    emailAddress: text("email_address").notNull(),
    label: text("label"),
    notes: text("notes"),
    status: mailboxStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastReceivedAt: timestamp("last_received_at", {
      withTimezone: true,
    }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
  },
  (table) => ({
    localPartIdx: uniqueIndex("mailboxes_local_part_idx").on(table.localPart),
    emailAddressIdx: uniqueIndex("mailboxes_email_address_idx").on(
      table.emailAddress,
    ),
    statusIdx: index("mailboxes_status_idx").on(table.status),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    mailboxId: text("mailbox_id")
      .notNull()
      .references(() => mailboxes.id, { onDelete: "cascade" }),
    providerEmailId: text("provider_email_id"),
    source: messageSourceEnum("source").notNull(),
    messageIdHeader: text("message_id_header"),
    subject: text("subject"),
    snippet: text("snippet"),
    fromName: text("from_name"),
    fromEmail: text("from_email").notNull(),
    replyTo: jsonb("reply_to").$type<string[]>().notNull().default([]),
    toAddresses: jsonb("to_addresses").$type<string[]>().notNull().default([]),
    ccAddresses: jsonb("cc_addresses").$type<string[]>().notNull().default([]),
    bccAddresses: jsonb("bcc_addresses")
      .$type<string[]>()
      .notNull()
      .default([]),
    headers: jsonb("headers")
      .$type<Record<string, string> | null>()
      .default(null),
    textBody: text("text_body"),
    htmlBody: text("html_body"),
    isRead: boolean("is_read").notNull().default(false),
    hasAttachments: boolean("has_attachments").notNull().default(false),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    providerEmailIdx: uniqueIndex("messages_provider_email_id_idx").on(
      table.providerEmailId,
    ),
    mailboxReceivedIdx: index("messages_mailbox_received_idx").on(
      table.mailboxId,
      table.receivedAt,
    ),
  }),
);

export const attachments = pgTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    providerAttachmentId: text("provider_attachment_id"),
    filename: text("filename"),
    contentType: text("content_type").notNull(),
    contentDisposition: text("content_disposition"),
    contentId: text("content_id"),
    size: integer("size").notNull().default(0),
    storageKey: text("storage_key"),
    sourceDownloadUrl: text("source_download_url"),
    sourceExpiresAt: timestamp("source_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    messageIdx: index("attachments_message_idx").on(table.messageId),
  }),
);

export const ingestEvents = pgTable(
  "ingest_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    providerEmailId: text("provider_email_id"),
    recipientAddress: text("recipient_address"),
    status: ingestStatusEnum("status").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => ({
    providerEmailIdx: index("ingest_events_provider_email_idx").on(
      table.provider,
      table.providerEmailId,
    ),
  }),
);
