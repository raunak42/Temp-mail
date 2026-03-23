import { DashboardPage } from "@/components/dashboard-page";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    message?: string;
    q?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  return (
    <DashboardPage
      currentPath="/"
      messageId={params.message}
      searchQuery={params.q}
    />
  );
}
