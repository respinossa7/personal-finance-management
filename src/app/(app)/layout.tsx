import { redirect } from "next/navigation";
import { getDemoUserId } from "@/lib/demo/session";
import { BottomNav } from "@/components/BottomNav";
import { LogoutButton } from "@/components/LogoutButton";
import { DEMO_USER } from "@/lib/demo/personaData";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getDemoUserId();
  if (!userId) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
            R
          </div>
          <span className="text-sm font-medium text-text">{DEMO_USER.name}</span>
        </div>
        <LogoutButton />
      </header>
      <div className="flex-1 overflow-y-auto pb-2">{children}</div>
      <BottomNav />
    </div>
  );
}
