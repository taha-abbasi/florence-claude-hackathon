import PlanDetail from "@/components/plans/PlanDetail";

export const dynamic = "force-dynamic";

export default async function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { planId } = await params;
  const sp = await searchParams;
  return <PlanDetail planId={planId} sp={sp} />;
}
