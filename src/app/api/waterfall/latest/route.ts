import { NextResponse } from "next/server";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { WaterfallEngine } from "@/domain";

export async function GET() {
  const userId = await getDemoUserId();
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const run = await new FinanceRepository().getLatestWaterfallRun(userId);
  if (!run) return NextResponse.json({ run: null });

  const isUndoable = new WaterfallEngine().isUndoable(run);
  return NextResponse.json({ run, isUndoable });
}
