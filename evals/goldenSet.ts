import { RunwayCalculator, PlanService } from "../src/domain";
import type { UserBundle } from "../src/lib/repository/FinanceRepository";

export type ExpectedRoute = "goal_planner" | "cash_flow_interpreter" | "policy_qa";

export interface GoldenScenario {
  name: string;
  /** User messages sent in sequence as one growing conversation — lets a
   * scenario test whether the Orchestrator routes a context-dependent later
   * turn correctly, not just a single message in isolation. */
  turns: string[];
  expectedRoute: ExpectedRoute;
  /** Values that must appear verbatim (numbers) or case-insensitively
   * (strings) in the final turn's answer. Computed from the same fixture via
   * the same domain calculators the real tools use — never hand-typed —
   * so a scenario can't silently drift from what's actually correct. */
  groundTruth: (bundle: UserBundle) => Array<number | string>;
}

export const GOLDEN_SET: GoldenScenario[] = [
  {
    name: "cash-flow-safe-to-spend",
    turns: ["What is safe for me to spend today?"],
    expectedRoute: "cash_flow_interpreter",
    // Only safeToSpendToday is asserted: the question asks specifically
    // about today's spend, and requiring the model to also volunteer the
    // runway-in-months figure it wasn't asked for was over-constraining —
    // that's covered separately by goal-tradeoff-context-dependent-followup.
    groundTruth: (bundle) => {
      const runway = new RunwayCalculator().computeRunway(
        bundle.accounts,
        bundle.commitments,
        bundle.plan.safeToSpendFloor
      );
      return [runway.safeToSpendToday];
    },
  },
  {
    name: "commitments-listing",
    turns: ["What are my recurring commitments?"],
    expectedRoute: "cash_flow_interpreter",
    groundTruth: (bundle) =>
      bundle.commitments.filter((c) => c.status === "confirmed").map((c) => c.amount),
  },
  {
    name: "goal-tradeoff-single-turn",
    turns: ["I want to save AED 90,000 for a wedding by 2029-01-01"],
    expectedRoute: "goal_planner",
    groundTruth: (bundle) => {
      const planService = new PlanService(new RunwayCalculator());
      const tradeoff = planService.computeGoalTradeoff(
        { targetAmount: 90000, targetDate: "2029-01-01", fundedAmount: 0 },
        bundle.accounts,
        bundle.commitments,
        bundle.plan.safeToSpendFloor
      );
      return [tradeoff.monthlyContributionRequired];
    },
  },
  {
    name: "goal-tradeoff-context-dependent-followup",
    turns: [
      "I want to save AED 40,000 for a car by 2027-06-01",
      "how much would that take out of my runway?",
    ],
    expectedRoute: "goal_planner",
    groundTruth: (bundle) => {
      const planService = new PlanService(new RunwayCalculator());
      const tradeoff = planService.computeGoalTradeoff(
        { targetAmount: 40000, targetDate: "2027-06-01", fundedAmount: 0 },
        bundle.accounts,
        bundle.commitments,
        bundle.plan.safeToSpendFloor
      );
      return [tradeoff.projectedRunwayMonthsAfterContribution];
    },
  },
  {
    name: "policy-undo-window",
    turns: ["If Autopilot moves money into my Saving Space, can I undo it?"],
    expectedRoute: "policy_qa",
    groundTruth: () => ["24"],
  },
  {
    name: "policy-interest-rate",
    turns: ["What interest rate do I earn on my Saving Space?"],
    expectedRoute: "policy_qa",
    groundTruth: () => ["6%"],
  },
];
