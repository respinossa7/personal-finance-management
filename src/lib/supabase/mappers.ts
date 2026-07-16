import {
  Account,
  Commitment,
  Goal,
  Insight,
  Plan,
  Transaction,
  WaterfallRun,
} from "@/domain";

/** snake_case <-> camelCase mapping between Postgres rows and domain
 * objects. Kept in one file so the domain layer never has to know Supabase
 * exists, and the API/seed layer never hand-rolls field names twice. */

export function accountFromRow(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    type: row.type as Account["type"],
    currency: row.currency as string,
    balance: Number(row.balance),
    interestRatePct: Number(row.interest_rate_pct),
    isLiquid: row.is_liquid as boolean,
  };
}

export function accountToRow(a: Partial<Account> & { userId: string }) {
  return {
    ...(a.id ? { id: a.id } : {}),
    user_id: a.userId,
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    interest_rate_pct: a.interestRatePct,
    is_liquid: a.isLiquid,
  };
}

export function transactionFromRow(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    accountId: row.account_id as string,
    postedAt: row.posted_at as string,
    amount: Number(row.amount),
    direction: row.direction as Transaction["direction"],
    merchantRaw: row.merchant_raw as string,
    category: row.category as string,
    description: (row.description as string) ?? undefined,
  };
}

export function transactionToRow(t: Transaction) {
  return {
    id: t.id,
    user_id: t.userId,
    account_id: t.accountId,
    posted_at: t.postedAt,
    amount: t.amount,
    direction: t.direction,
    merchant_raw: t.merchantRaw,
    category: t.category,
    description: t.description ?? null,
  };
}

export function commitmentFromRow(row: Record<string, unknown>): Commitment {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    type: row.type as Commitment["type"],
    amount: Number(row.amount),
    currency: row.currency as string,
    cadenceDayOfMonth: Number(row.cadence_day_of_month),
    confidence: Number(row.confidence),
    status: row.status as Commitment["status"],
    sourceTransactionIds: (row.source_transaction_ids as string[]) ?? [],
    detectedAt: row.detected_at as string,
  };
}

export function commitmentToRow(c: Commitment) {
  return {
    id: c.id,
    user_id: c.userId,
    name: c.name,
    type: c.type,
    amount: c.amount,
    currency: c.currency,
    cadence_day_of_month: c.cadenceDayOfMonth,
    confidence: c.confidence,
    status: c.status,
    source_transaction_ids: c.sourceTransactionIds,
    detected_at: c.detectedAt,
  };
}

export function goalFromRow(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    targetAmount: Number(row.target_amount),
    targetDate: row.target_date as string,
    monthlyContribution: Number(row.monthly_contribution),
    fundedAmount: Number(row.funded_amount),
    linkedAccountId: (row.linked_account_id as string) ?? undefined,
  };
}

export function goalToRow(g: Goal) {
  return {
    ...(g.id ? { id: g.id } : {}),
    user_id: g.userId,
    name: g.name,
    target_amount: g.targetAmount,
    target_date: g.targetDate,
    monthly_contribution: g.monthlyContribution,
    funded_amount: g.fundedAmount,
    linked_account_id: g.linkedAccountId ?? null,
  };
}

export function planFromRow(row: Record<string, unknown>, goals: Goal[]): Plan {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    goals,
    waterfallOrder: (row.waterfall_order as Plan["waterfallOrder"]) ?? [],
    safeToSpendFloor: Number(row.safe_to_spend_floor),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function waterfallRunFromRow(row: Record<string, unknown>): WaterfallRun {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    triggeredBy: row.triggered_by as WaterfallRun["triggeredBy"],
    moves: row.moves as WaterfallRun["moves"],
    balancesBefore: row.balances_before as Record<string, number>,
    status: row.status as WaterfallRun["status"],
    executedAt: row.executed_at as string,
    undoDeadline: row.undo_deadline as string,
  };
}

export function waterfallRunToRow(w: WaterfallRun) {
  return {
    id: w.id,
    user_id: w.userId,
    triggered_by: w.triggeredBy,
    moves: w.moves,
    balances_before: w.balancesBefore,
    status: w.status,
    executed_at: w.executedAt,
    undo_deadline: w.undoDeadline,
  };
}

export function insightFromRow(row: Record<string, unknown>): Insight {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as Insight["type"],
    message: row.message as string,
    action: (row.action as Insight["action"]) ?? null,
    createdAt: row.created_at as string,
    dismissed: row.dismissed as boolean,
  };
}

export function insightToRow(i: Insight) {
  return {
    id: i.id,
    user_id: i.userId,
    type: i.type,
    message: i.message,
    action: i.action,
    created_at: i.createdAt,
    dismissed: i.dismissed,
  };
}
