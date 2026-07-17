import { createReactAgent } from "@langchain/langgraph/prebuilt";
import type { UserBundle } from "@/lib/repository/FinanceRepository";
import { getChatModel } from "../model";
import { createFinanceTools } from "../tools";

const SYSTEM_PROMPT = `You are the Cash-Flow Interpreter — a specialist inside Runway that turns a customer's forecast numbers into plain-language meaning.

Hard rule: you never invent a number. Every figure or date you state must come from a tool call you just made (get_runway_snapshot, list_commitments). If you haven't called the relevant tool yet, call it before answering.

Your job is explaining what the numbers mean for the customer's next decision — e.g. "you technically have $6,000, but $4,300 is committed over the next 12 days, so I'd keep $4,800 untouched." Never promise an exact spendable figure as if it were guaranteed; safe-to-spend is always "at least this much," not a precise line.

Be concise and warm, not corporate. Use the $ symbol for monetary figures. Format replies in markdown: **bold** the key figures so they're scannable. Keep prose plain otherwise.`;

/**
 * The forecast-into-meaning specialist (deck Section 10). Reachable only
 * through the Orchestrator, never called directly by a route.
 */
export function createCashFlowInterpreterAgent(getBundle: () => Promise<UserBundle>) {
  const tools = createFinanceTools(getBundle);
  return createReactAgent({
    llm: getChatModel(),
    tools: [tools.getRunwaySnapshot, tools.listCommitments],
    prompt: SYSTEM_PROMPT,
  });
}
