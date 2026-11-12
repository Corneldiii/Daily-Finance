import { Category, FundingSource } from "@/types";

export const FUNDING_SOURCES: FundingSource[] = ["Balance", "Tabungan", "E-Money"];

export const SOURCE_META: Record<FundingSource, { icon: string; label: string }> = {
  Balance: { icon: "💵", label: "Balance" },
  Tabungan: { icon: "🏦", label: "Tabungan" },
  "E-Money": { icon: "💳", label: "E-Money" },
};

type SourceTx = { type: string; category: string; source?: FundingSource | string };

export const getExpenseSource = (t: SourceTx): FundingSource => {
  if (t.type !== "expense") return "Balance";
  if (t.source === "Tabungan" || t.source === "E-Money") return t.source;
  if (t.category === ("Pakai E-Money" as Category)) return "E-Money";
  return "Balance";
};

export const isOffNetExpense = (t: SourceTx): boolean =>
  t.type === "expense" && getExpenseSource(t) !== "Balance";
