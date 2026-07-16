"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Insight } from "@/domain";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, TrendingDown, WalletCards } from "lucide-react";

const ICONS: Record<Insight["type"], typeof AlertTriangle> = {
  runway_drop: AlertTriangle,
  remittance_cost_creep: TrendingDown,
  idle_cash: WalletCards,
  goal_on_track: WalletCards,
  goal_at_risk: AlertTriangle,
};

export function InsightCard({ insight }: { insight: Insight }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [resolved, setResolved] = useState(false);
  const Icon = ICONS[insight.type] ?? AlertTriangle;

  async function runAction() {
    if (!insight.action) return;
    if (insight.action.kind === "open_plan") {
      router.push("/plan");
      return;
    }
    setPending(true);
    try {
      await fetch("/api/insights/act", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId: insight.id, action: insight.action }),
      });
      setResolved(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function dismiss() {
    setPending(true);
    try {
      await fetch("/api/insights/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insightId: insight.id }),
      });
      setResolved(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (resolved) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-surface-2 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface-3 text-text-muted">
          <Icon size={16} />
        </div>
        <p className="text-sm leading-relaxed text-text">{insight.message}</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={dismiss} disabled={pending}>
          Dismiss
        </Button>
        {insight.action && (
          <Button variant="secondary" onClick={runAction} disabled={pending}>
            {insight.action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
