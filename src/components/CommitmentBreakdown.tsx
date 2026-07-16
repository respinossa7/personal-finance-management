import { Commitment, CommitmentType } from "@/domain";
import { COMMITMENT_TYPE_META, COMMITMENT_TYPE_ORDER } from "@/lib/demo/commitmentDisplay";

export function CommitmentBreakdown({ commitments }: { commitments: Commitment[] }) {
  const confirmed = commitments.filter((c) => c.status === "confirmed");
  const totals = new Map<CommitmentType, number>();
  for (const c of confirmed) {
    totals.set(c.type, (totals.get(c.type) ?? 0) + c.amount);
  }

  const rows = COMMITMENT_TYPE_ORDER.map((type) => ({
    type,
    ...COMMITMENT_TYPE_META[type],
    amount: totals.get(type) ?? 0,
  })).filter((r) => r.amount > 0);

  const maxAmount = Math.max(...rows.map((r) => r.amount), 1);
  const grandTotal = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-sm font-medium text-text">Where your recurring payments go</p>
        <p className="text-xs text-text-faint">AED {grandTotal.toLocaleString()}/mo</p>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.type}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-text-muted">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: r.colorVar }}
                />
                {r.label}
              </span>
              <span className="text-text-faint">AED {r.amount.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(r.amount / maxAmount) * 100}%`,
                  backgroundColor: r.colorVar,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
