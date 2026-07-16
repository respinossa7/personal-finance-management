import { Account, Commitment, RunwaySnapshot } from "./types";

/**
 * Computes the two "Runway" numbers that replace the account balance as the
 * home-screen hero metric: safe-to-spend-today and months-of-runway.
 *
 * Deterministic by design (per the proposal's core architecture rule: AI for
 * understanding, deterministic rules for money). No model output ever feeds
 * into these calculations — only confirmed accounts, commitments and plan state.
 */
export class RunwayCalculator {
  constructor(private readonly today: Date = new Date()) {}

  /** Conservative quantile-style buffer: shave a % off the naive estimate so
   * the product under-promises rather than over-promises (a customer who ends
   * the month with more than predicted is delighted; the reverse is churned). */
  private static readonly CONSERVATISM_BUFFER = 0.08;

  computeRunway(
    accounts: Account[],
    commitments: Commitment[],
    safeToSpendFloor: number
  ): RunwaySnapshot {
    const liquidAssets = this.sumLiquidBalances(accounts);
    const confirmed = commitments.filter((c) => c.status === "confirmed");
    const committedMonthlyOutflow = this.sumMonthlyOutflow(confirmed);
    const remainingThisMonth = this.sumRemainingThisMonth(confirmed);
    const daysRemainingInMonth = this.daysRemainingInMonth();

    const currentAccountBalance = this.sumSpendableBalances(accounts);
    const rawSafeToSpend =
      currentAccountBalance - remainingThisMonth - safeToSpendFloor;
    const bufferedSafeToSpend = rawSafeToSpend * (1 - RunwayCalculator.CONSERVATISM_BUFFER);
    const safeToSpendToday = Math.max(0, bufferedSafeToSpend) / Math.max(1, daysRemainingInMonth);

    const runwayMonths =
      committedMonthlyOutflow > 0 ? liquidAssets / committedMonthlyOutflow : Infinity;

    return {
      safeToSpendToday: round2(safeToSpendToday),
      daysRemainingInMonth,
      runwayMonths: Number.isFinite(runwayMonths) ? round1(runwayMonths) : Infinity,
      liquidAssets: round2(liquidAssets),
      committedMonthlyOutflow: round2(committedMonthlyOutflow),
      asOf: this.today.toISOString(),
    };
  }

  private sumLiquidBalances(accounts: Account[]): number {
    return accounts.filter((a) => a.isLiquid).reduce((sum, a) => sum + a.balance, 0);
  }

  private sumSpendableBalances(accounts: Account[]): number {
    return accounts
      .filter((a) => a.type === "current")
      .reduce((sum, a) => sum + a.balance, 0);
  }

  private sumMonthlyOutflow(commitments: Commitment[]): number {
    return commitments.reduce((sum, c) => sum + c.amount, 0);
  }

  /** Commitments whose due day-of-month hasn't passed yet this month. */
  private sumRemainingThisMonth(commitments: Commitment[]): number {
    const todayDom = this.today.getDate();
    return commitments
      .filter((c) => c.cadenceDayOfMonth >= todayDom)
      .reduce((sum, c) => sum + c.amount, 0);
  }

  private daysRemainingInMonth(): number {
    const y = this.today.getFullYear();
    const m = this.today.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    return Math.max(1, lastDay - this.today.getDate() + 1);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
