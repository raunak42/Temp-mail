import { DashboardPage } from "@/components/dashboard-page";

export const dynamic = "force-dynamic";

type MailboxPageProps = {
  params: Promise<{
    mailboxId: string;
  }>;
  searchParams: Promise<{
    message?: string;
    q?: string;
  }>;
};

export default async function MailboxPage({
  params,
  searchParams,
}: MailboxPageProps) {
  const [{ mailboxId }, query] = await Promise.all([params, searchParams]);

  return (
    <DashboardPage
      currentPath={`/mailboxes/${mailboxId}`}
      mailboxId={mailboxId}
      messageId={query.message}
      searchQuery={query.q}
    />
  );
}
