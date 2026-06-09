"use client";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[] }

export default function BarChart({ transactions }: Props) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
    };
  });

  const data = months.map(({ key, label }) => {
    const txs = transactions.filter(t => t.date.startsWith(key));
    return {
      label,
      income: txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const fmt = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : `${n}`;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Cash Flow</p>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Last 6 months</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {[["var(--green)", "Income"], ["var(--red)", "Expenses"]].map(([c, l]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: c as string, display: "inline-block" }} />{l}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 96, width: "100%" }}>
              <div style={{
                flex: 1, borderRadius: "3px 3px 0 0",
                background: "var(--green)", opacity: 0.8,
                height: `${(d.income / max) * 100}%`,
                minHeight: d.income > 0 ? 3 : 0,
                transition: "height 0.6s ease",
              }} title={fmt(d.income)} />
              <div style={{
                flex: 1, borderRadius: "3px 3px 0 0",
                background: "var(--red)", opacity: 0.8,
                height: `${(d.expense / max) * 100}%`,
                minHeight: d.expense > 0 ? 3 : 0,
                transition: "height 0.6s ease",
              }} title={fmt(d.expense)} />
            </div>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}