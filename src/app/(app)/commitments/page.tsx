import { redirect } from "next/navigation";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { CommitmentRow } from "@/components/CommitmentRow";
import { CommitmentBreakdown } from "@/components/CommitmentBreakdown";
import { ScanButton } from "@/components/ScanButton";
import { COMMITMENT_TYPE_META } from "@/lib/demo/commitmentDisplay";

export default async function CommitmentsPage() {
  const userId = await getDemoUserId();
  if (!userId) redirect("/login");

  const { commitments } = await new FinanceRepository().getUserBundle(userId);
  const pending = commitments.filter((c) => c.status === "detected");
  const confirmed = commitments
    .filter((c) => c.status === "confirmed")
    .sort((a, b) => a.cadenceDayOfMonth - b.cadenceDayOfMonth);
  const monthlyTotal = confirmed.reduce((sum, c) => sum + c.amount, 0);

  return (
    <main className="flex flex-col gap-5 p-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Recurring Payments</h1>
        <p className="mt-1 text-xs text-text-muted">
          Detected from your transaction history — same merchant, similar amount,
          same time of month. Nothing here was typed in.
        </p>
      </div>

      <ScanButton />

      {pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-faint">
            Needs your confirmation
          </p>
          {pending.map((c) => (
            <CommitmentRow key={c.id} commitment={c} />
          ))}
        </section>
      )}

      {confirmed.length > 0 && (
        <>
          <div className="flex items-baseline justify-between rounded-2xl border border-border-subtle bg-surface-2 px-4 py-3.5">
            <div>
              <p className="text-xs text-text-faint">Committed every month</p>
              <p className="mt-0.5 text-xl font-semibold text-text">
                AED {monthlyTotal.toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-text-faint">
              {confirmed.length} recurring payment{confirmed.length > 1 ? "s" : ""}
            </p>
          </div>

          <CommitmentBreakdown commitments={commitments} />

          <section className="flex flex-col gap-2">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-faint">
              By day of the month
            </p>
            {confirmed.map((c) => {
              const meta = COMMITMENT_TYPE_META[c.type];
              const Icon = meta.icon;
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-2 px-4 py-3"
                >
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surface-3"
                    style={{ color: meta.colorVar }}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text">{c.name}</p>
                    <p className="text-xs text-text-faint">
                      {meta.label} · Day {c.cadenceDayOfMonth}
                    </p>
                  </div>
                  <p className="flex-none text-sm font-medium text-text">
                    AED {c.amount.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}
