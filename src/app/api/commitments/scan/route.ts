import { NextResponse } from "next/server";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { CommitmentDetector } from "@/domain";

/**
 * Re-runs the rules-based CommitmentDetector over the customer's full
 * transaction history live. Proves the OOP domain class is actually wired
 * up, not just pre-seeded rows — re-scanning the same six months of history
 * should re-derive the same commitments the seed script inserted directly.
 */
export async function POST() {
  const userId = await getDemoUserId();
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const repo = new FinanceRepository();
  const { transactions } = await repo.getUserBundle(userId);

  const detected = new CommitmentDetector().detect(transactions);
  const inserted = await repo.insertCommitmentsIfMissing(userId, detected);

  return NextResponse.json({ scanned: transactions.length, detected: detected.length, inserted: inserted.length });
}
