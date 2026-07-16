import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { PlanService, RunwayCalculator } from "@/domain";

/**
 * The tool surface every specialist agent calls. Every number an agent says
 * to the customer must come from here — computed by RunwayCalculator /
 * PlanService, never generated. The model's hallucination surface is
 * confined to phrasing (the proposal's core architecture rule).
 *
 * Scoped to a single userId per call site since each chat request is a
 * fresh set of tool instances bound to the requesting customer.
 */
export function createFinanceTools(userId: string) {
  const repo = new FinanceRepository();
  const runwayCalculator = new RunwayCalculator();
  const planService = new PlanService(runwayCalculator);

  const getRunwaySnapshot = tool(
    async () => {
      const { accounts, commitments, plan } = await repo.getUserBundle(userId);
      return runwayCalculator.computeRunway(accounts, commitments, plan.safeToSpendFloor);
    },
    {
      name: "get_runway_snapshot",
      description:
        "Get the customer's current safe-to-spend-today figure, months of runway, liquid assets, and committed monthly outflow. Call this whenever the conversation needs current financial numbers.",
      schema: z.object({}),
    }
  );

  const listCommitments = tool(
    async () => {
      const { commitments } = await repo.getUserBundle(userId);
      return commitments
        .filter((c) => c.status === "confirmed")
        .map((c) => ({
          name: c.name,
          type: c.type,
          amountAed: c.amount,
          dueDayOfMonth: c.cadenceDayOfMonth,
        }));
    },
    {
      name: "list_commitments",
      description:
        "List the customer's confirmed recurring commitments (rent, remittance, subscriptions, savings goal contributions) with amounts and the day of month each is due.",
      schema: z.object({}),
    }
  );

  const computeGoalTradeoff = tool(
    async ({ target_amount, target_date, funded_amount }) => {
      const { accounts, commitments, plan } = await repo.getUserBundle(userId);
      return planService.computeGoalTradeoff(
        { targetAmount: target_amount, targetDate: target_date, fundedAmount: funded_amount ?? 0 },
        accounts,
        commitments,
        plan.safeToSpendFloor
      );
    },
    {
      name: "compute_goal_tradeoff",
      description:
        "Given a savings goal (target amount, target date, amount already funded), compute the exact monthly contribution required and what that does to the customer's runway. Call this before stating any monthly contribution figure or feasibility claim.",
      schema: z.object({
        target_amount: z.number().describe("Total AED amount needed for the goal"),
        target_date: z.string().describe("ISO date (YYYY-MM-DD) the goal should be reached by"),
        funded_amount: z.number().optional().describe("AED already saved toward this goal so far (default 0)"),
      }),
    }
  );

  return { getRunwaySnapshot, listCommitments, computeGoalTradeoff };
}
