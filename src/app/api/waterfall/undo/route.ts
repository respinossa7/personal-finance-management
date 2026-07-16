import { NextRequest, NextResponse } from "next/server";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { WaterfallEngine } from "@/domain";

export async function POST(req: NextRequest) {
  const userId = await getDemoUserId();
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { runId } = (await req.json()) as { runId: string };
  const repo = new FinanceRepository();

  const run = await repo.getWaterfallRun(runId);
  const { accounts } = await repo.getUserBundle(userId);

  const engine = new WaterfallEngine();
  try {
    const restoredAccounts = engine.undo(run, accounts);
    await repo.upsertAccountBalances(restoredAccounts);
    await repo.setWaterfallRunStatus(runId, "undone");
    return NextResponse.json({ ok: true, restoredAccounts });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
