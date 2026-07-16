import Link from "next/link";
import { redirect } from "next/navigation";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { RunwayCalculator, InsightAgent } from "@/domain";
import { computeThresholdSnapshot } from "@/lib/demo/intelligence";
import { narrateInsight } from "@/lib/langchain/narrator";
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

  // Insight Narrator: rephrases each deterministic insight conversationally.
  // The rule-based message (and every number in it) is the source of truth;
  // on any Narrator failure we fall back to it rather than hide the insight.
  const narratedInsights = await Promise.all(
    visibleInsights.map(async (insight) => {
      try {
        const message = await narrateInsight(insight);
        return { ...insight, message };
      } catch {
        return insight;
      }
    })
  );

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

      {narratedInsights.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-faint">
            Insights
          </p>
          {narratedInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </section>
      )}

      <CommitmentBreakdown commitments={commitments} />
    </main>
  );
}
