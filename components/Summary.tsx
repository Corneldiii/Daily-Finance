"use client";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[]; carryOver?: number }

export default function Summary({ transactions, carryOver = 0 }: Props) {
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        border: "1px solid rgba(124,107,255,0.3)",
        borderRadius: 12, padding: "14px 16px",
      }}>
        <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Net Balance</p>
        <p className="mono" style={{ fontSize: 20, fontWeight: 500, color: balance >= 0 ? "var(--green)" : "var(--red)" }}>
          {fmt(balance)}
        </p>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          Savings: <span style={{ color: savingsRate >= 30 ? "var(--green)" : "var(--muted)" }}>{savingsRate}%</span>
        </p>
        {carryOver > 0 && (
          <p style={{ fontSize: 9, color: "var(--accent)", marginTop: 3 }}>
            + {fmt(carryOver)} carry over
          </p>
        )}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Income</p>
          <span style={{ fontSize: 9, background: "var(--green-dim)", color: "var(--green)", padding: "2px 6px", borderRadius: 12 }}>IN</span>
        </div>
        <p className="mono" style={{ fontSize: 18, fontWeight: 500, color: "var(--green)" }}>{fmt(income)}</p>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{transactions.filter(t => t.type === "income").length} transaksi</p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Expenses</p>
          <span style={{ fontSize: 9, background: "var(--red-dim)", color: "var(--red)", padding: "2px 6px", borderRadius: 12 }}>OUT</span>
        </div>
        <p className="mono" style={{ fontSize: 18, fontWeight: 500, color: "var(--red)" }}>{fmt(expense)}</p>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{transactions.filter(t => t.type === "expense").length} transaksi</p>
      </div>
    </div>
  );
}
