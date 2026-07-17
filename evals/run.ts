/**
 * The eval harness the deck's own design doc calls for and the project
 * never built: "an evaluation harness runs a golden set of customer states
 * with expected insights." Runs each GOLDEN_SET scenario against the real
 * Orchestrator — same agents, same tools, same graph as production — fed a
 * fixed fixture instead of a live Supabase fetch, and checks two things per
 * scenario: did the Orchestrator route to the right specialist, and did the
 * answer state the actual computed numbers (never invented ones).
 *
 * Usage: npm run eval
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { createOrchestrator } from "../src/lib/langchain/orchestrator";
import { FIXTURE_BUNDLE } from "./fixtures";
import { GOLDEN_SET, type GoldenScenario } from "./goldenSet";

interface GroundTruthCheck {
  value: number | string;
  found: boolean;
}

interface ScenarioResult {
  name: string;
  expectedRoute: string;
  actualRoute: string;
  routeOk: boolean;
  checks: GroundTruthCheck[];
  answerText: string;
  pass: boolean;
}

function numberAppears(value: number, text: string): boolean {
  const candidates = [
    String(Math.round(value * 100) / 100),
    String(Math.round(value)),
    value.toLocaleString("en-US", { maximumFractionDigits: 2 }),
    Math.round(value).toLocaleString("en-US"),
  ];
  return candidates.some((c) => text.includes(c));
}

function stringAppears(value: string, text: string): boolean {
  return text.toLowerCase().includes(value.toLowerCase());
}

async function runScenario(scenario: GoldenScenario): Promise<ScenarioResult> {
  const getBundle = async () => FIXTURE_BUNDLE;
  const orchestrator = createOrchestrator(getBundle);

  let messages: BaseMessage[] = [];
  let route = "";
  for (const turn of scenario.turns) {
    messages = [...messages, new HumanMessage(turn)];
    const result = await orchestrator.invoke(
      { messages },
      { runName: `eval:${scenario.name}`, tags: ["eval"] }
    );
    messages = result.messages;
    route = result.route;
  }

  const lastMessage = messages[messages.length - 1];
  const answerText = lastMessage?.text ?? "";
  const groundTruthValues = scenario.groundTruth(FIXTURE_BUNDLE);
  const checks: GroundTruthCheck[] = groundTruthValues.map((value) => ({
    value,
    found: typeof value === "number" ? numberAppears(value, answerText) : stringAppears(value, answerText),
  }));

  const routeOk = route === scenario.expectedRoute;
  const pass = routeOk && checks.every((c) => c.found);

  return { name: scenario.name, expectedRoute: scenario.expectedRoute, actualRoute: route, routeOk, checks, answerText, pass };
}

async function main() {
  const results: ScenarioResult[] = [];
  for (const scenario of GOLDEN_SET) {
    process.stdout.write(`Running ${scenario.name}... `);
    const result = await runScenario(scenario);
    results.push(result);
    console.log(result.pass ? "PASS" : "FAIL");
  }

  console.log("\n" + "=".repeat(70));
  for (const r of results) {
    console.log(`\n${r.pass ? "PASS" : "FAIL"} — ${r.name}`);
    console.log(`  route: expected=${r.expectedRoute} actual=${r.actualRoute} ${r.routeOk ? "ok" : "MISMATCH"}`);
    for (const c of r.checks) {
      console.log(`  ground truth ${JSON.stringify(c.value)}: ${c.found ? "found" : "MISSING"}`);
    }
    console.log(`  answer: ${r.answerText.slice(0, 200)}${r.answerText.length > 200 ? "..." : ""}`);
  }

  const passCount = results.filter((r) => r.pass).length;
  console.log("\n" + "=".repeat(70));
  console.log(`${passCount}/${results.length} scenarios passed`);

  process.exitCode = passCount === results.length ? 0 : 1;
}

main();
