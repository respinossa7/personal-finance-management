"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Commitment } from "@/domain";
import { Button } from "@/components/ui/Button";
import { COMMITMENT_TYPE_META } from "@/lib/demo/commitmentDisplay";

export function CommitmentRow({ commitment }: { commitment: Commitment }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [hidden, setHidden] = useState(false);
  const meta = COMMITMENT_TYPE_META[commitment.type];
  const Icon = meta.icon;

  async function respond(action: "confirm" | "reject") {
    setPending(true);
    try {
      await fetch(`/api/commitments/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitmentId: commitment.id }),
      });
      setHidden(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (hidden) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-lavender p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-surface-2"
            style={{ color: meta.colorVar }}
          >
            <Icon size={15} />
          </span>
          <div>
            <p className="text-sm font-medium text-text">{commitment.name}</p>
            <p className="mt-0.5 text-xs text-text-faint">
              {meta.label} · Day {commitment.cadenceDayOfMonth} ·{" "}
              {Math.round(commitment.confidence * 100)}% confidence
            </p>
          </div>
        </div>
        <p className="flex-none text-sm font-medium text-text">
          ${commitment.amount.toLocaleString()}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" disabled={pending} onClick={() => respond("reject")}>
          Not mine
        </Button>
        <Button variant="primary" disabled={pending} onClick={() => respond("confirm")}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
