import { NextRequest, NextResponse } from "next/server";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { Insight, InsightAction } from "@/domain";

/**
 * Executes the one action button attached to an insight. This is the
 * boundary the proposal's architecture rule is about: the Observer/Communicator
 * layer only ever *proposes* via an insight; this route is the explicit
 * customer tap that enacts it, and it only ever touches the deterministic
 * rules layer (account balances, commitment status) — never a model call.
 */
export async function POST(req: NextRequest) {
  const userId = await getDemoUserId();
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { insightId, action } = (await req.json()) as {
    insightId: string;
    action: InsightAction;
  };

  const repo = new FinanceRepository();

  if (action.kind === "cancel_subscription") {
    const commitmentId = action.payload.commitmentId as string;
    await repo.setCommitmentStatus(commitmentId, "rejected");
  }

  if (action.kind === "move_funds" && typeof action.payload.fromAccountId === "string") {
    const { accounts, goals } = await repo.getUserBundle(userId);
    const source = accounts.find((a) => a.id === action.payload.fromAccountId);
    const destination = accounts.find((a) => a.id === goals[0]?.linkedAccountId);
    if (source && destination && source.balance > 0) {
      const amount = source.balance;
      await repo.upsertAccountBalances([
        { ...source, balance: 0 },
        { ...destination, balance: destination.balance + amount },
      ]);
    }
  }

  // Mark resolved either way so it doesn't reappear on next dashboard load.
  const stub: Insight = {
    id: insightId,
    userId,
    type: "goal_on_track",
    message: "",
    action: null,
    createdAt: new Date().toISOString(),
    dismissed: true,
  };
  await repo.dismissInsight(userId, stub);

  return NextResponse.json({ ok: true });
}
