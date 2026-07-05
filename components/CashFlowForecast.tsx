"use client";
import { useMemo } from "react";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[]; month: string }

export default function CashFlowForecast({ transactions, month }: Props) {
  const [year, monthNum] = month.split("-").map(Number);

  const forecast = useMemo(() => {
    const months: { label: string; key: string; predicted: number; actual?: number }[] = [];
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const getLast6MonthsAvg = () => {
      const txs6m = transactions.filter(t => {
        const d = new Date(t.date);
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return d >= sixMonthsAgo && d < now;
      });
      const totalIncome = txs6m.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const totalExpense = txs6m.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const months = 6;
      return { avgIncome: Math.round(totalIncome / months), avgExpense: Math.round(totalExpense / months) };
    };

    const { avgIncome, avgExpense } = getLast6MonthsAvg();

    let runningBalance = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d < new Date(year, monthNum - 1, 1);
      })
      .reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

    for (let i = 0; i < 6; i++) {
      const d = new Date(year, monthNum - 1 + i, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });

      const actualTxs = transactions.filter(t => t.date.startsWith(mk));
      const hasActual = mk <= currentKey && actualTxs.length > 0;

      if (hasActual) {
        const actualIncome = actualTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const actualExpense = actualTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        runningBalance += actualIncome - actualExpense;
        months.push({ label, key: mk, actual: runningBalance, predicted: runningBalance });
      } else {
        runningBalance += avgIncome - avgExpense;
        months.push({ label, key: mk, predicted: runningBalance });
      }
    }

    return { months, avgIncome, avgExpense };
  }, [transactions, year, monthNum]);

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const values = forecast.months.map(m => m.actual ?? m.predicted);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const chartHeight = 140;
  const barWidth = 100 / forecast.months.length;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
            🔮
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Cash Flow Forecast</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>6-month projection</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 10, color: "var(--muted)" }}>Avg monthly</p>
          <p className="mono" style={{ fontSize: 11, color: "var(--green)" }}>+{fmt(forecast.avgIncome)}</p>
          <p className="mono" style={{ fontSize: 11, color: "var(--red)" }}>-{fmt(forecast.avgExpense)}</p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: "relative", height: chartHeight + 30, marginBottom: 8 }}>
        {/* Zero line */}
        <div style={{
          position: "absolute", left: 0, right: 0,
          top: `${((maxVal) / range) * chartHeight}px`,
          height: 1, background: "var(--border)", opacity: 0.5,
        }} />

        {/* Bars */}
        <div style={{ display: "flex", alignItems: "flex-end", height: chartHeight, gap: 4, paddingTop: 8 }}>
          {forecast.months.map((m, i) => {
            const val = m.actual ?? m.predicted;
            const height = Math.abs(val) / range * chartHeight;
            const isPositive = val >= 0;
            const isActual = m.actual !== undefined;

            return (
              <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span className="mono" style={{ fontSize: 9, color: isPositive ? "var(--green)" : "var(--red)" }}>
                  {fmt(val)}
                </span>
                <div style={{
                  width: "100%", height: `${Math.max(height, 2)}px`,
                  background: isActual
                    ? (isPositive ? "var(--green)" : "var(--red)")
                    : (isPositive ? "rgba(0,208,132,0.3)" : "rgba(255,77,109,0.3)"),
                  borderRadius: "4px 4px 0 0",
                  border: !isActual ? "1px dashed " + (isPositive ? "rgba(0,208,132,0.5)" : "rgba(255,77,109,0.5)") : "none",
                  transition: "height 0.5s ease",
                }} />
              </div>
            );
          })}
        </div>

        {/* Month labels */}
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          {forecast.months.map(m => (
            <div key={m.key} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: 10, color: m.actual !== undefined ? "var(--text)" : "var(--muted)" }}>
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--muted)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--green)" }} /> Actual
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--muted)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(0,208,132,0.3)", border: "1px dashed rgba(0,208,132,0.5)" }} /> Predicted
        </span>
        <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: "auto" }}>
          Based on 6-month average
        </span>
      </div>
    </div>
  );
}
