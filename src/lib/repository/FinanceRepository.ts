import { SupabaseClient } from "@supabase/supabase-js";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import {
  Account,
  Commitment,
  CommitmentStatus,
  Goal,
  Insight,
  Plan,
  Transaction,
  WaterfallRun,
} from "@/domain";
import {
  accountFromRow,
  accountToRow,
  commitmentFromRow,
  commitmentToRow,
  goalFromRow,
  insightToRow,
  planFromRow,
  transactionFromRow,
  transactionToRow,
  waterfallRunFromRow,
  waterfallRunToRow,
} from "@/lib/supabase/mappers";

export interface UserBundle {
  accounts: Account[];
  transactions: Transaction[];
  commitments: Commitment[];
  goals: Goal[];
  plan: Plan;
}

/**
 * The only class in the app that talks to Postgres. Every API route goes
 * through this repository rather than issuing raw Supabase calls inline —
 * keeps persistence concerns out of the domain layer and out of route
 * handlers, and gives us one place to change if the storage engine ever
 * changes.
 */
export class FinanceRepository {
  constructor(private readonly client: SupabaseClient = createServiceSupabaseClient()) {}

  async getUserBundle(userId: string): Promise<UserBundle> {
    const [accountsRes, transactionsRes, commitmentsRes, goalsRes, planRes] = await Promise.all([
      this.client.from("accounts").select("*").eq("user_id", userId),
      this.client.from("transactions").select("*").eq("user_id", userId),
      this.client.from("commitments").select("*").eq("user_id", userId),
      this.client.from("goals").select("*").eq("user_id", userId),
      this.client.from("plans").select("*").eq("user_id", userId).single(),
    ]);

    for (const res of [accountsRes, transactionsRes, commitmentsRes, goalsRes, planRes]) {
      if (res.error) throw res.error;
    }

    const goals = (goalsRes.data ?? []).map(goalFromRow);

    return {
      accounts: (accountsRes.data ?? []).map(accountFromRow),
      transactions: (transactionsRes.data ?? []).map(transactionFromRow),
      commitments: (commitmentsRes.data ?? []).map(commitmentFromRow),
      goals,
      plan: planFromRow(planRes.data, goals),
    };
  }

  async setCommitmentStatus(commitmentId: string, status: CommitmentStatus): Promise<void> {
    const { error } = await this.client.from("commitments").update({ status }).eq("id", commitmentId);
    if (error) throw error;
  }

  /** Inserts only commitments whose id isn't already present — used by the
   * "re-scan transactions" demo action so re-running CommitmentDetector never
   * clobbers a commitment a customer already confirmed or rejected. */
  async insertCommitmentsIfMissing(userId: string, commitments: Commitment[]): Promise<Commitment[]> {
    const { data: existing, error: existingErr } = await this.client
      .from("commitments")
      .select("id")
      .eq("user_id", userId);
    if (existingErr) throw existingErr;

    const existingIds = new Set((existing ?? []).map((r) => r.id as string));
    const fresh = commitments.filter((c) => !existingIds.has(c.id));
    if (fresh.length === 0) return [];

    const { error } = await this.client.from("commitments").insert(fresh.map((c) => commitmentToRow(c)));
    if (error) throw error;
    return fresh;
  }

  async insertTransactions(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) return;
    const { error } = await this.client
      .from("transactions")
      .insert(transactions.map((t) => transactionToRow(t)));
    if (error) throw error;
  }

  async upsertAccountBalances(accounts: Account[]): Promise<void> {
    const { error } = await this.client
      .from("accounts")
      .upsert(accounts.map((a) => accountToRow(a)));
    if (error) throw error;
  }

  async insertWaterfallRun(run: WaterfallRun): Promise<void> {
    const { error } = await this.client.from("waterfall_runs").insert(waterfallRunToRow(run));
    if (error) throw error;
  }

  async getWaterfallRun(id: string): Promise<WaterfallRun> {
    const { data, error } = await this.client.from("waterfall_runs").select("*").eq("id", id).single();
    if (error) throw error;
    return waterfallRunFromRow(data);
  }

  /** Full run history for a user — the audit trail the Progress Reflector
   * narrative (Insights Hub, Goal Progress) summarises into "what Autopilot
   * actually did." Real ledger facts, not a generated summary. */
  async getWaterfallRuns(userId: string): Promise<WaterfallRun[]> {
    const { data, error } = await this.client
      .from("waterfall_runs")
      .select("*")
      .eq("user_id", userId)
      .order("executed_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(waterfallRunFromRow);
  }

  async getLatestWaterfallRun(userId: string): Promise<WaterfallRun | null> {
    const { data, error } = await this.client
      .from("waterfall_runs")
      .select("*")
      .eq("user_id", userId)
      .order("executed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? waterfallRunFromRow(data) : null;
  }

  async setWaterfallRunStatus(id: string, status: WaterfallRun["status"]): Promise<void> {
    const { error } = await this.client.from("waterfall_runs").update({ status }).eq("id", id);
    if (error) throw error;
  }

  /** Insights are regenerated fresh on every read (InsightAgent is pure and
   * cheap) — only which ones a customer has dismissed is persisted. This
   * table exists purely to remember dismissal state, not insight content. */
  async getDismissedInsightIds(userId: string): Promise<Set<string>> {
    const { data, error } = await this.client
      .from("insights")
      .select("id")
      .eq("user_id", userId)
      .eq("dismissed", true);
    if (error) throw error;
    return new Set((data ?? []).map((r) => r.id as string));
  }

  async dismissInsight(userId: string, insight: Insight): Promise<void> {
    const { error } = await this.client
      .from("insights")
      .upsert(insightToRow({ ...insight, dismissed: true }));
    if (error) throw error;
  }

  async appendChatMessage(userId: string, role: "user" | "assistant", content: string): Promise<void> {
    const { error } = await this.client
      .from("plan_chat_messages")
      .insert({ user_id: userId, role, content });
    if (error) throw error;
  }

  async getChatHistory(userId: string): Promise<{ role: "user" | "assistant"; content: string }[]> {
    const { data, error } = await this.client
      .from("plan_chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async upsertGoal(goal: Goal): Promise<void> {
    const { error } = await this.client.from("goals").upsert({
      id: goal.id,
      user_id: goal.userId,
      name: goal.name,
      target_amount: goal.targetAmount,
      target_date: goal.targetDate,
      monthly_contribution: goal.monthlyContribution,
      funded_amount: goal.fundedAmount,
      linked_account_id: goal.linkedAccountId ?? null,
    });
    if (error) throw error;
  }
}
