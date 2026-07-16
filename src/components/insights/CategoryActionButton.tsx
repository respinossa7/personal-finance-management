"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CategoryActionButton({
  amount,
  goalName,
}: {
  amount: number;
  goalName: string;
}) {
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="text-xs text-accent">✓ AED {amount} moved to {goalName}</p>;
  }

  return (
    <Button variant="secondary" onClick={() => setDone(true)} className="!px-3 !py-1.5 text-xs">
      Move AED {amount} to {goalName}
    </Button>
  );
}
