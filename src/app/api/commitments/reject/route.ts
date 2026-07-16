import { NextRequest, NextResponse } from "next/server";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";

export async function POST(req: NextRequest) {
  const userId = await getDemoUserId();
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { commitmentId } = (await req.json()) as { commitmentId: string };
  await new FinanceRepository().setCommitmentStatus(commitmentId, "rejected");
  return NextResponse.json({ ok: true });
}
