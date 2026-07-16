import {
  ArrowLeftRight,
  GraduationCap,
  Home,
  LucideIcon,
  PiggyBank,
  Receipt,
  Repeat,
} from "lucide-react";
import { CommitmentType } from "@/domain";

/**
 * Shared display metadata for commitment types — one source of truth for the
 * label, icon and chart color used across the Recurring Payments page and
 * the dashboard breakdown, so an icon and a color always mean the same
 * thing wherever they show up.
 */
export const COMMITMENT_TYPE_ORDER: CommitmentType[] = [
  "rent",
  "remittance",
  "subscription",
  "other_recurring",
  "savings_goal",
  "school_fees",
];

export const COMMITMENT_TYPE_META: Record<
  CommitmentType,
  { label: string; icon: LucideIcon; colorVar: string }
> = {
  rent: { label: "Rent", icon: Home, colorVar: "var(--color-cat-1)" },
  remittance: { label: "Remittance", icon: ArrowLeftRight, colorVar: "var(--color-cat-2)" },
  subscription: { label: "Subscriptions", icon: Repeat, colorVar: "var(--color-cat-3)" },
  other_recurring: { label: "Utilities & other", icon: Receipt, colorVar: "var(--color-cat-4)" },
  savings_goal: { label: "Savings goal", icon: PiggyBank, colorVar: "var(--color-cat-5)" },
  school_fees: { label: "School fees", icon: GraduationCap, colorVar: "var(--color-cat-1)" },
};
