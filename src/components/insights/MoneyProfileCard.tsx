"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { MONEY_PROFILE, SEGMENT_MEMBERSHIP } from "@/lib/demo/intelligence";

const SEGMENT_BAR_COLOR = ["var(--color-cat-2)", "var(--color-cat-1)", "var(--color-cat-3)"];

export function MoneyProfileCard() {
  const [noted, setNoted] = useState<Set<string>>(new Set());

  function toggleNoted(id: string) {
    setNoted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-faint">Money Profile</p>
      <p className="mt-1.5 text-sm leading-relaxed text-text">{MONEY_PROFILE.headline}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {MONEY_PROFILE.traits.map((trait) => {
          const isNoted = noted.has(trait.id);
          return (
            <button
              key={trait.id}
              onClick={() => toggleNoted(trait.id)}
              title={trait.evidence}
              className={clsx(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                isNoted
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border-subtle bg-surface-3 text-text-muted hover:text-text"
              )}
            >
              {isNoted && <Check size={11} />}
              {isNoted ? "Noted — thanks" : trait.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] text-text-faint">Your segment</p>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-3">
          {SEGMENT_MEMBERSHIP.map((s, i) => (
            <div
              key={s.name}
              style={{ width: `${s.membershipPct}%`, backgroundColor: SEGMENT_BAR_COLOR[i] }}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {SEGMENT_MEMBERSHIP.map((s, i) => (
            <span key={s.name} className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: SEGMENT_BAR_COLOR[i] }}
              />
              {s.name} · {s.membershipPct}%
            </span>
          ))}
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-text-faint">
        Tap a trait to correct it — never affects your rate or eligibility.
      </p>
    </div>
  );
}
