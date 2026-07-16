/**
 * Seeds Supabase with the demo persona: Sophia, the Remittance Anchor.
 * Idempotent — safe to re-run; it deletes and re-inserts the demo user's rows.
 *
 * Usage: npm run seed
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
import {
  buildAccounts,
  buildCommitments,
  buildGoal,
  buildHistoricalWaterfallRuns,
  buildTransactions,
  DEMO_USER,
} from "../src/lib/demo/personaData";
import {
  CURRENT_ACCOUNT_ID,
  DEMO_USER_ID,
  GOAL_ID,
  HOUSE_FUND_ACCOUNT_ID,
  INVEST_ACCOUNT_ID,
  PLAN_ID,
  RAINY_DAY_ACCOUNT_ID,
} from "../src/lib/demo/constants";
import {
  accountToRow,
  commitmentToRow,
  goalToRow,
  transactionToRow,
  waterfallRunToRow,
} from "../src/lib/supabase/mappers";
import { WaterfallEngine } from "../src/domain/WaterfallEngine";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  console.log("Wiping existing demo user rows (cascade)...");
  await supabase.from("users").delete().eq("id", DEMO_USER_ID);

  console.log("Inserting demo user...");
  const { error: userErr } = await supabase.from("users").insert({
    id: DEMO_USER_ID,
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    persona: DEMO_USER.persona,
  });
  if (userErr) throw userErr;

  const accountIds = {
    currentAccountId: CURRENT_ACCOUNT_ID,
    houseFundAccountId: HOUSE_FUND_ACCOUNT_ID,
    rainyDayAccountId: RAINY_DAY_ACCOUNT_ID,
    investAccountId: INVEST_ACCOUNT_ID,
  };
  const accounts = buildAccounts(DEMO_USER_ID, accountIds);
  console.log(`Inserting ${accounts.length} accounts...`);
  const { error: accErr } = await supabase
    .from("accounts")
    .insert(accounts.map((a) => accountToRow(a)));
  if (accErr) throw accErr;

  const transactions = buildTransactions(DEMO_USER_ID, CURRENT_ACCOUNT_ID);
  console.log(`Inserting ${transactions.length} transactions...`);
  const { error: txErr } = await supabase
    .from("transactions")
    .insert(transactions.map((t) => transactionToRow(t)));
  if (txErr) throw txErr;

  const commitments = buildCommitments(DEMO_USER_ID, transactions);
  console.log(`Inserting ${commitments.length} commitments...`);
  const { error: commitErr } = await supabase
    .from("commitments")
    .insert(commitments.map((c) => commitmentToRow(c)));
  if (commitErr) throw commitErr;

  const goal = buildGoal(DEMO_USER_ID, GOAL_ID, HOUSE_FUND_ACCOUNT_ID);
  console.log("Inserting goal...");
  const { error: goalErr } = await supabase.from("goals").insert(goalToRow(goal));
  if (goalErr) throw goalErr;

  const engine = new WaterfallEngine();
  const plan = {
    id: PLAN_ID,
    userId: DEMO_USER_ID,
    goals: [goal],
    waterfallOrder: [] as ReturnType<typeof engine.buildDefaultWaterfall>,
    safeToSpendFloor: 500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  plan.waterfallOrder = engine.buildDefaultWaterfall(
    commitments.filter((c) => c.status === "confirmed"),
    plan
  );

  console.log("Inserting plan...");
  const { error: planErr } = await supabase.from("plans").insert({
    id: plan.id,
    user_id: plan.userId,
    safe_to_spend_floor: plan.safeToSpendFloor,
    waterfall_order: plan.waterfallOrder,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  });
  if (planErr) throw planErr;

  const historicalRuns = buildHistoricalWaterfallRuns(
    DEMO_USER_ID,
    CURRENT_ACCOUNT_ID,
    HOUSE_FUND_ACCOUNT_ID,
    GOAL_ID
  );
  console.log(`Inserting ${historicalRuns.length} historical waterfall runs...`);
  const { error: waterfallErr } = await supabase
    .from("waterfall_runs")
    .insert(historicalRuns.map((r) => waterfallRunToRow(r)));
  if (waterfallErr) throw waterfallErr;

  console.log("✅ Seed complete. Demo user:", DEMO_USER.email);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
