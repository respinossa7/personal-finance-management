import { redirect } from "next/navigation";
import { getDemoUserId } from "@/lib/demo/session";
import { FinanceRepository } from "@/lib/repository/FinanceRepository";
import { PlanChat } from "@/components/PlanChat";

export default async function PlanPage() {
  const userId = await getDemoUserId();
  if (!userId) redirect("/login");

  const history = await new FinanceRepository().getChatHistory(userId);

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border-subtle px-4 py-3">
        <h1 className="text-lg font-semibold text-text">The Plan</h1>
        <p className="mt-1 text-xs text-text-muted">
          Every number here comes from a calculation tool, not the model. Ask
          about a goal, a trade-off, or your current numbers.
        </p>
      </div>
      <PlanChat initialMessages={history} />
    </div>
  );
}
