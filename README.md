# OnboardKit Mailroom

Private temporary mail dashboard for a single operator.

Create a new mailbox in one click, give every address its own inbox, keep mail until you manually expire it, and run the whole stack on managed services that fit free tiers for personal use.

## What’s built

- One-click mailbox creation
- Optional custom alias reservation
- Separate inbox per address
- Manual mailbox expiry and reactivation
- Search inside the active inbox
- Sandboxed HTML email reader
- Attachment persistence to Cloudflare R2 when configured
- Resend inbound webhook ingestion
- Private single-user login with an environment-managed password hash
- Demo ingest path for local testing

## Stack

- `Next.js 16`
- `React 19`
- `Tailwind CSS 4`
- `Drizzle ORM`
- `Neon Postgres`
- `Resend` for inbound email receiving
- `Cloudflare R2` for attachment storage
- `Vercel` for hosting

## Important domain note

Email addresses use `@`.

If you want addresses like:

- `trial123@onboardkit.pro`

then set:

- `EMAIL_DOMAIN=onboardkit.pro`

If you want addresses like:

- `trial123@mail.onboardkit.pro`

then set:

- `EMAIL_DOMAIN=mail.onboardkit.pro`

Using a mail subdomain is safer if `onboardkit.pro` already has a live website or existing MX records.

## Local setup

1. Install dependencies.

```bash
pnpm install
```

2. Copy the env template.

```bash
cp .env.example .env.local
```

3. Generate a password hash.

```bash
pnpm hash-password "your-password"
```

4. Put these values in `.env.local`:

- `AUTH_SECRET`
- `ADMIN_PASSWORD_HASH`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `EMAIL_DOMAIN`

5. Generate and apply the database migration.

```bash
pnpm db:migrate
```

6. Start the app.

```bash
pnpm dev
```

## Environment variables

Core:

- `APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `EMAIL_DOMAIN`
- `AUTH_SECRET`
- `ADMIN_PASSWORD_HASH`
- `DATABASE_URL`

Inbound mail:

- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`

Attachment persistence:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Optional:

- `ALLOW_DEMO_INGEST=true`
- `AUTO_CREATE_ON_RECEIVE=false`

## Database

This repo already includes the first migration in [`drizzle/0000_petite_speed.sql`](./drizzle/0000_petite_speed.sql).

Useful commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:push
```

## How inbound mail works

1. Resend receives mail for your configured domain.
2. Resend sends an `email.received` webhook to `/api/webhooks/resend`.
3. The app verifies the webhook signature.
4. The app fetches the full email body and attachment metadata from Resend.
5. The email is stored in Postgres.
6. Attachments are copied into Cloudflare R2 if R2 is configured.
7. The mailbox UI reads from your database, not from Resend.

That means message retention is controlled by you, not by the provider.

## Production deploy

### 1. Neon

Create a free Neon Postgres database and copy its connection string into:

- `DATABASE_URL`

### 2. Cloudflare R2

Create:

- one bucket
- one access key with read/write access to that bucket

Set:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

If you skip R2, the app still stores messages, but attachments fall back to provider download links and are not guaranteed to last.

### 3. Resend receiving

Create:

- an API key
- a receiving domain
- a webhook pointing to:
  - `https://your-app-domain/api/webhooks/resend`

Set:

- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`

Recommended:

- Keep `AUTO_CREATE_ON_RECEIVE=false`

That way only inboxes you create in the UI will accept mail into the dashboard. This avoids catch-all spam buildup.

### 4. Vercel

Deploy the repo to Vercel and add the same environment variables there.

Then run:

```bash
pnpm db:migrate
```

against your production database before sending live mail into it.

## DNS guide for `onboardkit.pro`

You said the domain is `onboardkit.pro`.

You have two clean options:

### Option A: receive on the root domain

Use:

- `EMAIL_DOMAIN=onboardkit.pro`

Resulting addresses:

- `anything@onboardkit.pro`

Only do this if you are okay moving the MX for the root domain to Resend.

### Option B: receive on a mail subdomain

Use:

- `EMAIL_DOMAIN=mail.onboardkit.pro`

Resulting addresses:

- `anything@mail.onboardkit.pro`

This is the safer setup if the root domain already powers your site or other mail.

### DNS records

In Resend, add the chosen receiving domain and then copy the exact DNS records it gives you:

- `MX` records for receiving
- any verification records it requires

Do not guess these values. Use the current Resend dashboard values for your region and domain.

## Free-tier posture

This architecture is intentionally built around services that have free tiers suitable for a private personal setup:

- `Vercel Hobby`
- `Neon Free`
- `Cloudflare R2 free usage band`
- `Resend free plan`

These limits can change, so confirm current quotas before turning on heavier traffic.

## Verification done in this repo

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

## Next steps after cloning

1. Fill `.env.local`
2. Run `pnpm db:migrate`
3. Run `pnpm dev`
4. Create your first mailbox
5. Configure Resend receiving for your chosen domain
6. Deploy to Vercel
