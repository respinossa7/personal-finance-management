import { Account, Commitment, Goal, Plan, RunwaySnapshot } from "./types";
import { RunwayCalculator } from "./RunwayCalculator";

export interface GoalTradeoffInput {
  targetAmount: number;
  targetDate: string; // ISO date
  fundedAmount: number;
  asOfDate?: string;
}

export interface GoalTradeoffResult {
  monthsRemaining: number;
  monthlyContributionRequired: number;
  projectedRunwayMonthsAfterContribution: number;
  feasible: boolean;
}

export interface GoalProjectionInput {
  targetAmount: number;
  fundedAmount: number;
  monthlyContribution: number;
  asOfDate?: string;
}

export interface GoalProjectionResult {
  monthsRemaining: number;
  projectedCompletionDate: string; // ISO date
  onSchedule: boolean;
  monthsAheadOrBehind: number; // positive = ahead of target date, negative = behind
}

/**
 * The calculation layer behind the conversational "Plan" chat. This is the
 * tool surface an LLM calls: every number the Planner agent says to the
 * customer must come from here, computed and interpolated, never generated.
 * The model's hallucination surface is confined to phrasing.
 */
export class PlanService {
  constructor(private readonly runwayCalculator: RunwayCalculator = new RunwayCalculator()) {}

  /** Given a goal (amount, date, funded-so-far), returns the monthly
   * contribution required and what that does to the customer's runway —
   * the "trade-off, shown honestly" the proposal calls for. */
  computeGoalTradeoff(
    input: GoalTradeoffInput,
    accounts: Account[],
    commitments: Commitment[],
    safeToSpendFloor: number
  ): GoalTradeoffResult {
    const asOf = input.asOfDate ? new Date(input.asOfDate) : new Date();
    const target = new Date(input.targetDate);
    const monthsRemaining = Math.max(
      1,
      monthDiff(asOf, target)
    );

    const remaining = Math.max(0, input.targetAmount - input.fundedAmount);
    const monthlyContributionRequired = round2(remaining / monthsRemaining);

    const baseline = this.runwayCalculator.computeRunway(accounts, commitments, safeToSpendFloor);
    const projectedMonthlyOutflow = baseline.committedMonthlyOutflow + monthlyContributionRequired;
    const projectedRunwayMonthsAfterContribution =
      projectedMonthlyOutflow > 0
        ? round1(baseline.liquidAssets / projectedMonthlyOutflow)
        : Infinity;

    return {
      monthsRemaining,
      monthlyContributionRequired,
      projectedRunwayMonthsAfterContribution,
      feasible: projectedRunwayMonthsAfterContribution >= 3,
    };
  }

  /** The goal-funding calculator's other direction: given a monthly
   * contribution already committed, project when the goal actually
   * completes and compare it against the goal's stated target date. This is
   * what powers the Goal Progress surface's off-schedule flag — a goal is
   * never just a static progress bar, it's compared against its own
   * contract every time this runs. */
  projectCompletion(input: GoalProjectionInput, targetDate: string): GoalProjectionResult {
    const asOf = input.asOfDate ? new Date(input.asOfDate) : new Date();
    const remaining = Math.max(0, input.targetAmount - input.fundedAmount);
    const monthsRemaining =
      input.monthlyContribution > 0 ? Math.ceil(remaining / input.monthlyContribution) : Infinity;

    const projected = addMonths(asOf, monthsRemaining);
    const target = new Date(targetDate);
    const monthsAheadOrBehind = Number.isFinite(monthsRemaining) ? monthDiff(target, projected) * -1 : -Infinity;

    return {
      monthsRemaining: Number.isFinite(monthsRemaining) ? monthsRemaining : Infinity,
      projectedCompletionDate: projected.toISOString().slice(0, 10),
      onSchedule: monthsAheadOrBehind >= 0,
      monthsAheadOrBehind,
    };
  }

  /** "Lower the target" remedy: the goal amount that's actually reachable by
   * the stated target date at the current monthly contribution. */
  feasibleTargetAmount(
    monthlyContribution: number,
    fundedAmount: number,
    targetDate: string,
    asOfDate?: string
  ): number {
    const asOf = asOfDate ? new Date(asOfDate) : new Date();
    const monthsUntilTarget = Math.max(0, monthDiff(asOf, new Date(targetDate)));
    return round2(fundedAmount + monthlyContribution * monthsUntilTarget);
  }

  /** Rebuilds the plan's goal list with an updated/added goal, recomputing
   * fundedAmount trajectory. Pure state transformation — no I/O. */
  upsertGoal(plan: Plan, goal: Goal): Plan {
    const existingIndex = plan.goals.findIndex((g) => g.id === goal.id);
    const goals =
      existingIndex >= 0
        ? plan.goals.map((g, i) => (i === existingIndex ? goal : g))
        : [...plan.goals, goal];

    return { ...plan, goals, updatedAt: new Date().toISOString() };
  }

  currentRunway(
    accounts: Account[],
    commitments: Commitment[],
    safeToSpendFloor: number
  ): RunwaySnapshot {
    return this.runwayCalculator.computeRunway(accounts, commitments, safeToSpendFloor);
  }
}

function monthDiff(from: Date, to: Date): number {
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    (to.getDate() >= from.getDate() ? 0 : -1)
  );
}
function addMonths(d: Date, months: number): Date {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
