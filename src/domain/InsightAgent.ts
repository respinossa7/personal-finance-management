import {
  Account,
  Commitment,
  Insight,
  Plan,
  RunwaySnapshot,
  Transaction,
} from "./types";

export interface InsightContext {
  userId: string;
  accounts: Account[];
  commitments: Commitment[];
  transactions: Transaction[];
  plan: Plan;
  runway: RunwaySnapshot;
}

/**
 * The Observer agent's deterministic fallback: rule-based insight generation
 * that requires no model call at all. Per the proposal, this is the layer
 * that degrades gracefully — if an LLM-backed version underdelivers or is
 * unavailable, these fixed-template insights still ship, and every single
 * one obeys the product's one hard rule: no insight without an attached
 * action button. A notification without a button is noise, not a product.
 */
export class InsightAgent {
  private static readonly RUNWAY_WARNING_MONTHS = 4;
  private static readonly IDLE_CASH_THRESHOLD = 15000;

  generate(ctx: InsightContext): Insight[] {
    const insights: Insight[] = [
      ...this.detectRunwayDrop(ctx),
      ...this.detectRemittanceCreep(ctx),
      ...this.detectIdleCash(ctx),
    ];
    return insights;
  }

  private detectRunwayDrop(ctx: InsightContext): Insight[] {
    if (ctx.runway.runwayMonths >= InsightAgent.RUNWAY_WARNING_MONTHS) return [];
    return [
      {
        id: `insight_runway_${ctx.userId}`,
        userId: ctx.userId,
        type: "runway_drop",
        message: `Your runway dropped to ${ctx.runway.runwayMonths} months, below your ${InsightAgent.RUNWAY_WARNING_MONTHS}-month comfort line.`,
        action: {
          label: "Review plan",
          kind: "open_plan",
          payload: {},
        },
        createdAt: new Date().toISOString(),
        dismissed: false,
      },
    ];
  }

  private detectRemittanceCreep(ctx: InsightContext): Insight[] {
    const remittances = ctx.commitments.filter((c) => c.type === "remittance");
    const insights: Insight[] = [];

    for (const r of remittances) {
      const sourceTx = ctx.transactions.filter((t) => r.sourceTransactionIds.includes(t.id));
      if (sourceTx.length < 3) continue;
      const sorted = [...sourceTx].sort((a, b) => Date.parse(a.postedAt) - Date.parse(b.postedAt));
      const first = sorted[0].amount;
      const last = sorted[sorted.length - 1].amount;
      const increasePct = (last - first) / first;

      if (increasePct > 0.08) {
        insights.push({
          id: `insight_remit_${r.id}`,
          userId: ctx.userId,
          type: "remittance_cost_creep",
          message: `Your transfer to "${r.name}" has crept up ${(increasePct * 100).toFixed(0)}% since you started it. A scheduled corridor transfer could lock in a better rate.`,
          action: {
            label: "Review transfer",
            kind: "move_funds",
            payload: { commitmentId: r.id },
          },
          createdAt: new Date().toISOString(),
          dismissed: false,
        });
      }
    }
    return insights;
  }

  private detectIdleCash(ctx: InsightContext): Insight[] {
    const idle = ctx.accounts.find(
      (a) => a.isLiquid && a.interestRatePct === 0 && a.balance > InsightAgent.IDLE_CASH_THRESHOLD
    );
    if (!idle) return [];

    return [
      {
        id: `insight_idle_${idle.id}`,
        userId: ctx.userId,
        type: "idle_cash",
        message: `AED ${idle.balance.toFixed(0)} is sitting in ${idle.name} earning 0%. Moving it to a Saving Space could earn ~6% p.a.`,
        action: {
          label: "Move to Saving Space",
          kind: "move_funds",
          payload: { fromAccountId: idle.id },
        },
        createdAt: new Date().toISOString(),
        dismissed: false,
      },
    ];
  }
}
