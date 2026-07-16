"use client";

import { ReactNode, useState } from "react";
import clsx from "clsx";
import { CalendarDays, Target, Users, Flag } from "lucide-react";

type TabKey = "month" | "threshold" | "peers" | "goals";

const TABS: { key: TabKey; label: string; icon: typeof CalendarDays }[] = [
  { key: "month", label: "This Month", icon: CalendarDays },
  { key: "threshold", label: "Threshold", icon: Target },
  { key: "peers", label: "Peer Lens", icon: Users },
  { key: "goals", label: "Goals", icon: Flag },
];

export function InsightsHubTabs({
  month,
  threshold,
  peers,
  goals,
}: {
  month: ReactNode;
  threshold: ReactNode;
  peers: ReactNode;
  goals: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("month");
  const content: Record<TabKey, ReactNode> = { month, threshold, peers, goals };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border-subtle bg-surface-2 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={clsx(
              "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-xs font-medium transition-colors",
              active === key ? "bg-lavender text-primary" : "text-text-faint hover:text-text-muted"
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {content[active]}
    </div>
  );
}
