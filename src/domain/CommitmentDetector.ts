import { Commitment, CommitmentType, Transaction } from "./types";

interface MerchantGroup {
  merchantKey: string;
  merchantLabel: string;
  transactions: Transaction[];
}

/**
 * Detects recurring commitments from raw transaction history: same merchant,
 * similar amount, similar day-of-month. Deliberately rules-based and
 * interpretable rather than a black-box model (per the proposal's staged
 * plan: rules first for auditability inside a bank, every user confirmation
 * becomes a free training label for a later ML upgrade).
 *
 * Security note: `merchantRaw` is attacker-controlled free text (anyone can
 * name a payment reference anything). It is normalized/sanitized here and
 * never passed to an LLM or interpolated into anything executable.
 */
export class CommitmentDetector {
  private static readonly MIN_OCCURRENCES = 2;
  private static readonly AMOUNT_TOLERANCE_PCT = 0.12;
  private static readonly DAY_OF_MONTH_TOLERANCE = 3;

  private static readonly SUBSCRIPTION_KEYWORDS = [
    "netflix",
    "spotify",
    "gym",
    "fitness",
    "gym",
    "icloud",
    "prime",
    "playstation",
    "mobile",
    "telecom",
    "streaming",
  ];
  private static readonly REMITTANCE_KEYWORDS = [
    "exchange",
    "remit",
    "western union",
    "wise",
    "transfer to",
    "wire transfer",
    "money transfer",
  ];
  private static readonly RENT_KEYWORDS = ["rent", "properties", "real estate", "landlord"];
  private static readonly SCHOOL_KEYWORDS = ["school", "nursery", "academy", "education"];

  detect(transactions: Transaction[]): Commitment[] {
    const debits = transactions.filter((t) => t.direction === "debit");
    const groups = this.groupByMerchant(debits);
    const commitments: Commitment[] = [];

    for (const group of groups) {
      const detected = this.evaluateGroup(group);
      if (detected) commitments.push(detected);
    }

    return commitments.sort((a, b) => b.confidence - a.confidence);
  }

  private groupByMerchant(transactions: Transaction[]): MerchantGroup[] {
    const map = new Map<string, MerchantGroup>();
    for (const t of transactions) {
      const key = this.normalizeMerchant(t.merchantRaw);
      const existing = map.get(key);
      if (existing) {
        existing.transactions.push(t);
      } else {
        map.set(key, { merchantKey: key, merchantLabel: this.titleCase(key), transactions: [t] });
      }
    }
    return Array.from(map.values());
  }

  /** Strips currency codes, reference numbers and punctuation noise from
   * untrusted merchant text so grouping isn't defeated by trailing txn IDs. */
  private normalizeMerchant(raw: string): string {
    return raw
      .toLowerCase()
      .replace(/[0-9]{4,}/g, "")
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private titleCase(s: string): string {
    return s
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" ");
  }

  private evaluateGroup(group: MerchantGroup): Commitment | null {
    if (group.transactions.length < CommitmentDetector.MIN_OCCURRENCES) return null;

    const amounts = group.transactions.map((t) => t.amount);
    const avgAmount = mean(amounts);
    const amountSpread = (Math.max(...amounts) - Math.min(...amounts)) / avgAmount;
    if (amountSpread > CommitmentDetector.AMOUNT_TOLERANCE_PCT * 2) return null;

    const daysOfMonth = group.transactions.map((t) => new Date(t.postedAt).getDate());
    const avgDay = Math.round(mean(daysOfMonth));
    const dayVariance = Math.max(...daysOfMonth) - Math.min(...daysOfMonth);
    if (dayVariance > CommitmentDetector.DAY_OF_MONTH_TOLERANCE * 2) return null;

    const occurrenceScore = Math.min(1, group.transactions.length / 4);
    const amountScore = 1 - amountSpread / (CommitmentDetector.AMOUNT_TOLERANCE_PCT * 2);
    const dayScore = 1 - dayVariance / (CommitmentDetector.DAY_OF_MONTH_TOLERANCE * 2);
    const confidence = Math.max(0, Math.min(1, occurrenceScore * 0.4 + amountScore * 0.3 + dayScore * 0.3));

    const type = this.classifyType(group.merchantKey);

    return {
      id: `commit_${group.merchantKey.replace(/\s+/g, "_")}`,
      userId: group.transactions[0].userId,
      name: group.merchantLabel,
      type,
      amount: round2(avgAmount),
      currency: "$",
      cadenceDayOfMonth: avgDay,
      confidence: round2(confidence),
      status: "detected",
      sourceTransactionIds: group.transactions.map((t) => t.id),
      detectedAt: new Date().toISOString(),
    };
  }

  private classifyType(merchantKey: string): CommitmentType {
    if (CommitmentDetector.REMITTANCE_KEYWORDS.some((k) => merchantKey.includes(k))) return "remittance";
    if (CommitmentDetector.RENT_KEYWORDS.some((k) => merchantKey.includes(k))) return "rent";
    if (CommitmentDetector.SCHOOL_KEYWORDS.some((k) => merchantKey.includes(k))) return "school_fees";
    if (CommitmentDetector.SUBSCRIPTION_KEYWORDS.some((k) => merchantKey.includes(k))) return "subscription";
    return "other_recurring";
  }
}

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
