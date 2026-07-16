import Anthropic from "@anthropic-ai/sdk";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { PlanService, RunwayCalculator } from "@/domain";

/**
 * The tool surface the Planner agent calls. Every number the chat says to
 * the customer must come from here — computed by RunwayCalculator /
 * PlanService, never generated. The model's hallucination surface is
 * confined to phrasing (the proposal's core architecture rule, applied to
 * the one place free-form generation touches the customer).
 */
export const PLAN_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_runway_snapshot",
    description:
      "Get the customer's current safe-to-spend-today figure, months of runway, liquid assets, and committed monthly outflow. Call this whenever the conversation needs current financial numbers.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_commitments",
    description:
      "List the customer's confirmed recurring commitments (rent, remittance, subscriptions, savings goal contributions) with amounts and the day of month each is due.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "compute_goal_tradeoff",
    description:
      "Given a savings goal (target amount, target date, amount already funded), compute the exact monthly contribution required and what that does to the customer's runway. Call this before stating any monthly contribution figure or feasibility claim.",
    input_schema: {
      type: "object",
      properties: {
        target_amount: { type: "number", description: "Total AED amount needed for the goal" },
        target_date: { type: "string", description: "ISO date (YYYY-MM-DD) the goal should be reached by" },
        funded_amount: { type: "number", description: "AED already saved toward this goal so far (default 0)" },
      },
      required: ["target_amount", "target_date"],
    },
  },
];

export async function executePlanTool(
  userId: string,
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const repo = new FinanceRepository();
  const { accounts, commitments, plan } = await repo.getUserBundle(userId);
  const runwayCalculator = new RunwayCalculator();

  switch (name) {
    case "get_runway_snapshot":
      return runwayCalculator.computeRunway(accounts, commitments, plan.safeToSpendFloor);

    case "list_commitments":
      return commitments
        .filter((c) => c.status === "confirmed")
        .map((c) => ({
          name: c.name,
          type: c.type,
          amountAed: c.amount,
          dueDayOfMonth: c.cadenceDayOfMonth,
        }));

    case "compute_goal_tradeoff": {
      const planService = new PlanService(runwayCalculator);
      return planService.computeGoalTradeoff(
        {
          targetAmount: Number(input.target_amount),
          targetDate: String(input.target_date),
          fundedAmount: Number(input.funded_amount ?? 0),
        },
        accounts,
        commitments,
        plan.safeToSpendFloor
      );
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
