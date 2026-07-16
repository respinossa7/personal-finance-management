"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ScanButton() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function scan() {
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch("/api/commitments/scan", { method: "POST" });
      const data = await res.json();
      setResult(
        `Scanned ${data.scanned} transactions, ${data.inserted} new recurring payment${data.inserted === 1 ? "" : "s"} found`
      );
      router.refresh();
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" onClick={scan} disabled={scanning}>
        <ScanSearch size={15} />
        {scanning ? "Scanning transaction history..." : "Re-scan transactions"}
      </Button>
      {result && <p className="px-1 text-xs text-text-faint">{result}</p>}
    </div>
  );
}
