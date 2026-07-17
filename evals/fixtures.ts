import type { UserBundle } from "../src/lib/repository/FinanceRepository";

/**
 * A fixed, hand-authored customer state the eval harness runs every
 * scenario against. Deliberately not read from Supabase — evals need to be
 * deterministic and fast, and the whole point of the getBundle indirection
 * in tools.ts is that this is the same code path production uses, just fed
 * fixture data instead of a live fetch.
 */
export const FIXTURE_BUNDLE: UserBundle = {
  accounts: [
    {
      id: "acc_current",
      userId: "eval_user",
      name: "Current Account",
      type: "current",
      currency: "$",
      balance: 20000,
      interestRatePct: 0,
      isLiquid: true,
    },
    {
      id: "acc_savings",
      userId: "eval_user",
      name: "Saving Space — Rainy Day",
      type: "savings_space",
      currency: "$",
      balance: 8000,
      interestRatePct: 6,
      isLiquid: true,
    },
  ],
  transactions: [],
  commitments: [
    {
      id: "commit_rent",
      userId: "eval_user",
      name: "Property Management Co",
      type: "rent",
      amount: 5000,
      currency: "$",
      cadenceDayOfMonth: 1,
      confidence: 0.95,
      status: "confirmed",
      sourceTransactionIds: [],
      detectedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "commit_remit",
      userId: "eval_user",
      name: "Wire Transfer Service",
      type: "remittance",
      amount: 2000,
      currency: "$",
      cadenceDayOfMonth: 5,
      confidence: 0.9,
      status: "confirmed",
      sourceTransactionIds: [],
      detectedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  goals: [],
  plan: {
    id: "plan_eval",
    userId: "eval_user",
    goals: [],
    waterfallOrder: [],
    safeToSpendFloor: 500,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
};
