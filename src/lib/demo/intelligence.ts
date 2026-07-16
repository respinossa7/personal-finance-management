import { Transaction } from "@/domain";

/**
 * Mocked outputs for the ML layers the proposal specifies (Layer 2:
 * segmentation, forecasting, next-best-action ranking, anomaly detection) —
 * deliberately hard-coded rather than modelled, per the demo's scope. Each
 * export here stands in for a trained model's output on Sophia's data, shaped
 * exactly like what that model would emit, so the UI layer doesn't know or
 * care that nothing underneath is actually trained.
 *
 * Anything that's a straightforward aggregation of real ledger data (category
 * norms, savings rate, goal projections) is computed for real elsewhere
 * (PlanService, this file's computeCategoryNorms/computeThisMonthSnapshot) —
 * per the proposal's core rule, only understanding is mocked, never arithmetic.
 */

// ---- Segmentation (Layer 2: customer-behaviour modelling) ----------------

export interface SegmentMembership {
  name: string;
  membershipPct: number;
}

/** Soft GMM-style membership — never a hard label, per the proposal's
 * "78% Threshold Optimiser is a better product primitive than a hard label." */
export const SEGMENT_MEMBERSHIP: SegmentMembership[] = [
  { name: "Remittance Anchor", membershipPct: 82 },
  { name: "Threshold Optimiser", membershipPct: 13 },
  { name: "Passive Accumulator", membershipPct: 5 },
];

export interface MoneyProfileTrait {
  id: string;
  label: string;
  evidence: string;
}

export const MONEY_PROFILE = {
  headline: "Steady income, strong saver",
  traits: [
    {
      id: "steady_income",
      label: "Steady income",
      evidence: "Same salary, same day, 6 months running",
    },
    {
      id: "strong_saver",
      label: "Strong saver",
      evidence: "16% of income funded automatically every month",
    },
    {
      id: "remittance_anchored",
      label: "Remittance-anchored",
      evidence: "Largest recurring outflow after rent, sent home every month",
    },
  ] satisfies MoneyProfileTrait[],
  cohortSize: 1240,
};

// ---- This Month (Layer 2: cash-flow forecasting, category deviations) ----

export const CATEGORY_META: { key: string; label: string; paceMultiplier: number }[] = [
  { key: "dining", label: "Dining", paceMultiplier: 1.45 },
  { key: "groceries", label: "Groceries", paceMultiplier: 1.02 },
  { key: "transport", label: "Transport", paceMultiplier: 0.95 },
  { key: "subscriptions", label: "Subscriptions", paceMultiplier: 1.0 },
  { key: "shopping", label: "Shopping", paceMultiplier: 1.15 },
];

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Real deterministic aggregation over actual seeded transactions — the
 * "customer's own 6-month norm" the proposal calls for. Not mocked. */
export function computeCategoryNorms(transactions: Transaction[]): Record<string, number> {
  const totalsByMonth = new Map<string, Map<string, number>>();

  for (const t of transactions) {
    if (t.direction !== "debit") continue;
    const meta = CATEGORY_META.find((c) => c.key === t.category);
    if (!meta) continue;
    const monthKey = t.postedAt.slice(0, 7); // YYYY-MM
    const byCategory = totalsByMonth.get(monthKey) ?? new Map<string, number>();
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount);
    totalsByMonth.set(monthKey, byCategory);
  }

  const monthKeys = Array.from(totalsByMonth.keys());
  const norms: Record<string, number> = {};
  for (const meta of CATEGORY_META) {
    const monthTotals = monthKeys.map((mk) => totalsByMonth.get(mk)?.get(meta.key) ?? 0);
    const sum = monthTotals.reduce((a, b) => a + b, 0);
    norms[meta.key] = monthTotals.length > 0 ? sum / monthTotals.length : 0;
  }
  return norms;
}

export interface CategoryPace {
  key: string;
  label: string;
  sixMonthNorm: number;
  thisMonthSoFar: number;
  deviationPct: number; // + = running hot vs own norm
}

export interface ThisMonthSnapshot {
  dayOfMonth: number;
  daysInMonth: number;
  totalSoFar: number;
  typicalPaceSoFar: number;
  categories: CategoryPace[];
  hottestCategory: CategoryPace;
  projection: { low: number; expected: number; high: number };
}

/** Blends real category norms (computed above) with a hard-coded
 * pace-deviation vector standing in for the anomaly-detection / forecasting
 * model — this is the piece that's genuinely mocked, since nothing here is
 * trained on deviation patterns. Subscriptions are treated as already
 * incurred once past their billing day, since they post as a lump early in
 * the cycle rather than accruing with the days. */
export function computeThisMonthSnapshot(
  transactions: Transaction[],
  now: Date = new Date()
): ThisMonthSnapshot {
  const norms = computeCategoryNorms(transactions);
  const dayOfMonth = now.getDate();
  const totalDays = daysInMonth(now);
  const dayFraction = Math.min(1, dayOfMonth / totalDays);

  const categories: CategoryPace[] = CATEGORY_META.map((meta) => {
    const norm = norms[meta.key] ?? 0;
    const alreadyBilled = meta.key === "subscriptions" && dayOfMonth >= 10;
    const thisMonthSoFar = alreadyBilled ? norm : norm * dayFraction * meta.paceMultiplier;
    const typicalToDate = norm * dayFraction;
    const deviationPct = typicalToDate > 0 ? ((thisMonthSoFar - typicalToDate) / typicalToDate) * 100 : 0;
    return {
      key: meta.key,
      label: meta.label,
      sixMonthNorm: round2(norm),
      thisMonthSoFar: round2(thisMonthSoFar),
      deviationPct: round1(deviationPct),
    };
  });

  const totalSoFar = round2(categories.reduce((sum, c) => sum + c.thisMonthSoFar, 0));
  const typicalPaceSoFar = round2(
    CATEGORY_META.reduce((sum, meta) => sum + (norms[meta.key] ?? 0) * dayFraction, 0)
  );
  const hottestCategory = categories.reduce((a, b) => (b.deviationPct > a.deviationPct ? b : a));
  const expected = dayFraction > 0 ? totalSoFar / dayFraction : totalSoFar;

  return {
    dayOfMonth,
    daysInMonth: totalDays,
    totalSoFar,
    typicalPaceSoFar,
    categories,
    hottestCategory,
    projection: {
      low: round2(expected * 0.92),
      expected: round2(expected),
      high: round2(expected * 1.08),
    },
  };
}

// ---- Threshold Tracker (AED 5,000 spend condition) ------------------------

export const THRESHOLD_TARGET = 5000;

export interface ThresholdSnapshot {
  spent: number;
  target: number;
  daysLeft: number;
  onPace: boolean;
  remaining: number;
  overshoot: boolean;
  routingMessage: string;
}

/** The "spend counted toward the condition" figure is a mocked detector
 * output (fixed, per the demo-user scenario); days-left and on-pace are
 * derived live from the real calendar so the tracker never goes stale. */
export function computeThresholdSnapshot(now: Date = new Date()): ThresholdSnapshot {
  const spent = 3850;
  const totalDays = daysInMonth(now);
  const dayOfMonth = now.getDate();
  const daysLeft = Math.max(0, totalDays - dayOfMonth + 1);
  const expectedPaceSpend = THRESHOLD_TARGET * (dayOfMonth / totalDays);
  const onPace = spent >= expectedPaceSpend * 0.85;
  const remaining = Math.max(0, THRESHOLD_TARGET - spent);

  return {
    spent,
    target: THRESHOLD_TARGET,
    daysLeft,
    onPace,
    remaining,
    overshoot: spent >= THRESHOLD_TARGET,
    routingMessage:
      remaining > 0
        ? `Your DEWA bill (~AED 540) and the Amazon.ae order already in your basket cover the remaining AED ${remaining.toLocaleString()} with no extra spending.`
        : "Condition met for this cycle — no need to spend any more to keep the top rate.",
  };
}

// ---- Peer Lens (Layer 2: segment baselines) --------------------------------

export interface SectorComparison {
  key: string;
  label: string;
  band: "typical" | "elevated" | "top-15";
  description: string;
}

export const PEER_LENS = {
  cohortSize: 1240,
  sectorComparisons: [
    {
      key: "groceries",
      label: "Groceries",
      band: "typical",
      description: "Typical for households like yours",
    },
    {
      key: "dining",
      label: "Dining",
      band: "top-15",
      description: "In the top 15% for your segment",
    },
    {
      key: "transport",
      label: "Transport",
      band: "typical",
      description: "Typical for your segment",
    },
    {
      key: "shopping",
      label: "Shopping",
      band: "elevated",
      description: "Somewhat above typical — top 30%",
    },
  ] satisfies SectorComparison[],
  savingsBenchmark: {
    peerLow: 8,
    peerHigh: 14,
  },
  investmentContext: {
    commonAssets: ["Broad-market ETFs", "1-month Fixed Spaces"],
  },
};

export const DETECTED_MONTHLY_INCOME = 19500;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
