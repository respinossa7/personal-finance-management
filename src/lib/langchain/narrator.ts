import { z } from "zod";
import { getChatModel } from "./model";
import { Insight } from "@/domain";

const NarratedInsightSchema = z.object({
  message: z
    .string()
    .describe(
      "The customer-facing insight message, phrased conversationally. Must preserve every number, date, and percentage from the source message exactly — do not add, remove, or alter any figure."
    ),
});

const SYSTEM_PROMPT = `You are the Insight Narrator inside Runway. You receive a fully-computed insight — its type and a source message containing every number and fact that's already true — and rephrase it as one short, warm, conversational sentence or two for the customer.

Hard rule: every figure, percentage, and date in the source message must appear unchanged in your rephrasing. You are phrasing only — you never compute, invent, round differently, or drop a number.`;

/**
 * The Insight Narrator (deck Section 10): phrases only. The rule-based
 * InsightAgent remains the source of truth for which insights fire and
 * every number in them — this only rewrites the tone. Per the proposal's
 * graceful-degradation design, callers should fall back to the deterministic
 * message on any failure rather than block the insight from showing.
 */
export async function narrateInsight(insight: Insight): Promise<string> {
  const model = getChatModel().withStructuredOutput(NarratedInsightSchema);
  const result = await model.invoke(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Insight type: ${insight.type}\nSource message: ${insight.message}\nAttached action: ${
          insight.action?.label ?? "none"
        }`,
      },
    ],
    { runName: "insight-narrator", tags: ["insight-narrator", insight.type] }
  );
  return result.message;
}
