"use client";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[]; carryOver?: number; currentMonth?: string }

export default function Summary({ transactions, carryOver = 0, currentMonth }: Props) {
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const saving = transactions.filter(t => t.type === "saving").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense - saving;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  const now = new Date();
  const today = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const isCurrentMonth = currentMonth === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const expenseDays = transactions.filter(t => t.type === "expense" && t.date.startsWith(currentMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)).reduce<Set<string>>((acc, t) => { acc.add(t.date); return acc; }, new Set());
  const activeDays = expenseDays.size;
  const avgPerDay = activeDays > 0 ? Math.round(expense / activeDays) : 0;
  const daysLeft = isCurrentMonth ? daysInMonth - today : daysInMonth;
  const projectedDays = avgPerDay > 0 ? Math.floor(balance / avgPerDay) : (balance > 0 ? Infinity : 0);

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
        {isCurrentMonth && avgPerDay > 0 && (
          <p style={{ fontSize: 9, color: "var(--muted)", marginTop: 3 }}>
            avg <span className="mono">{fmt(avgPerDay)}</span>/day &middot;{" "}
            <span style={{ color: projectedDays >= daysLeft ? "var(--green)" : projectedDays >= 7 ? "#fbbf24" : "var(--red)" }}>
              {projectedDays === Infinity ? "∞" : `${projectedDays}d`} left
            </span>{" "}
            <span style={{ opacity: 0.5 }}>({daysLeft}d remaining)</span>
          </p>
        )}
        {isCurrentMonth && balance < 0 && (
          <p style={{ fontSize: 9, color: "var(--red)", marginTop: 3, fontWeight: 500 }}>
            🔴 Over budget! Reduce spending or add income
          </p>
        )}
        {isCurrentMonth && balance > 0 && avgPerDay > 0 && projectedDays < daysLeft && projectedDays >= 0 && (
          <p style={{ fontSize: 9, color: "#fbbf24", marginTop: 3, fontWeight: 500 }}>
            ⚠️ Running low — pace exceeds income
          </p>
        )}
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
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{transactions.filter(t => t.type === "income").length} transactions</p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Expenses</p>
          <span style={{ fontSize: 9, background: "var(--red-dim)", color: "var(--red)", padding: "2px 6px", borderRadius: 12 }}>OUT</span>
        </div>
        <p className="mono" style={{ fontSize: 18, fontWeight: 500, color: "var(--red)" }}>{fmt(expense)}</p>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{transactions.filter(t => t.type === "expense").length} transactions</p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Savings</p>
          <span style={{ fontSize: 9, background: "var(--accent-dim)", color: "var(--accent)", padding: "2px 6px", borderRadius: 12 }}>SAV</span>
        </div>
        <p className="mono" style={{ fontSize: 18, fontWeight: 500, color: "var(--accent)" }}>{fmt(saving)}</p>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{transactions.filter(t => t.type === "saving").length} transactions</p>
      </div>
    </div>
  );
}
