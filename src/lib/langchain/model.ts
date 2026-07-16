import { ChatAnthropic } from "@langchain/anthropic";

/**
 * The one model every agent in this app runs on. Kept as a single shared
 * instance rather than per-agent tiering — this is a demo, and one model is
 * easier to reason about and debug than a routing/mid/frontier split.
 */
export function getChatModel(): ChatAnthropic {
  return new ChatAnthropic({
    model: "claude-opus-4-8",
    apiKey: process.env.ANTHROPIC_API_KEY,
    outputConfig: { effort: "medium" },
  });
}
