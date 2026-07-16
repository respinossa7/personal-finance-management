import {
  Account,
  Commitment,
  Plan,
  WaterfallMove,
  WaterfallRun,
  WaterfallStepConfig,
} from "./types";

/**
 * The Hands (Layer 3): the only part of the system that actually moves money.
 * Deterministic, parameterised, reversible for 24h, and rate-limited to one
 * run per salary event. No AI model is in this call path — an LLM may
 * *propose* a rule change elsewhere; only this engine, triggered by an
 * explicit customer action, ever executes a transfer.
 */
export class WaterfallEngine {
  private static readonly UNDO_WINDOW_HOURS = 24;

  /** Builds the default salary-day order: remittance first (the one moment
   * of maximum agency, per Monzo's Salary Sorter principle), then goal
   * contributions, then a floor-protected sweep, then whatever's left is
   * released as safe-to-spend. */
  buildDefaultWaterfall(commitments: Commitment[], plan: Plan): WaterfallStepConfig[] {
    const steps: WaterfallStepConfig[] = [];

    const remittances = commitments.filter(
      (c) => c.type === "remittance" && c.status === "confirmed"
    );
    for (const r of remittances) {
      steps.push({
        type: "remittance",
        refId: r.id,
        amount: r.amount,
        label: `Send ${r.name}`,
      });
    }

    for (const goal of plan.goals) {
      if (goal.monthlyContribution <= 0) continue;
      steps.push({
        type: "goal_contribution",
        refId: goal.id,
        amount: goal.monthlyContribution,
        destinationAccountId: goal.linkedAccountId,
        label: `Fund "${goal.name}"`,
      });
    }

    return steps;
  }

  /**
   * Executes the waterfall against a salary credit. Returns the updated
   * account balances and an auditable WaterfallRun record; never mutates
   * the input accounts array.
   */
  run(
    userId: string,
    accounts: Account[],
    steps: WaterfallStepConfig[],
    safeToSpendFloor: number,
    triggeredBy: WaterfallRun["triggeredBy"] = "salary_day_simulation"
  ): { updatedAccounts: Account[]; waterfallRun: WaterfallRun } {
    const balancesBefore: Record<string, number> = {};
    for (const a of accounts) balancesBefore[a.id] = a.balance;

    const current = accounts.find((a) => a.type === "current");
    if (!current) throw new Error("No current account found to run waterfall against");

    const workingAccounts = accounts.map((a) => ({ ...a }));
    const currentAccount = workingAccounts.find((a) => a.id === current.id)!;
    const moves: WaterfallMove[] = [];
    const executedAt = new Date().toISOString();

    for (const step of steps) {
      if (currentAccount.balance - step.amount < safeToSpendFloor) {
        // Hard guardrail: never let a step push the account below the
        // customer-set floor. Skip and let it surface as an insight instead.
        continue;
      }
      currentAccount.balance -= step.amount;

      if (step.destinationAccountId) {
        const dest = workingAccounts.find((a) => a.id === step.destinationAccountId);
        if (dest) dest.balance += step.amount;
      }

      moves.push({
        step,
        fromAccountId: currentAccount.id,
        toAccountId: step.destinationAccountId,
        amount: step.amount,
        executedAt,
      });
    }

    const undoDeadline = new Date(
      Date.parse(executedAt) + WaterfallEngine.UNDO_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const waterfallRun: WaterfallRun = {
      id: `wf_${Date.now()}`,
      userId,
      triggeredBy,
      moves,
      balancesBefore,
      status: "executed",
      executedAt,
      undoDeadline,
    };

    return { updatedAccounts: workingAccounts, waterfallRun };
  }

  /** Reverts every account to its pre-run snapshot, provided we're still
   * inside the 24h undo window. Throws otherwise so callers can surface a
   * clear "too late to undo" state rather than silently no-op-ing. */
  undo(waterfallRun: WaterfallRun, accounts: Account[]): Account[] {
    if (waterfallRun.status === "undone") {
      throw new Error("This waterfall run has already been undone");
    }
    if (Date.parse(new Date().toISOString()) > Date.parse(waterfallRun.undoDeadline)) {
      throw new Error("Undo window has expired (24h)");
    }

    return accounts.map((a) => ({
      ...a,
      balance: waterfallRun.balancesBefore[a.id] ?? a.balance,
    }));
  }

  isUndoable(waterfallRun: WaterfallRun): boolean {
    return (
      waterfallRun.status === "executed" &&
      Date.parse(new Date().toISOString()) <= Date.parse(waterfallRun.undoDeadline)
    );
  }
}
