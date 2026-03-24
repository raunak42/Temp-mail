import { OverviewPage } from "@/components/dashboard-page";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  await searchParams;

  return <OverviewPage />;
}
