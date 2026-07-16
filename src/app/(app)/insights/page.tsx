import { redirect } from "next/navigation";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { PlanService } from "@/domain";
import {
  computeThisMonthSnapshot,
  computeThresholdSnapshot,
  DETECTED_MONTHLY_INCOME,
} from "@/lib/demo/intelligence";
import { MoneyProfileCard } from "@/components/insights/MoneyProfileCard";
import { InsightsHubTabs } from "@/components/insights/InsightsHubTabs";
import { ThisMonthView } from "@/components/insights/ThisMonthView";
import { ThresholdTrackerCard } from "@/components/insights/ThresholdTrackerCard";
import { PeerLens } from "@/components/insights/PeerLens";
import { GoalProgressView } from "@/components/insights/GoalProgressView";

export default async function InsightsPage() {
  const userId = await getDemoUserId();
  if (!userId) redirect("/login");

  const repo = new FinanceRepository();
  const [{ accounts, transactions, commitments, goals, plan }, waterfallRuns] = await Promise.all([
    repo.getUserBundle(userId),
    repo.getWaterfallRuns(userId),
  ]);

  const thisMonthSnapshot = computeThisMonthSnapshot(transactions);
  const thresholdSnapshot = computeThresholdSnapshot();
  const savingsRatePct = Math.round((goals[0]?.monthlyContribution ?? 0) / DETECTED_MONTHLY_INCOME * 100);

  const goal = goals[0];

  const moves = waterfallRuns.flatMap((r) => r.moves);
  const reflector = {
    monthsCovered: new Set(waterfallRuns.map((r) => r.executedAt.slice(0, 7))).size,
    totalRemittanceSent: moves
      .filter((m) => m.step.type === "remittance")
      .reduce((sum, m) => sum + m.amount, 0),
    totalGoalFunded: moves
      .filter((m) => m.step.type === "goal_contribution")
      .reduce((sum, m) => sum + m.amount, 0),
  };

  let goalsTab = (
    <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4 text-sm text-text-muted">
      No active goal yet — start one from the Plan tab.
    </div>
  );

  if (goal) {
    const planService = new PlanService();
    const linkedAccount = accounts.find((a) => a.id === goal.linkedAccountId);
    const fundedAmount = linkedAccount?.balance ?? goal.fundedAmount;

    const projection = planService.projectCompletion(
      {
        targetAmount: goal.targetAmount,
        fundedAmount,
        monthlyContribution: goal.monthlyContribution,
      },
      goal.targetDate
    );
    const catchUp = planService.computeGoalTradeoff(
      { targetAmount: goal.targetAmount, targetDate: goal.targetDate, fundedAmount },
      accounts,
      commitments,
      plan.safeToSpendFloor
    );
    const lowerTargetAmount = planService.feasibleTargetAmount(
      goal.monthlyContribution,
      fundedAmount,
      goal.targetDate
    );

    goalsTab = (
      <GoalProgressView
        goal={goal}
        fundedAmount={fundedAmount}
        projection={projection}
        catchUp={catchUp}
        lowerTargetAmount={lowerTargetAmount}
        reflector={reflector}
      />
    );
  }

  return (
    <main className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Insights Hub</h1>
        <p className="mt-1 text-xs text-text-muted">
          Live, forward-looking views — every one carries a button, never just a chart.
        </p>
      </div>

      <MoneyProfileCard />

      <InsightsHubTabs
        month={<ThisMonthView snapshot={thisMonthSnapshot} goalName={goal?.name ?? "your goal"} />}
        threshold={<ThresholdTrackerCard snapshot={thresholdSnapshot} />}
        peers={<PeerLens savingsRatePct={savingsRatePct} />}
        goals={goalsTab}
      />
    </main>
  );
}
