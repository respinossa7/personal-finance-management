"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Remedy = "stretch" | "catchup" | "lower";

const OPTIONS: { key: Remedy; label: string }[] = [
  { key: "catchup", label: "Catch up now" },
  { key: "stretch", label: "Stretch the date" },
  { key: "lower", label: "Lower the target" },
];

export function GoalRemedySwitcher({
  projectedDateLabel,
  monthsBehind,
  targetDateLabel,
  monthlyContribution,
  catchUpMonthly,
  lowerTargetAmount,
}: {
  projectedDateLabel: string;
  monthsBehind: number;
  targetDateLabel: string;
  monthlyContribution: number;
  catchUpMonthly: number;
  lowerTargetAmount: number;
}) {
  const [selected, setSelected] = useState<Remedy>("stretch");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        {OPTIONS.map((o) => (
          <Button
            key={o.key}
            variant={selected === o.key ? "primary" : "secondary"}
            onClick={() => setSelected(o.key)}
            className="flex-1 !px-2 text-xs"
          >
            {o.label}
          </Button>
        ))}
      </div>

      <div className="rounded-xl bg-surface-3/60 px-3 py-3 text-sm leading-relaxed text-text-muted">
        {selected === "stretch" && (
          <>
            At AED {monthlyContribution.toLocaleString()}/month, you&apos;ll reach this goal
            around <span className="text-text">{projectedDateLabel}</span> —{" "}
            {monthsBehind} months later than your {targetDateLabel} target. Nothing changes; the
            waterfall keeps running as-is.
          </>
        )}
        {selected === "catchup" && (
          <>
            Hitting {targetDateLabel} means raising your contribution to{" "}
            <span className="text-text">AED {catchUpMonthly.toLocaleString()}/month</span> — about
            AED {Math.max(0, Math.round(catchUpMonthly - monthlyContribution)).toLocaleString()}{" "}
            more than today. This would be shown against your runway before you confirm it.
          </>
        )}
        {selected === "lower" && (
          <>
            Keeping AED {monthlyContribution.toLocaleString()}/month and hitting{" "}
            {targetDateLabel} means resetting the target to{" "}
            <span className="text-text">AED {lowerTargetAmount.toLocaleString()}</span> instead.
          </>
        )}
      </div>
    </div>
  );
}
