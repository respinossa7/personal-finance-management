import { NextRequest, NextResponse } from "next/server";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { Insight } from "@/domain";

export async function POST(req: NextRequest) {
  const userId = await getDemoUserId();
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { insightId } = (await req.json()) as { insightId: string };
  const stub: Insight = {
    id: insightId,
    userId,
    type: "goal_on_track",
    message: "",
    action: null,
    createdAt: new Date().toISOString(),
    dismissed: true,
  };

  await new FinanceRepository().dismissInsight(userId, stub);
  return NextResponse.json({ ok: true });
}
