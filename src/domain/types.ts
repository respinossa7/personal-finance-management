/**
 * Domain types for Wio Flow.
 * Mirrors the Supabase schema in supabase/migrations/0001_init.sql.
 * Kept framework-agnostic so the domain layer never imports Next.js or Supabase types.
 */

export type AccountType = "current" | "savings_space" | "invest" | "external";

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  interestRatePct: number;
  isLiquid: boolean;
}

export type TransactionDirection = "credit" | "debit";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  postedAt: string; // ISO date
  amount: number; // always positive; direction carries sign meaning
  direction: TransactionDirection;
  merchantRaw: string; // untrusted, attacker-controlled free text
  category: string;
  description?: string;
}

export type CommitmentType =
  | "rent"
  | "remittance"
  | "subscription"
  | "school_fees"
  | "savings_goal"
  | "other_recurring";

export type CommitmentStatus = "detected" | "confirmed" | "rejected" | "muted";

export interface Commitment {
  id: string;
  userId: string;
  name: string;
  type: CommitmentType;
  amount: number;
  currency: string;
  cadenceDayOfMonth: number; // 1-31, approximate
  confidence: number; // 0-1
  status: CommitmentStatus;
  sourceTransactionIds: string[];
  detectedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  targetDate: string; // ISO date
  monthlyContribution: number;
  fundedAmount: number;
  linkedAccountId?: string;
}

export interface Plan {
  id: string;
  userId: string;
  goals: Goal[];
  waterfallOrder: WaterfallStepConfig[];
  safeToSpendFloor: number;
  createdAt: string;
  updatedAt: string;
}

export type WaterfallStepType = "remittance" | "goal_contribution" | "sweep" | "safe_to_spend_release";

export interface WaterfallStepConfig {
  type: WaterfallStepType;
  refId?: string; // commitment id or goal id
  amount: number;
  destinationAccountId?: string;
  label: string;
}

export interface WaterfallMove {
  step: WaterfallStepConfig;
  fromAccountId: string;
  toAccountId?: string;
  amount: number;
  executedAt: string;
}

export type WaterfallRunStatus = "executed" | "undone";

export interface WaterfallRun {
  id: string;
  userId: string;
  triggeredBy: "salary_day_simulation" | "manual";
  moves: WaterfallMove[];
  balancesBefore: Record<string, number>; // accountId -> balance snapshot
  status: WaterfallRunStatus;
  executedAt: string;
  undoDeadline: string; // executedAt + 24h
}

export type InsightType =
  | "runway_drop"
  | "remittance_cost_creep"
  | "idle_cash"
  | "goal_on_track"
  | "goal_at_risk";

export interface InsightAction {
  label: string;
  kind: "confirm_commitment" | "cancel_subscription" | "move_funds" | "open_plan";
  payload: Record<string, unknown>;
}

export interface Insight {
  id: string;
  userId: string;
  type: InsightType;
  message: string;
  action: InsightAction | null;
  createdAt: string;
  dismissed: boolean;
}

export interface RunwaySnapshot {
  safeToSpendToday: number;
  daysRemainingInMonth: number;
  runwayMonths: number;
  liquidAssets: number;
  committedMonthlyOutflow: number;
  asOf: string;
}

export interface DemoUser {
  id: string;
  name: string;
  persona: "remittance_anchor";
  email: string;
}
