"use client";

import { Transaction } from "@/types";

interface Props {
  transactions: Transaction[];
  month: string;
  selectedDate?: string | null;
  onDayClick?: (date: string | null) => void;
}

export default function CalendarView({ transactions, month, selectedDate, onDayClick }: Props) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const firstDayOfWeek = new Date(year, monthNum - 1, 1).getDay();

  const dailyExpenses: Record<number, number> = {};
  transactions
    .filter(t => t.date.startsWith(month) && t.type === "expense")
    .forEach(t => {
      const day = new Date(t.date).getDate();
      dailyExpenses[day] = (dailyExpenses[day] || 0) + t.amount;
    });

  const getColor = (amount: number) => {
    if (amount === 0) return { bg: "var(--surface2)", text: "var(--muted)" };
    if (amount > 50000) return { bg: "rgba(255,77,109,0.15)", text: "#ff4d6d" };
    if (amount > 30000) return { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" };
    return { bg: "rgba(0,208,132,0.15)", text: "#00d084" };
  };

  const fmtShort = (n: number) =>
    n >= 1000000 ? `${(n / 1000000).toFixed(1)}jt`
    : n >= 1000 ? `${Math.round(n / 1000)}rb`
    : `${n}`;

  const monthLabel = new Date(year, monthNum - 1).toLocaleString("en-US", { month: "short", year: "numeric" });
  const isCurrentMonth = month === currentMonth;

  const totalExpense = Object.values(dailyExpenses).reduce((s, v) => s + v, 0);
  const activeDays = Object.keys(dailyExpenses).length;
  const avgPerDay = activeDays > 0 ? Math.round(totalExpense / activeDays) : 0;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const cells: ({ day: number; empty: boolean } | { empty: true })[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push({ empty: true, day: 0 });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, empty: false });

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "12px 14px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12 }}>📅</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Calendar</p>
        </div>
        <span style={{ fontSize: 14, color: "var(--muted)" }}>{monthLabel}</span>
      </div>

      {/* Day names */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 14, color: "var(--muted)", padding: "1px 0" }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((cell, i) => {
          if (cell.empty) return <div key={`empty-${i}`} />;
          const amount = dailyExpenses[cell.day] || 0;
          const color = getColor(amount);
          const isToday = isCurrentMonth && cell.day === now.getDate();
          const dateStr = `${month}-${String(cell.day).padStart(2, "0")}`;
          const isSelected = selectedDate === dateStr;
          const hasTx = amount > 0;
          return (
            <div
              key={cell.day}
              onClick={() => onDayClick?.(isSelected ? null : dateStr)}
              style={{
                aspectRatio: "1",
                borderRadius: 4,
                background: isSelected ? "var(--accent-dim)" : color.bg,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0,
                border: isSelected ? "1.5px solid var(--accent)" : isToday ? "1.5px solid var(--accent)" : "1px solid transparent",
                cursor: hasTx ? "pointer" : "default",
                transition: "all 0.15s",
              }}
              title={amount > 0 ? `${cell.day}: Rp ${amount.toLocaleString("id-ID")}` : `${cell.day}: No expenses`}
            >
              <span style={{
                fontSize: 14, fontWeight: isToday ? 700 : 500,
                color: isToday ? "var(--accent)" : "var(--text)", lineHeight: 1,
              }}>
                {cell.day}
              </span>
              {amount > 0 && (
                <span style={{ fontSize: 15, color: color.text, fontWeight: 600, lineHeight: 1.2 }}>
                  {fmtShort(amount)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend + Summary */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 6 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            ["#00d084", "<30"],
            ["#fbbf24", "30-50"],
            ["#ff4d6d", ">50"],
          ].map(([c, l]) => (
            <span key={l} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 14, color: "var(--muted)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: c }} />
              {l}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>{activeDays} active days</span>
          <span className="mono" style={{ fontSize: 14, color: "var(--muted)" }}>avg Rp {fmtShort(avgPerDay)}</span>
        </div>
      </div>
    </div>
  );
}
