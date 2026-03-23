CREATE TYPE "public"."ingest_status" AS ENUM('received', 'stored', 'ignored', 'failed');--> statement-breakpoint
CREATE TYPE "public"."mailbox_status" AS ENUM('active', 'expired');--> statement-breakpoint
CREATE TYPE "public"."message_source" AS ENUM('demo', 'resend');--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"provider_attachment_id" text,
	"filename" text,
	"content_type" text NOT NULL,
	"content_disposition" text,
	"content_id" text,
	"size" integer DEFAULT 0 NOT NULL,
	"storage_key" text,
	"source_download_url" text,
	"source_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingest_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_email_id" text,
	"recipient_address" text,
	"status" "ingest_status" NOT NULL,
	"payload" jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mailboxes" (
	"id" text PRIMARY KEY NOT NULL,
	"local_part" text NOT NULL,
	"email_address" text NOT NULL,
	"label" text,
	"notes" text,
	"status" "mailbox_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_received_at" timestamp with time zone,
	"expired_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"mailbox_id" text NOT NULL,
	"provider_email_id" text,
	"source" "message_source" NOT NULL,
	"message_id_header" text,
	"subject" text,
	"snippet" text,
	"from_name" text,
	"from_email" text NOT NULL,
	"reply_to" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"to_addresses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cc_addresses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bcc_addresses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"headers" jsonb DEFAULT 'null'::jsonb,
	"text_body" text,
	"html_body" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_mailbox_id_mailboxes_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_message_idx" ON "attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ingest_events_provider_email_idx" ON "ingest_events" USING btree ("provider","provider_email_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mailboxes_local_part_idx" ON "mailboxes" USING btree ("local_part");--> statement-breakpoint
CREATE UNIQUE INDEX "mailboxes_email_address_idx" ON "mailboxes" USING btree ("email_address");--> statement-breakpoint
CREATE INDEX "mailboxes_status_idx" ON "mailboxes" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "messages_provider_email_id_idx" ON "messages" USING btree ("provider_email_id");--> statement-breakpoint
CREATE INDEX "messages_mailbox_received_idx" ON "messages" USING btree ("mailbox_id","received_at");