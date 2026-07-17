/**
 * Wio Flow's product-policy knowledge base. Small and hand-written for this
 * demo, but structured the way a real one would be: short, self-contained
 * passages a retriever can match independently, each traceable to a single
 * policy so an answer can cite exactly which one it drew from.
 */
export interface PolicyDoc {
  id: string;
  title: string;
  content: string;
}

export const POLICY_DOCS: PolicyDoc[] = [
  {
    id: "safe-to-spend-definition",
    title: "How safe-to-spend is calculated",
    content:
      "Safe-to-spend-today is never a precise line — it's a conservative floor. It equals confirmed funds, minus detected upcoming commitments still due this month, minus the customer's safe-to-spend floor, minus an 8% uncertainty buffer, divided by the days remaining in the month. Wio Flow always promises 'at least this much,' never an exact figure, so the product under-promises rather than over-promises.",
  },
  {
    id: "reversibility-invariant",
    title: "Which automated moves can be undone",
    content:
      "Internal moves — sweeps between a customer's own Wio accounts and Saving Spaces — are undoable for 24 hours after execution. Anything irreversible, specifically investments and international remittance transfers, is never fully automated: it is staged with a veto window and requires explicit confirmation before it executes, and once executed it cannot be undone through the app.",
  },
  {
    id: "saving-space-yield",
    title: "Saving Space interest rate",
    content:
      "Money moved into a Saving Space earns approximately 6% per annum, compared to 0% sitting in a non-interest current account. The idle-cash insight recommends moving balances above AED 15,000 sitting in a zero-rate liquid account into a Saving Space to capture this yield.",
  },
  {
    id: "threshold-tracker-condition",
    title: "The AED 5,000 Threshold Tracker",
    content:
      "The Threshold Tracker follows a customer's live progress toward an AED 5,000 spend condition (for example, a fee waiver or benefit tied to monthly spend). It only routes spending the customer already planned toward that condition — it never nudges the customer to spend more than they intended — and it stops tracking once the threshold is met. There are no streaks or gamification here.",
  },
  {
    id: "wps-salary-transfer-gate",
    title: "Salary-transfer eligibility (WPS)",
    content:
      "The salary-day waterfall automation is available to customers whose salary is transferred into Wio via the UAE's Wage Protection System (WPS), with a minimum recognized monthly salary transfer of AED 15,000. This is the cohort the waterfall (remittance, then goals, then safe-to-spend release) launches with, since their income is fully visible at the source.",
  },
  {
    id: "subscription-cancellation-policy",
    title: "How subscription review works",
    content:
      "The ledger can prove a customer paid for a subscription; it can never prove whether they used it. So the product always asks 'want to review it?' rather than asserting 'you don't use this.' Cancellation routes through in-app service initiation where the merchant supports it, or a prepared merchant contact otherwise — blocking a card payment alone does not terminate the underlying contract with the merchant.",
  },
  {
    id: "global-pause-and-life-event-mode",
    title: "Pausing automation",
    content:
      "A single global pause switch stops all automation immediately with no friction, and is resumable later with a summary of what was skipped while paused. Life-event mode is a related, narrower control: declaring a big one-off expense or life event pauses non-essential automation for that billing cycle only, without needing the full global pause.",
  },
  {
    id: "confidence-gated-automation",
    title: "When automation slows itself down",
    content:
      "When a customer's transaction pattern stops matching their history — an income anomaly, an unusually large outflow, or a brand-new payee — forecast uncertainty widens automatically and automation throttles itself toward asking rather than acting. The system's default under uncertainty is to do less and ask a question, not to guess.",
  },
];
