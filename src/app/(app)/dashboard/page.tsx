import Link from "next/link";
import { redirect } from "next/navigation";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { RunwayCalculator, InsightAgent } from "@/domain";
import { computeThresholdSnapshot } from "@/lib/demo/intelligence";
import { RunwayHero } from "@/components/RunwayHero";
import { CommitmentBreakdown } from "@/components/CommitmentBreakdown";
import { InsightCard } from "@/components/InsightCard";
import { ChevronRight } from "lucide-react";

export default async function DashboardPage() {
  const userId = await getDemoUserId();
  if (!userId) redirect("/login");

  const repo = new FinanceRepository();
  const { accounts, transactions, commitments, plan } = await repo.getUserBundle(userId);

  const runway = new RunwayCalculator().computeRunway(accounts, commitments, plan.safeToSpendFloor);
  const threshold = computeThresholdSnapshot();

  const freshInsights = new InsightAgent().generate({
    userId,
    accounts,
    commitments,
    transactions,
    plan,
    runway,
  });
  const dismissedIds = await repo.getDismissedInsightIds(userId);
  const visibleInsights = freshInsights.filter((i) => !dismissedIds.has(i.id));

  const pendingCount = commitments.filter((c) => c.status === "detected").length;

  return (
    <main className="flex flex-col gap-4 p-4">
      <RunwayHero runway={runway} threshold={threshold} />

      {pendingCount > 0 && (
        <Link
          href="/commitments"
          className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-text"
        >
          <span>
            {pendingCount} new recurring payment{pendingCount > 1 ? "s" : ""} detected — needs your
            confirmation
          </span>
          <ChevronRight size={16} className="text-primary" />
        </Link>
      )}

      {visibleInsights.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-faint">
            Insights
          </p>
          {visibleInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </section>
      )}

      <CommitmentBreakdown commitments={commitments} />
    </main>
  );
}
