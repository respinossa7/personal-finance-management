"use client";

import { useState } from "react";
import clsx from "clsx";
import { ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PEER_LENS, SectorComparison } from "@/lib/demo/intelligence";

const BAND_STYLE: Record<SectorComparison["band"], string> = {
  typical: "text-text-muted",
  elevated: "text-warning",
  "top-15": "text-warning",
};

export function PeerLens({ savingsRatePct }: { savingsRatePct: number }) {
  const [optedIn, setOptedIn] = useState(false);
  const [howExpanded, setHowExpanded] = useState(false);
  const { peerLow, peerHigh } = PEER_LENS.savingsBenchmark;

  if (!optedIn) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border-subtle bg-surface-2 p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-3 text-text-muted">
            <Users size={18} />
          </div>
          <p className="text-sm text-text">
            See how your spending and saving compare to customers with a similar profile —
            similar income, similar spending pattern, similar household setup.
          </p>
          <p className="text-xs text-text-faint">
            Opt-in, both directions: seeing your cohort means contributing your aggregated data
            to it, computed over {PEER_LENS.cohortSize.toLocaleString()}+ customers. Revocable
            any time.
          </p>
          <Button onClick={() => setOptedIn(true)} className="mt-1">
            Turn on peer comparisons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-text">Sector comparison</p>
          <button
            onClick={() => setOptedIn(false)}
            className="text-[11px] text-text-faint underline underline-offset-2 hover:text-text-muted"
          >
            Turn off
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {PEER_LENS.sectorComparisons.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-sm">
              <span className="text-text-muted">{s.label}</span>
              <span className={clsx("text-xs", BAND_STYLE[s.band])}>{s.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
        <p className="mb-1 text-sm font-medium text-text">Savings benchmark</p>
        <p className="text-sm leading-relaxed text-text-muted">
          You save <span className="text-text">{savingsRatePct}%</span> of income — customers
          with a similar profile typically save{" "}
          <span className="text-text">
            {peerLow}–{peerHigh}%
          </span>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
        <p className="mb-1 text-sm font-medium text-text">Investment context</p>
        <p className="text-sm leading-relaxed text-text-muted">
          Among customers with a profile like yours, the most commonly held assets are{" "}
          {PEER_LENS.investmentContext.commonAssets.join(" and ")}.
        </p>
        <p className="mt-2 text-[11px] text-text-faint">
          Aggregate information only — not a recommendation, and gated behind a suitability
          check before anything here can be linked to an action.
        </p>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
        <button
          onClick={() => setHowExpanded((v) => !v)}
          className="flex w-full items-center gap-2 text-left text-xs text-text-faint"
        >
          <ShieldCheck size={14} />
          How comparisons work {howExpanded ? "▲" : "▼"}
        </button>
        {howExpanded && (
          <p className="mt-3 text-xs leading-relaxed text-text-faint">
            Every comparison is computed against a distribution, never against another
            individual — no customer&apos;s data is ever visible to another. Cohorts are audited
            so they never decode to nationality or other sensitive attributes: &ldquo;people like
            you&rdquo; means similar income and commitment pattern, never your country. None of
            this ever touches your rate, credit, or eligibility.
          </p>
        )}
      </div>
    </div>
  );
}
