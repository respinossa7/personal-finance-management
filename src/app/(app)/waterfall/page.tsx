import { redirect } from "next/navigation";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { WaterfallEngine } from "@/domain";
import { WaterfallControls } from "@/components/WaterfallControls";

export default async function WaterfallPage() {
  const userId = await getDemoUserId();
  if (!userId) redirect("/login");

  const { commitments, plan } = await new FinanceRepository().getUserBundle(userId);
  const confirmedCommitments = commitments.filter((c) => c.status === "confirmed");
  const steps = new WaterfallEngine().buildDefaultWaterfall(confirmedCommitments, plan);
  const total = steps.reduce((sum, s) => sum + s.amount, 0);

  return (
    <main className="flex flex-col gap-5 p-4">
      <div>
        <h1 className="text-lg font-semibold text-text">Salary Day</h1>
        <p className="mt-1 text-xs text-text-muted">
          The moment salary lands is the one moment of maximum agency. Saving
          and sending money home happen automatically, before spending can —
          by default, not by willpower. Every run is reversible for 24 hours.
        </p>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-faint">
          What happens, in order
        </p>
        <ol className="flex flex-col gap-2.5">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-surface-3 text-xs text-text-muted">
                {i + 1}
              </span>
              <span className="flex-1 text-text-muted">{step.label}</span>
              <span className="text-text">AED {step.amount.toLocaleString()}</span>
            </li>
          ))}
          <li className="flex items-center gap-3 text-sm">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent/20 text-xs text-accent">
              ✓
            </span>
            <span className="flex-1 text-text-muted">Rest released as safe-to-spend</span>
            <span className="text-accent">AED {total.toLocaleString()} moved</span>
          </li>
        </ol>
      </div>

      <WaterfallControls />
    </main>
  );
}
