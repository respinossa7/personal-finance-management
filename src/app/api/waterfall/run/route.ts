import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { WaterfallEngine } from "@/domain";
import { Transaction } from "@/domain";

const SIMULATED_SALARY_AMOUNT = 19500;

/**
 * Simulates a salary landing "today" and fires the waterfall: remittance
 * out, goals funded, and only then is the remainder released as
 * safe-to-spend. This is explicitly a *simulated* trigger for demo
 * purposes — not gated to a real calendar day — so it can be walked through
 * live. The move itself is 100% deterministic (WaterfallEngine); no model
 * call sits anywhere in this path.
 */
export async function POST() {
  const userId = await getDemoUserId();
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const repo = new FinanceRepository();
  const { accounts, commitments, plan } = await repo.getUserBundle(userId);

  const currentAccount = accounts.find((a) => a.type === "current");
  if (!currentAccount) {
    return NextResponse.json({ error: "no current account" }, { status: 400 });
  }

  const salaryTx: Transaction = {
    id: randomUUID(),
    userId,
    accountId: currentAccount.id,
    postedAt: new Date().toISOString(),
    amount: SIMULATED_SALARY_AMOUNT,
    direction: "credit",
    merchantRaw: "SALARY - TECHCORP FZ LLC (simulated)",
    category: "income",
  };

  const accountsWithSalary = accounts.map((a) =>
    a.id === currentAccount.id ? { ...a, balance: a.balance + SIMULATED_SALARY_AMOUNT } : a
  );

  const engine = new WaterfallEngine();
  const confirmedCommitments = commitments.filter((c) => c.status === "confirmed");
  const steps = engine.buildDefaultWaterfall(confirmedCommitments, plan);

  const { updatedAccounts, waterfallRun: rawRun } = engine.run(
    userId,
    accountsWithSalary,
    steps,
    plan.safeToSpendFloor
  );

  // Undo must revert the whole simulated event — the salary credit AND the
  // waterfall moves — so the snapshot is taken from before the credit, not
  // after (which is what the engine sees, since crediting salary is this
  // route's orchestration concern, not the engine's).
  const balancesBeforeSalary: Record<string, number> = {};
  for (const a of accounts) balancesBeforeSalary[a.id] = a.balance;
  const waterfallRun = { ...rawRun, balancesBefore: balancesBeforeSalary };

  const moveTransactions: Transaction[] = waterfallRun.moves.map((move) => ({
    id: randomUUID(),
    userId,
    accountId: move.fromAccountId,
    postedAt: move.executedAt,
    amount: move.amount,
    direction: "debit",
    merchantRaw: move.step.label,
    category: "waterfall",
  }));

  await repo.insertTransactions([salaryTx, ...moveTransactions]);
  await repo.upsertAccountBalances(updatedAccounts);
  await repo.insertWaterfallRun(waterfallRun);

  return NextResponse.json({ waterfallRun, updatedAccounts });
}
