import { Annotation, StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { z } from "zod";
import type { UserBundle } from "@/lib/repository/FinanceRepository";
import { getChatModel } from "./model";
import { createGoalPlannerAgent } from "./agents/goalPlanner";
import { createCashFlowInterpreterAgent } from "./agents/cashFlowInterpreter";
import { createPolicyQAAgent } from "./agents/policyQA";

const SPECIALISTS = ["goal_planner", "cash_flow_interpreter", "policy_qa"] as const;

const RouteSchema = z.object({
  specialist: z
    .enum(SPECIALISTS)
    .describe(
      "goal_planner: the customer is describing a life goal, wants a funded schedule, or is discussing an existing goal's trade-offs. cash_flow_interpreter: the customer is asking what's safe to spend, about their runway, or wants their commitments/forecast explained in plain language. policy_qa: the customer is asking how the product works or what it guarantees — interest rates, undo windows, thresholds, subscription-cancellation rules, automation pause behavior — rather than asking about their own numbers."
    ),
});

const ROUTER_PROMPT = `You are the Orchestrator for Wio Flow's Plan chat. You never answer the customer directly — you read the conversation and decide which single specialist should take this turn:

- goal_planner: the customer describes a life goal, wants a funded schedule, or is discussing an existing goal's trade-offs.
- cash_flow_interpreter: the customer asks what's safe to spend, about runway, or wants their commitments/forecast explained in plain language.
- policy_qa: the customer is asking how the product works or what it guarantees (rates, undo windows, thresholds, cancellation rules, pause behavior) rather than asking about their own account numbers.

Consider the full conversation, not just the last message, and pick the specialist whose job matches what the customer needs right now. A short follow-up can be misleading in isolation: if the previous turn was goal_planner and this message is clearly continuing that same goal discussion (e.g. "how much would that take out of my runway", "what if I push the date back"), stay with goal_planner — the fact that a word like "runway" appears doesn't mean the topic has switched to a general cash-flow question.`;

const OrchestratorState = Annotation.Root({
  messages: MessagesAnnotation.spec.messages,
  route: Annotation<(typeof SPECIALISTS)[number]>(),
});

/**
 * The Orchestrator (deck Section 10/15): interprets, decides which single
 * specialist a turn needs, and merges the result back into one voice. Adding
 * a third specialist is a new node plus a route-schema enum value, not a
 * rewrite — policy_qa was added this way, alongside the original two.
 */
export function createOrchestrator(getBundle: () => Promise<UserBundle>) {
  const router = getChatModel().withStructuredOutput(RouteSchema);
  const goalPlanner = createGoalPlannerAgent(getBundle);
  const cashFlowInterpreter = createCashFlowInterpreterAgent(getBundle);
  const policyQA = createPolicyQAAgent();

  const graph = new StateGraph(OrchestratorState)
    .addNode("classify_intent", async (state) => {
      const decision = await router.invoke([{ role: "system", content: ROUTER_PROMPT }, ...state.messages]);
      return { route: decision.specialist };
    })
    .addNode("goal_planner", async (state) => {
      const priorCount = state.messages.length;
      const result = await goalPlanner.invoke({ messages: state.messages });
      return { messages: result.messages.slice(priorCount) };
    })
    .addNode("cash_flow_interpreter", async (state) => {
      const priorCount = state.messages.length;
      const result = await cashFlowInterpreter.invoke({ messages: state.messages });
      return { messages: result.messages.slice(priorCount) };
    })
    .addNode("policy_qa", async (state) => {
      const priorCount = state.messages.length;
      const result = await policyQA.invoke({ messages: state.messages });
      return { messages: result.messages.slice(priorCount) };
    })
    .addEdge(START, "classify_intent")
    .addConditionalEdges("classify_intent", (state) => state.route, {
      goal_planner: "goal_planner",
      cash_flow_interpreter: "cash_flow_interpreter",
      policy_qa: "policy_qa",
    })
    .addEdge("goal_planner", END)
    .addEdge("cash_flow_interpreter", END)
    .addEdge("policy_qa", END);

  return graph.compile();
}
