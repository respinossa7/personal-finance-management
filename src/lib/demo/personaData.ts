import { Account, Commitment, Goal, Transaction, WaterfallRun } from "@/domain";

/**
 * Deterministic seed generator for the demo persona: the "Remittance
 * Anchor" archetype from the segmentation model (large fixed obligation
 * home, thin local discretionary margin). Sophia is a UAE expat sending
 * money to family in Kerala every month, six years into her stay, with no
 * idea if she'll be here for one more year or twenty.
 *
 * Deliberately deterministic (no Math.random) so re-running the seed script
 * always produces the same demo state — important when you're about to walk
 * into a room and click through this live.
 */

export const DEMO_USER = {
  name: "Sophia",
  email: "sophia.demo@wio-autopilot.example",
  persona: "remittance_anchor" as const,
};

const MONTHS_2026 = [0, 1, 2, 3, 4, 5]; // Jan - Jun 2026
const REMITTANCE_AMOUNTS = [3000, 3050, 3120, 3200, 3280, 3350]; // ~11.7% creep over 6 months
const REMITTANCE_DAYS = [3, 2, 4, 3, 3, 4];
const DEWA_AMOUNTS = [380, 520, 410, 610, 395, 540]; // deliberately volatile — should NOT be detected as a commitment
const ANGHAMI_MONTHS = [3, 4, 5]; // Apr, May, Jun only — a *new* subscription, still pending confirmation

interface SeedIds {
  currentAccountId: string;
  houseFundAccountId: string;
  rainyDayAccountId: string;
  investAccountId: string;
}

function dateFor(monthIndex: number, day: number): string {
  const d = new Date(Date.UTC(2026, monthIndex, day, 9, 0, 0));
  return d.toISOString();
}

export function buildAccounts(userId: string, ids: SeedIds): Account[] {
  return [
    {
      id: ids.currentAccountId,
      userId,
      name: "Wio Current Account",
      type: "current",
      currency: "AED",
      balance: 9800,
      interestRatePct: 0,
      isLiquid: true,
    },
    {
      id: ids.houseFundAccountId,
      userId,
      name: "Saving Space — House Down Payment",
      type: "savings_space",
      currency: "AED",
      balance: 22000,
      interestRatePct: 6,
      isLiquid: true,
    },
    {
      id: ids.rainyDayAccountId,
      userId,
      name: "Saving Space — Rainy Day (unallocated)",
      type: "savings_space",
      currency: "AED",
      balance: 16500,
      interestRatePct: 0,
      isLiquid: true,
    },
    {
      id: ids.investAccountId,
      userId,
      name: "Wio Invest",
      type: "invest",
      currency: "AED",
      balance: 21000,
      interestRatePct: 0,
      isLiquid: false,
    },
  ];
}

let txCounter = 0;
/** Deterministic, schema-valid UUIDs (transactions.id is uuid) — a fixed
 * prefix plus a zero-padded counter, so re-running the seed script always
 * produces the same ids. */
function txId(): string {
  txCounter += 1;
  const hex = txCounter.toString(16).padStart(12, "0");
  return `99999999-9999-4999-8999-${hex}`;
}

export function buildTransactions(userId: string, currentAccountId: string): Transaction[] {
  txCounter = 0;
  const tx: Transaction[] = [];

  const push = (
    monthIndex: number,
    day: number,
    amount: number,
    direction: Transaction["direction"],
    merchantRaw: string,
    category: string
  ) => {
    tx.push({
      id: txId(),
      userId,
      accountId: currentAccountId,
      postedAt: dateFor(monthIndex, day),
      amount,
      direction,
      merchantRaw,
      category,
    });
  };

  for (const m of MONTHS_2026) {
    push(m, 1, 19500, "credit", "SALARY - TECHCORP FZ LLC", "income");
    push(m, 28, 6500, "debit", "EMAAR PROPERTIES RENT PAYMENT", "housing");
    push(m, REMITTANCE_DAYS[m], REMITTANCE_AMOUNTS[m], "debit", "LULU EXCHANGE NRI REMITTANCE KERALA", "remittance");
    push(m, 5, 45, "debit", "NETFLIX.COM", "subscriptions");
    push(m, 6, 299, "debit", "FITNESS FIRST GYM MEMBERSHIP", "subscriptions");
    push(m, 8, 19.99, "debit", "SPOTIFY AB", "subscriptions");
    push(m, 10, 350, "debit", "ETISALAT MOBILE BILL", "utilities");
    push(m, 12, DEWA_AMOUNTS[m], "debit", "DEWA ELECTRICITY WATER", "utilities");
    push(m, 1, 3200, "debit", "TRANSFER TO SAVING SPACE - HOUSE DOWN PAYMENT", "savings_transfer");

    if (ANGHAMI_MONTHS.includes(m)) {
      push(m, 9, 15.99, "debit", "ANGHAMI MUSIC SUBSCRIPTION", "subscriptions");
    }

    // Discretionary spend — intentionally irregular amounts/days so the
    // detector correctly does NOT group these into commitments.
    push(m, 4, 120 + m * 3, "debit", "CARREFOUR MARKET", "groceries");
    push(m, 11, 145 + m * 2, "debit", "SPINNEYS", "groceries");
    push(m, 18, 160 - m * 2, "debit", "CARREFOUR MARKET", "groceries");
    push(m, 25, 130 + m * 4, "debit", "WAITROSE", "groceries");
    push(m, 7, 90 + m * 5, "debit", "PICKL RESTAURANT", "dining");
    push(m, 15, 150 - m * 3, "debit", "ZAFRAN INDIAN BISTRO", "dining");
    push(m, 22, 110 + m * 2, "debit", "TIM HORTONS", "dining");
    push(m, 2, 28, "debit", "CAREEM RIDE", "transport");
    push(m, 9, 32, "debit", "CAREEM RIDE", "transport");
    push(m, 16, 25, "debit", "RTA SALIK TOPUP", "transport");
    push(m, 23, 40, "debit", "CAREEM RIDE", "transport");
    push(m, 13, 180 - m * 4, "debit", "AMAZON.AE", "shopping");
    push(m, 27, 95 + m * 3, "debit", "NOON.COM", "shopping");
  }

  return tx.sort((a, b) => Date.parse(a.postedAt) - Date.parse(b.postedAt));
}

export function buildCommitments(userId: string, transactions: Transaction[]): Commitment[] {
  const idsFor = (merchantSubstring: string) =>
    transactions
      .filter((t) => t.merchantRaw.toLowerCase().includes(merchantSubstring.toLowerCase()))
      .map((t) => t.id);

  const now = new Date().toISOString();

  return [
    {
      id: "commit_rent",
      userId,
      name: "Emaar Properties — Rent",
      type: "rent",
      amount: 6500,
      currency: "AED",
      cadenceDayOfMonth: 28,
      confidence: 0.97,
      status: "confirmed",
      sourceTransactionIds: idsFor("emaar"),
      detectedAt: now,
    },
    {
      id: "commit_remittance_kerala",
      userId,
      name: "Lulu Exchange — Remittance (Kerala)",
      type: "remittance",
      amount: 3350,
      currency: "AED",
      cadenceDayOfMonth: 3,
      confidence: 0.91,
      status: "confirmed",
      sourceTransactionIds: idsFor("lulu exchange"),
      detectedAt: now,
    },
    {
      id: "commit_netflix",
      userId,
      name: "Netflix",
      type: "subscription",
      amount: 45,
      currency: "AED",
      cadenceDayOfMonth: 5,
      confidence: 0.98,
      status: "confirmed",
      sourceTransactionIds: idsFor("netflix"),
      detectedAt: now,
    },
    {
      id: "commit_gym",
      userId,
      name: "Fitness First — Gym Membership",
      type: "subscription",
      amount: 299,
      currency: "AED",
      cadenceDayOfMonth: 6,
      confidence: 0.96,
      status: "confirmed",
      sourceTransactionIds: idsFor("fitness first"),
      detectedAt: now,
    },
    {
      id: "commit_spotify",
      userId,
      name: "Spotify",
      type: "subscription",
      amount: 19.99,
      currency: "AED",
      cadenceDayOfMonth: 8,
      confidence: 0.98,
      status: "confirmed",
      sourceTransactionIds: idsFor("spotify"),
      detectedAt: now,
    },
    {
      id: "commit_etisalat",
      userId,
      name: "Etisalat",
      type: "other_recurring",
      amount: 350,
      currency: "AED",
      cadenceDayOfMonth: 10,
      confidence: 0.93,
      status: "confirmed",
      sourceTransactionIds: idsFor("etisalat"),
      detectedAt: now,
    },
    {
      id: "commit_anghami",
      userId,
      name: "Anghami Music",
      type: "subscription",
      amount: 15.99,
      currency: "AED",
      cadenceDayOfMonth: 9,
      confidence: 0.74,
      status: "detected", // new pattern, only 3 occurrences — awaiting one-tap confirmation
      sourceTransactionIds: idsFor("anghami"),
      detectedAt: now,
    },
    {
      id: "commit_house_goal",
      userId,
      name: 'Fund "House Down Payment"',
      type: "savings_goal",
      amount: 3200,
      currency: "AED",
      cadenceDayOfMonth: 1,
      confidence: 1,
      status: "confirmed",
      sourceTransactionIds: idsFor("transfer to saving space"),
      detectedAt: now,
    },
  ];
}

/**
 * Six months of real audit-trail history (Jan-Jun 2026) for the salary-day
 * waterfall: the remittance send (creeping in line with REMITTANCE_AMOUNTS)
 * and the house-fund contribution, every month. This is what lets the
 * Progress Reflector narrative (Insights Hub → Goal Progress) summarise
 * "what Autopilot actually did" from real ledger facts instead of invented
 * copy — the undo window on every one of these has long since closed.
 */
export function buildHistoricalWaterfallRuns(
  userId: string,
  currentAccountId: string,
  houseFundAccountId: string,
  goalId: string
): WaterfallRun[] {
  return MONTHS_2026.map((m) => {
    const executedAt = dateFor(m, 1);
    const undoDeadline = new Date(Date.parse(executedAt) + 24 * 60 * 60 * 1000).toISOString();
    return {
      id: `wf_hist_${m}`,
      userId,
      triggeredBy: "salary_day_simulation" as const,
      moves: [
        {
          step: {
            type: "remittance" as const,
            refId: "commit_remittance_kerala",
            amount: REMITTANCE_AMOUNTS[m],
            label: "Send Lulu Exchange — Remittance (Kerala)",
          },
          fromAccountId: currentAccountId,
          amount: REMITTANCE_AMOUNTS[m],
          executedAt,
        },
        {
          step: {
            type: "goal_contribution" as const,
            refId: goalId,
            amount: 3200,
            destinationAccountId: houseFundAccountId,
            label: 'Fund "House Down Payment"',
          },
          fromAccountId: currentAccountId,
          toAccountId: houseFundAccountId,
          amount: 3200,
          executedAt,
        },
      ],
      balancesBefore: {},
      status: "executed" as const,
      executedAt,
      undoDeadline,
    };
  });
}

export function buildGoal(userId: string, goalId: string, houseFundAccountId: string): Goal {
  return {
    id: goalId,
    userId,
    name: "House Down Payment",
    targetAmount: 250000,
    targetDate: "2030-06-01",
    monthlyContribution: 3200,
    fundedAmount: 22000,
    linkedAccountId: houseFundAccountId,
  };
}
