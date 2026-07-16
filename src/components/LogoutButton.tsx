"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function exitDemo() {
    await fetch("/api/auth/demo-login", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <button
      onClick={exitDemo}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-faint hover:text-text-muted"
    >
      <LogOut size={14} />
      Exit demo
    </button>
  );
}
