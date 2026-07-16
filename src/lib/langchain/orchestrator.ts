import { Annotation, StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { z } from "zod";
import { getChatModel } from "./model";
import { createGoalPlannerAgent } from "./agents/goalPlanner";
import { createCashFlowInterpreterAgent } from "./agents/cashFlowInterpreter";

const SPECIALISTS = ["goal_planner", "cash_flow_interpreter"] as const;

const RouteSchema = z.object({
  specialist: z
    .enum(SPECIALISTS)
    .describe(
      "goal_planner: the customer is describing a life goal, wants a funded schedule, or is discussing an existing goal's trade-offs. cash_flow_interpreter: the customer is asking what's safe to spend, about their runway, or wants their commitments/forecast explained in plain language."
    ),
});

const ROUTER_PROMPT = `You are the Orchestrator for Wio Flow's Plan chat. You never answer the customer directly — you read the conversation and decide which single specialist should take this turn:

- goal_planner: the customer describes a life goal, wants a funded schedule, or is discussing an existing goal's trade-offs.
- cash_flow_interpreter: the customer asks what's safe to spend, about runway, or wants their commitments/forecast explained in plain language.

Consider the full conversation, not just the last message, and pick the specialist whose job matches what the customer needs right now.`;

const OrchestratorState = Annotation.Root({
  messages: MessagesAnnotation.spec.messages,
  route: Annotation<(typeof SPECIALISTS)[number]>(),
});

/**
 * The Orchestrator (deck Section 10/15): interprets, decides which single
 * specialist a turn needs, and merges the result back into one voice. Only
 * two specialists exist today (Goal Planner, Cash-Flow Interpreter); adding
 * a third is a new node plus a route-schema enum value, not a rewrite.
 */
export function createOrchestrator(userId: string) {
  const router = getChatModel().withStructuredOutput(RouteSchema);
  const goalPlanner = createGoalPlannerAgent(userId);
  const cashFlowInterpreter = createCashFlowInterpreterAgent(userId);

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
    .addEdge(START, "classify_intent")
    .addConditionalEdges("classify_intent", (state) => state.route, {
      goal_planner: "goal_planner",
      cash_flow_interpreter: "cash_flow_interpreter",
    })
    .addEdge("goal_planner", END)
    .addEdge("cash_flow_interpreter", END);

  return graph.compile();
}
