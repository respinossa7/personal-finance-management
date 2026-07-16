"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Droplets, MessageCircle, Sparkles } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { href: "/dashboard", label: "Runway", icon: Home },
  { href: "/commitments", label: "Recurring", icon: ListChecks },
  { href: "/waterfall", label: "Salary Day", icon: Droplets },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/plan", label: "Plan", icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border-subtle bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <ul className="flex items-center justify-between">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] transition-colors",
                  active ? "bg-lavender text-primary" : "text-text-faint hover:text-text-muted"
                )}
              >
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
