import { RunwaySnapshot } from "@/domain";
import { ThresholdSnapshot } from "@/lib/demo/intelligence";
import clsx from "clsx";

function runwayColor(months: number): string {
  if (!Number.isFinite(months)) return "text-accent";
  if (months < 3) return "text-danger";
  if (months < 4) return "text-warning";
  return "text-accent";
}

export function RunwayHero({
  runway,
  threshold,
}: {
  runway: RunwaySnapshot;
  threshold: ThresholdSnapshot;
}) {
  const pct = Math.min(100, Math.round((threshold.spent / threshold.target) * 100));

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-2 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
        Safe to spend today
      </p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[2.5rem] font-semibold leading-none tracking-tight text-text">
          ${runway.safeToSpendToday.toLocaleString()}
        </span>
        <span className="text-sm text-text-muted">/day</span>
      </div>
      <p className="mt-2 text-xs text-text-faint">
        {runway.daysRemainingInMonth} days left this month, after rent, remittance,
        subscriptions and your savings plan
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-3 px-3.5 py-3">
          <p className="text-[11px] text-text-faint">Months of runway</p>
          <p className={clsx("mt-0.5 text-xl font-semibold", runwayColor(runway.runwayMonths))}>
            {Number.isFinite(runway.runwayMonths) ? runway.runwayMonths : "∞"}{" "}
            <span className="text-xs font-normal text-text-muted">months</span>
          </p>
        </div>
        <div className="rounded-xl bg-surface-3 px-3.5 py-3">
          <p className="text-[11px] text-text-faint">Liquid assets</p>
          <p className="mt-0.5 text-xl font-semibold text-text">
            ${runway.liquidAssets.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-surface-3 px-3.5 py-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-text-faint">Spent toward your top rate</p>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              threshold.overshoot || threshold.onPace
                ? "bg-accent/10 text-accent"
                : "bg-warning/10 text-warning"
            )}
          >
            {threshold.overshoot ? "Met" : threshold.onPace ? "On pace" : "Behind pace"}
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <p className="text-sm font-medium text-text">
            ${threshold.spent.toLocaleString()}{" "}
            <span className="font-normal text-text-faint">
              of {threshold.target.toLocaleString()}
            </span>
          </p>
          <p className="text-[11px] text-text-faint">{threshold.daysLeft} days left</p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
          <div
            className={clsx("h-full rounded-full", threshold.overshoot ? "bg-accent" : "bg-primary")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
