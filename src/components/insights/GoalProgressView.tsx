import clsx from "clsx";
import { Goal, GoalProjectionResult, GoalTradeoffResult } from "@/domain";
import { GoalRemedySwitcher } from "./GoalRemedySwitcher";

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function GoalProgressView({
  goal,
  fundedAmount,
  projection,
  catchUp,
  lowerTargetAmount,
  reflector,
}: {
  goal: Goal;
  fundedAmount: number;
  projection: GoalProjectionResult;
  catchUp: GoalTradeoffResult;
  lowerTargetAmount: number;
  reflector: { monthsCovered: number; totalTransfersSent: number; totalGoalFunded: number };
}) {
  const pct = Math.min(100, Math.round((fundedAmount / goal.targetAmount) * 100));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-sm font-medium text-text">{goal.name}</p>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[11px]",
              projection.onSchedule ? "bg-accent/15 text-accent" : "bg-warning/15 text-warning"
            )}
          >
            {projection.onSchedule ? "On schedule" : "Off schedule"}
          </span>
        </div>
        <p className="text-2xl font-semibold text-text">
          ${fundedAmount.toLocaleString()}{" "}
          <span className="text-sm font-normal text-text-muted">
            of {goal.targetAmount.toLocaleString()} · {pct}%
          </span>
        </p>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            className={clsx("h-full rounded-full", projection.onSchedule ? "bg-accent" : "bg-warning")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-text-faint">
          Target: {formatDateLabel(goal.targetDate)} · ${goal.monthlyContribution.toLocaleString()}/month
          committed
        </p>
      </div>

      {!projection.onSchedule && (
        <div className="rounded-2xl border border-warning/25 bg-warning/[0.07] p-4">
          <p className="mb-3 text-sm text-text">
            At the current pace, this lands around{" "}
            <span className="font-medium">{formatDateLabel(projection.projectedCompletionDate)}</span> —{" "}
            {Math.abs(projection.monthsAheadOrBehind)} months behind the{" "}
            {formatDateLabel(goal.targetDate)} target.
          </p>
          <GoalRemedySwitcher
            projectedDateLabel={formatDateLabel(projection.projectedCompletionDate)}
            monthsBehind={Math.abs(projection.monthsAheadOrBehind)}
            targetDateLabel={formatDateLabel(goal.targetDate)}
            monthlyContribution={goal.monthlyContribution}
            catchUpMonthly={catchUp.monthlyContributionRequired}
            lowerTargetAmount={lowerTargetAmount}
          />
        </div>
      )}

      <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
        <p className="mb-1 text-sm font-medium text-text">Your Quarter</p>
        <p className="text-sm leading-relaxed text-text-muted">
          Over the last {reflector.monthsCovered} months, Autopilot moved $
          {(reflector.totalTransfersSent + reflector.totalGoalFunded).toLocaleString()} on your
          behalf — ${reflector.totalTransfersSent.toLocaleString()} in recurring transfers and $
          {reflector.totalGoalFunded.toLocaleString()} into {goal.name}. Every run stayed inside
          your safe-to-spend floor; nothing was skipped.
        </p>
      </div>
    </div>
  );
}
