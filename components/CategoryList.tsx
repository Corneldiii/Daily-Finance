"use client";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[] }

const COLORS: Record<string, string> = {
  Food: "#f59e0b", Transport: "#3b82f6", Shopping: "#ec4899",
  Entertainment: "#8b5cf6", Bills: "#f97316", Health: "#14b8a6",
  Other: "#6b7280", Salary: "#00d084", Freelance: "#06b6d4", Investment: "#7c6bff",
};

const ICONS: Record<string, string> = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎮",
  Bills: "🧾", Health: "💊", Other: "📦", Salary: "💼", Freelance: "💻", Investment: "📈",
};

export default function CategoryList({ transactions }: Props) {
  const expenses = transactions.filter(t => t.type === "expense");
  const total = expenses.reduce((s, t) => s + t.amount, 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Spending Breakdown</p>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>By category this month</p>
      </div>

      {sorted.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>No expenses yet</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {sorted.map(([cat, amount]) => {
            const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
            const color = COLORS[cat] || "#6b7280";
            return (
              <div key={cat}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{ICONS[cat] || "📦"}</span>
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{cat}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text)" }}>{fmt(amount)}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 4, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.7s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}