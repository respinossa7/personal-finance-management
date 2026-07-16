import clsx from "clsx";
import { CheckCircle2 } from "lucide-react";
import { ThresholdSnapshot } from "@/lib/demo/intelligence";

export function ThresholdTrackerCard({ snapshot }: { snapshot: ThresholdSnapshot }) {
  const pct = Math.min(100, (snapshot.spent / snapshot.target) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
            Top savings rate condition
          </p>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[11px]",
              snapshot.overshoot
                ? "bg-accent/15 text-accent"
                : snapshot.onPace
                  ? "bg-accent/15 text-accent"
                  : "bg-warning/15 text-warning"
            )}
          >
            {snapshot.overshoot ? "Condition met" : snapshot.onPace ? "On pace" : "Behind pace"}
          </span>
        </div>

        <p className="text-2xl font-semibold text-text">
          AED {snapshot.spent.toLocaleString()}{" "}
          <span className="text-sm font-normal text-text-muted">
            of AED {snapshot.target.toLocaleString()}
          </span>
        </p>
        <p className="mt-1 text-xs text-text-faint">{snapshot.daysLeft} days left this cycle</p>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            className={clsx(
              "h-full rounded-full",
              snapshot.overshoot ? "bg-accent" : "bg-primary"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {snapshot.overshoot ? (
        <div className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/[0.07] p-4">
          <CheckCircle2 size={18} className="mt-0.5 flex-none text-accent" />
          <p className="text-sm text-text">{snapshot.routingMessage}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
          <p className="mb-1 text-sm font-medium text-text">Planned-spend routing</p>
          <p className="text-sm leading-relaxed text-text-muted">{snapshot.routingMessage}</p>
        </div>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-text-faint">
        This tracker only routes spending you already had planned — it never suggests spending
        more than you would anyway. Once the condition is met for the cycle, it stops and stays
        quiet: no streaks, no &ldquo;keep going.&rdquo;
      </p>
    </div>
  );
}
