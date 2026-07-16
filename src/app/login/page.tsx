"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, History, ScanSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

const DEMO_FACTS = [
  { icon: History, label: "6 months of transaction history" },
  { icon: ScanSearch, label: "Recurring payments detected, not typed in" },
  { icon: Sparkles, label: "A live salary-day simulation" },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function enterDemo() {
    setLoading(true);
    await fetch("/api/auth/demo-login", { method: "POST" });
    router.push("/dashboard");
  }

  return (
    <main className="flex flex-1 flex-col justify-between p-6">
      <div className="mt-14 flex flex-col items-center text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/25">
          <span className="text-xl font-semibold text-white">W</span>
        </div>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-text">Wio Flow</h1>
        <p className="mt-3 max-w-[19rem] text-sm leading-relaxed text-text-muted">
          A personal finance system that runs your plan by default, and only
          interrupts you when there&apos;s a real decision to make.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border-subtle bg-surface-2 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
            Demo mode
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
            You&apos;ll enter as <span className="font-medium text-text">Sophia</span> — a UAE
            expat sending money home to Kerala every month, six years into an uncertain stay.
          </p>
          <div className="mt-3.5 flex flex-col gap-2 border-t border-border-subtle pt-3.5">
            {DEMO_FACTS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-xs text-text-muted">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-lavender text-primary">
                  <Icon size={12} />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>
        <Button fullWidth onClick={enterDemo} disabled={loading}>
          {loading ? "Entering..." : "Enter demo as Sophia"}
          {!loading && <ArrowRight size={16} />}
        </Button>
      </div>
    </main>
  );
}
