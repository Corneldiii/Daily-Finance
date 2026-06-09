"use client";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[] }

export default function Summary({ transactions }: Props) {
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        border: "1px solid rgba(124,107,255,0.3)",
        borderRadius: 16, padding: "20px 24px",
        gridColumn: "span 1",
      }}>
        <p style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Net Balance</p>
        <p className="mono" style={{ fontSize: 26, fontWeight: 500, color: balance >= 0 ? "var(--green)" : "var(--red)", letterSpacing: "-0.5px" }}>
          {fmt(balance)}
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
          Savings rate: <span style={{ color: savingsRate >= 30 ? "var(--green)" : "var(--muted)" }}>{savingsRate}%</span>
        </p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <p style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Income</p>
          <span style={{ fontSize: 11, background: "var(--green-dim)", color: "var(--green)", padding: "2px 8px", borderRadius: 20 }}>↓ IN</span>
        </div>
        <p className="mono" style={{ fontSize: 22, fontWeight: 500, color: "var(--green)" }}>{fmt(income)}</p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{transactions.filter(t => t.type === "income").length} transactions</p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <p style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Expenses</p>
          <span style={{ fontSize: 11, background: "var(--red-dim)", color: "var(--red)", padding: "2px 8px", borderRadius: 20 }}>↑ OUT</span>
        </div>
        <p className="mono" style={{ fontSize: 22, fontWeight: 500, color: "var(--red)" }}>{fmt(expense)}</p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{transactions.filter(t => t.type === "expense").length} transactions</p>
      </div>
    </div>
  );
}