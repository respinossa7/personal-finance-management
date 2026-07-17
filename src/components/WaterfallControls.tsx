"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WaterfallRun } from "@/domain";
import { Button } from "@/components/ui/Button";
import { Undo2, Zap } from "lucide-react";

interface LatestResponse {
  run: WaterfallRun | null;
  isUndoable?: boolean;
}

export function WaterfallControls() {
  const router = useRouter();
  const [latest, setLatest] = useState<LatestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshLatest() {
    const res = await fetch("/api/waterfall/latest");
    setLatest(await res.json());
  }

  useEffect(() => {
    let isActive = true;

    const loadLatest = async () => {
      try {
        const res = await fetch("/api/waterfall/latest");
        const data = await res.json();
        if (isActive) {
          setLatest(data);
        }
      } catch {
        if (isActive) {
          setLatest(null);
        }
      }
    };

    void loadLatest();

    return () => {
      isActive = false;
    };
  }, []);

  async function simulate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/waterfall/run", { method: "POST" });
      if (!res.ok) throw new Error("Simulation failed");
      await refreshLatest();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function undo() {
    if (!latest?.run) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/waterfall/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: latest.run.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Undo failed");
      await refreshLatest();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const run = latest?.run;

  return (
    <div className="flex flex-col gap-4">
      <Button fullWidth onClick={simulate} disabled={loading}>
        <Zap size={16} />
        {loading ? "Running waterfall..." : "Simulate salary landing today"}
      </Button>

      {error && <p className="text-xs text-danger">{error}</p>}

      {run && run.status === "executed" && (
        <div className="rounded-2xl border border-accent/25 bg-accent/[0.07] p-4">
          <p className="mb-2 text-sm font-medium text-text">
            Waterfall ran {new Date(run.executedAt).toLocaleString()}
          </p>
          <ul className="mb-3 flex flex-col gap-1.5">
            {run.moves.map((m, i) => (
              <li key={i} className="flex justify-between text-xs text-text-muted">
                <span>{m.step.label}</span>
                <span className="text-text">${m.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
          {latest?.isUndoable ? (
            <>
              <p className="mb-2 text-xs text-text-faint">
                Undoable until {new Date(run.undoDeadline).toLocaleString()}
              </p>
              <Button variant="secondary" fullWidth onClick={undo} disabled={loading}>
                <Undo2 size={15} />
                Undo this run
              </Button>
            </>
          ) : (
            <p className="text-xs text-text-faint">Undo window has closed.</p>
          )}
        </div>
      )}

      {run && run.status === "undone" && (
        <p className="rounded-2xl border border-border-subtle bg-surface-2 p-4 text-xs text-text-muted">
          Last salary-day simulation was undone — balances restored.
        </p>
      )}
    </div>
  );
}
