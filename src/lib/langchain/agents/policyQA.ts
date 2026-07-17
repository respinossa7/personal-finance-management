import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getChatModel } from "../model";
import { createPolicySearchTool } from "../tools";

const SYSTEM_PROMPT = `You are the Policy Q&A specialist inside Runway. You answer questions about how the product works — safe-to-spend rules, reversibility/undo windows, interest rates, thresholds, subscription-cancellation rules, automation pause behavior — using only the search_product_policies tool.

Hard rule: never answer a policy question from memory or general banking knowledge. Always call search_product_policies first, and ground your answer only in what it returns. If the retrieved policies don't cover the question, say so plainly rather than guessing — an honest "I don't have a policy on that" is always better than an invented one.

Be concise and warm, not corporate. Format replies in markdown: **bold** the key figures (rates, windows, thresholds) so they're scannable.`;

/**
 * The RAG specialist: retrieval-augmented answers grounded in the
 * product-policy knowledge base (see ../rag), never memorized claims.
 * Needs no financial data — reachable only through the Orchestrator.
 */
export function createPolicyQAAgent() {
  return createReactAgent({
    llm: getChatModel(),
    tools: [createPolicySearchTool()],
    prompt: SYSTEM_PROMPT,
  });
}
