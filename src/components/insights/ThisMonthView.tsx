import clsx from "clsx";
import { ThisMonthSnapshot } from "@/lib/demo/intelligence";
import { CategoryActionButton } from "./CategoryActionButton";

const CATEGORY_COLOR: Record<string, string> = {
  dining: "var(--color-cat-1)",
  groceries: "var(--color-cat-2)",
  transport: "var(--color-cat-3)",
  subscriptions: "var(--color-cat-4)",
  shopping: "var(--color-cat-5)",
};

function paceDelta(snapshot: ThisMonthSnapshot): { delta: number; ahead: boolean } {
  const delta = snapshot.totalSoFar - snapshot.typicalPaceSoFar;
  return { delta: Math.abs(Math.round(delta)), ahead: delta >= 0 };
}

export function ThisMonthView({
  snapshot,
  goalName,
}: {
  snapshot: ThisMonthSnapshot;
  goalName: string;
}) {
  const { delta, ahead } = paceDelta(snapshot);
  const hot = snapshot.hottestCategory;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-text-faint">
          Day {snapshot.dayOfMonth} of {snapshot.daysInMonth}
        </p>
        <p className="mt-1 text-2xl font-semibold text-text">
          AED {snapshot.totalSoFar.toLocaleString()}{" "}
          <span className="text-sm font-normal text-text-muted">spent so far</span>
        </p>
        <p
          className={clsx(
            "mt-1 text-xs",
            ahead ? "text-warning" : "text-accent"
          )}
        >
          {delta === 0
            ? "Right on your usual pace"
            : `About AED ${delta.toLocaleString()} ${ahead ? "ahead of" : "behind"} your usual pace`}
        </p>

        <div className="mt-4 rounded-xl bg-surface-3/60 px-3 py-2.5">
          <p className="text-[11px] text-text-faint">Projected month-end total</p>
          <p className="text-sm text-text">
            AED {snapshot.projection.low.toLocaleString()} – AED{" "}
            {snapshot.projection.high.toLocaleString()}{" "}
            <span className="text-text-faint">
              (expected ~AED {snapshot.projection.expected.toLocaleString()})
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
        <p className="mb-3 text-sm font-medium text-text">This month vs. your 6-month norm</p>
        <div className="flex flex-col gap-3.5">
          {snapshot.categories.map((c) => (
            <div key={c.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-text-muted">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLOR[c.key] }}
                  />
                  {c.label}
                </span>
                <span
                  className={clsx(
                    c.deviationPct > 15
                      ? "text-warning"
                      : c.deviationPct < -15
                        ? "text-accent"
                        : "text-text-faint"
                  )}
                >
                  {c.deviationPct > 0 ? "+" : ""}
                  {c.deviationPct}% vs. usual
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (c.thisMonthSoFar / Math.max(c.sixMonthNorm, 1)) * 100)}%`,
                    backgroundColor: CATEGORY_COLOR[c.key],
                  }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-text-faint">
                <span>AED {c.thisMonthSoFar.toLocaleString()} so far</span>
                <span>usual: AED {c.sixMonthNorm.toLocaleString()}/mo</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {hot.deviationPct > 15 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-warning/25 bg-warning/[0.07] p-4">
          <p className="text-sm text-text">
            {hot.label} is {hot.deviationPct}% above your usual pace — AED{" "}
            {Math.round(hot.thisMonthSoFar - (hot.sixMonthNorm * snapshot.dayOfMonth) / snapshot.daysInMonth)} over.
          </p>
          <CategoryActionButton amount={200} goalName={goalName} />
        </div>
      )}
    </div>
  );
}
