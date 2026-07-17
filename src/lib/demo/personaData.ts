import { Account, Commitment, Goal, Transaction, WaterfallRun } from "@/domain";

/**
 * Deterministic seed generator for the demo persona: the "Steady Saver"
 * archetype from the segmentation model (predictable income, one clear
 * savings goal, everyday spend). Alex is a salaried professional six months
 * into building a house down-payment fund.
 *
 * Deliberately deterministic (no Math.random) so re-running the seed script
 * always produces the same demo state — important when you're about to walk
 * into a room and click through this live.
 */

export const DEMO_USER = {
  name: "Alex",
  email: "alex.demo@runway.example",
  persona: "steady_saver" as const,
};

const MONTHS_2026 = [0, 1, 2, 3, 4, 5]; // Jan - Jun 2026
const UTILITY_AMOUNTS = [380, 520, 410, 610, 395, 540]; // deliberately volatile — should NOT be detected as a commitment
const NEW_STREAMING_MONTHS = [3, 4, 5]; // Apr, May, Jun only — a *new* subscription, still pending confirmation

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
      name: "Current Account",
      type: "current",
      currency: "$",
      balance: 9800,
      interestRatePct: 0,
      isLiquid: true,
    },
    {
      id: ids.houseFundAccountId,
      userId,
      name: "Saving Space — House Down Payment",
      type: "savings_space",
      currency: "$",
      balance: 22000,
      interestRatePct: 6,
      isLiquid: true,
    },
    {
      id: ids.rainyDayAccountId,
      userId,
      name: "Saving Space — Rainy Day (unallocated)",
      type: "savings_space",
      currency: "$",
      balance: 16500,
      interestRatePct: 0,
      isLiquid: true,
    },
    {
      id: ids.investAccountId,
      userId,
      name: "Investment Account",
      type: "invest",
      currency: "$",
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
    push(m, 1, 19500, "credit", "SALARY - TECHCORP INC", "income");
    push(m, 28, 6500, "debit", "RENT PAYMENT - PROPERTY MANAGEMENT CO", "housing");
    push(m, 5, 45, "debit", "NETFLIX.COM", "subscriptions");
    push(m, 6, 299, "debit", "FITNESS CLUB MEMBERSHIP", "subscriptions");
    push(m, 8, 19.99, "debit", "SPOTIFY AB", "subscriptions");
    push(m, 10, 350, "debit", "MOBILE PHONE BILL", "utilities");
    push(m, 12, UTILITY_AMOUNTS[m], "debit", "ELECTRICITY AND WATER UTILITY", "utilities");
    push(m, 1, 3200, "debit", "TRANSFER TO SAVING SPACE - HOUSE DOWN PAYMENT", "savings_transfer");

    if (NEW_STREAMING_MONTHS.includes(m)) {
      push(m, 9, 15.99, "debit", "SOUNDWAVE MUSIC SUBSCRIPTION", "subscriptions");
    }

    // Discretionary spend — intentionally irregular amounts/days so the
    // detector correctly does NOT group these into commitments.
    push(m, 4, 120 + m * 3, "debit", "GROCERY STORE", "groceries");
    push(m, 11, 145 + m * 2, "debit", "SUPERMARKET", "groceries");
    push(m, 18, 160 - m * 2, "debit", "GROCERY STORE", "groceries");
    push(m, 25, 130 + m * 4, "debit", "FARMERS MARKET", "groceries");
    push(m, 7, 90 + m * 5, "debit", "RESTAURANT", "dining");
    push(m, 15, 150 - m * 3, "debit", "BISTRO", "dining");
    push(m, 22, 110 + m * 2, "debit", "COFFEE SHOP", "dining");
    push(m, 2, 28, "debit", "RIDESHARE", "transport");
    push(m, 9, 32, "debit", "RIDESHARE", "transport");
    push(m, 16, 25, "debit", "TOLL AND PARKING", "transport");
    push(m, 23, 40, "debit", "RIDESHARE", "transport");
    push(m, 13, 180 - m * 4, "debit", "ONLINE MARKETPLACE", "shopping");
    push(m, 27, 95 + m * 3, "debit", "ONLINE SHOPPING", "shopping");
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
      name: "Property Management Co — Rent",
      type: "rent",
      amount: 6500,
      currency: "$",
      cadenceDayOfMonth: 28,
      confidence: 0.97,
      status: "confirmed",
      sourceTransactionIds: idsFor("rent payment"),
      detectedAt: now,
    },
    {
      id: "commit_netflix",
      userId,
      name: "Netflix",
      type: "subscription",
      amount: 45,
      currency: "$",
      cadenceDayOfMonth: 5,
      confidence: 0.98,
      status: "confirmed",
      sourceTransactionIds: idsFor("netflix"),
      detectedAt: now,
    },
    {
      id: "commit_gym",
      userId,
      name: "Fitness Club Membership",
      type: "subscription",
      amount: 299,
      currency: "$",
      cadenceDayOfMonth: 6,
      confidence: 0.96,
      status: "confirmed",
      sourceTransactionIds: idsFor("fitness club"),
      detectedAt: now,
    },
    {
      id: "commit_spotify",
      userId,
      name: "Spotify",
      type: "subscription",
      amount: 19.99,
      currency: "$",
      cadenceDayOfMonth: 8,
      confidence: 0.98,
      status: "confirmed",
      sourceTransactionIds: idsFor("spotify"),
      detectedAt: now,
    },
    {
      id: "commit_mobile",
      userId,
      name: "Mobile Phone Bill",
      type: "other_recurring",
      amount: 350,
      currency: "$",
      cadenceDayOfMonth: 10,
      confidence: 0.93,
      status: "confirmed",
      sourceTransactionIds: idsFor("mobile phone"),
      detectedAt: now,
    },
    {
      id: "commit_soundwave",
      userId,
      name: "Soundwave Music",
      type: "subscription",
      amount: 15.99,
      currency: "$",
      cadenceDayOfMonth: 9,
      confidence: 0.74,
      status: "detected", // new pattern, only 3 occurrences — awaiting one-tap confirmation
      sourceTransactionIds: idsFor("soundwave"),
      detectedAt: now,
    },
    {
      id: "commit_house_goal",
      userId,
      name: 'Fund "House Down Payment"',
      type: "savings_goal",
      amount: 3200,
      currency: "$",
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
 * waterfall: the house-fund contribution, every month. This is what lets the
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
