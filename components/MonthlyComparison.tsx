"use client";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[]; month: string }

const COLORS: Record<string, string> = {
  Food: "#f59e0b", Transport: "#3b82f6", Shopping: "#ec4899",
  Entertainment: "#8b5cf6", Bills: "#f97316", Health: "#14b8a6",
  Kos: "#e879f9", Other: "#6b7280",
};

const ICONS: Record<string, string> = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎮",
  Bills: "🧾", Health: "💊", Kos: "🏠", Other: "📦",
};

export default function MonthlyComparison({ transactions, month }: Props) {
  const [year, monthNum] = month.split("-").map(Number);

  const prevDate = new Date(year, monthNum - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const getMonthData = (mk: string) => {
    const txs = transactions.filter(t => t.date.startsWith(mk));
    const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "expense" && t.title !== "Transport Auto-Deduction" && t.category !== "Pakai E-Money").reduce((s, t) => s + t.amount, 0);
    const saving = txs.filter(t => t.type === "saving").reduce((s, t) => s + t.amount, 0);
    const byCategory = txs.filter(t => t.type === "expense").reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    return { income, expense, saving, net: income - expense - saving, byCategory, days: new Date(parseInt(mk.split("-")[0]), parseInt(mk.split("-")[1]), 0).getDate() };
  };

  const current = getMonthData(month);
  const previous = getMonthData(prevMonth);

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const diffPct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? "+∞" : "0";
    const pct = ((curr - prev) / prev) * 100;
    return pct > 0 ? `+${Math.round(pct)}%` : `${Math.round(pct)}%`;
  };

  const diffColor = (curr: number, prev: number, higherIsBad: boolean) => {
    if (prev === 0) return "var(--muted)";
    const diff = curr - prev;
    if (diff === 0) return "var(--muted)";
    if (higherIsBad) return diff > 0 ? "var(--red)" : "var(--green)";
    return diff > 0 ? "var(--green)" : "var(--red)";
  };

  const allCategories = [...new Set([...Object.keys(current.byCategory), ...Object.keys(previous.byCategory)])];
  const sortedCats = allCategories.sort((a, b) => (current.byCategory[b] || 0) - (current.byCategory[a] || 0));

  const currLabel = new Date(`${month}-01`).toLocaleString("en-US", { month: "short", year: "numeric" });
  const prevLabel = new Date(`${prevMonth}-01`).toLocaleString("en-US", { month: "short", year: "numeric" });

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(124,107,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
          📊
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Monthly Comparison</p>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{currLabel} vs {prevLabel}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(85px, 1fr))", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Income", curr: current.income, prev: previous.income, higherIsBad: false },
          { label: "Expenses", curr: current.expense, prev: previous.expense, higherIsBad: true },
          { label: "Savings", curr: current.saving, prev: previous.saving, higherIsBad: false },
          { label: "Net", curr: current.net, prev: previous.net, higherIsBad: false },
        ].map(({ label, curr, prev, higherIsBad }) => (
          <div key={label} style={{ background: "var(--surface2)", borderRadius: 8, padding: "10px 12px" }}>
            <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            <p className="mono" style={{ fontSize: 14, fontWeight: 500, color: curr >= prev ? (higherIsBad ? "var(--red)" : "var(--green)") : (higherIsBad ? "var(--green)" : "var(--red)"), marginTop: 4 }}>
              {fmt(curr)}
            </p>
            <p style={{ fontSize: 10, color: diffColor(curr, prev, higherIsBad), marginTop: 2 }}>
              {diffPct(curr, prev)} vs prev
            </p>
          </div>
        ))}
      </div>

      {/* Category comparison */}
      {sortedCats.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Category Breakdown</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedCats.map(cat => {
              const curr = current.byCategory[cat] || 0;
              const prev = previous.byCategory[cat] || 0;
              const maxVal = Math.max(curr, prev, 1);
              const isUp = curr > prev;

              return (
                <div key={cat}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12 }}>{ICONS[cat] || "📦"}</span>
                      <span style={{ fontSize: 12, color: "var(--text)" }}>{cat}</span>
                    </div>
                    <span style={{ fontSize: 10, color: isUp ? "var(--red)" : "var(--green)" }}>
                      {diffPct(curr, prev)}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 9, color: "var(--muted)", width: 28 }}>{currLabel.split(" ")[0]}</span>
                      <div style={{ flex: 1, height: 4, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(curr / maxVal) * 100}%`, background: COLORS[cat] || "var(--accent)", borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                      <span className="mono" style={{ fontSize: 10, color: "var(--muted)", minWidth: 60, textAlign: "right" }}>{fmt(curr)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 9, color: "var(--muted)", width: 28 }}>{prevLabel.split(" ")[0]}</span>
                      <div style={{ flex: 1, height: 4, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(prev / maxVal) * 100}%`, background: COLORS[cat] || "var(--muted)", borderRadius: 4, opacity: 0.4, transition: "width 0.5s" }} />
                      </div>
                      <span className="mono" style={{ fontSize: 10, color: "var(--muted)", minWidth: 60, textAlign: "right" }}>{fmt(prev)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
