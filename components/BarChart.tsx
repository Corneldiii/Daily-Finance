"use client";

import { useState } from "react";
import { Transaction } from "@/types";
import { localDateKey } from "@/utils/date";

interface Props {
  transactions: Transaction[];
  month: string;
}

export default function BarChart({ transactions, month }: Props) {
  const [dailyFoodBudget, setDailyFoodBudget] = useState(30000);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
    };
  });

  const data = months.map(({ key, label }) => {
    const txs = transactions.filter((t) => t.date.startsWith(key));
    return {
      label,
      income: txs
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
      expense: txs
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    };
  });

  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);

  const fmtRp = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const today = new Date();
  const todayKey = localDateKey();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const daysLeft = Math.ceil(
    (nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();

  const todayExpenses = transactions
    .filter(t => t.date === todayKey && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));
  const monthExpenses = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const foodSpent = monthTxs.filter(t => t.type === "expense" && t.category === "Food").reduce((s, t) => s + t.amount, 0);
  const monthlyBudget = dailyFoodBudget * daysInMonth;
  const foodBudgetPct = monthlyBudget > 0 ? Math.min((foodSpent / monthlyBudget) * 100, 100) : 0;

  const untilDate = nextMonth.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "20px 24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
            Cash Flow
          </p>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
            Last 6 months
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            ["var(--green)", "Income"],
            ["var(--red)", "Expenses"],
          ].map(([c, l]) => (
            <span
              key={l}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "var(--muted)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 2,
                  background: c as string,
                  display: "inline-block",
                }}
              />
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          minHeight: 100,
        }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 3,
                alignItems: "flex-end",
                height: 96,
                width: "100%",
              }}
            >
              <div
                style={{
                  flex: 1,
                  borderRadius: "3px 3px 0 0",
                  background: "var(--green)",
                  opacity: 0.8,
                  height: `${(d.income / max) * 100}%`,
                  minHeight: d.income > 0 ? 3 : 0,
                  transition: "height 0.6s ease",
                }}
                title={fmtRp(d.income)}
              />
              <div
                style={{
                  flex: 1,
                  borderRadius: "3px 3px 0 0",
                  background: "var(--red)",
                  opacity: 0.8,
                  height: `${(d.expense / max) * 100}%`,
                  minHeight: d.expense > 0 ? 3 : 0,
                  transition: "height 0.6s ease",
                }}
                title={fmtRp(d.expense)}
              />
            </div>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              {d.label}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--border)",
          marginTop: 20,
          paddingTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Pengeluaran Hari Ini */}
        <div style={{
          background: "rgba(0,0,0,0.04)", borderRadius: 10, padding: "14px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Today&apos;s Expenses</span>
            <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
              {fmtRp(todayExpenses)}
            </span>
          </div>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {today.toLocaleDateString("en-US", { day: "numeric", month: "short" })}
          </span>
        </div>

        {/* Food Budget Section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: "#E1F5EE",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: 15,
            }}>🍜</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Food Budget</p>
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                {daysLeft} days left in {today.toLocaleString("en-US", { month: "long" })}
              </p>
            </div>
            <div style={{ position: "relative", width: 140 }}>
              <span style={{
                position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                fontSize: 11, color: "var(--muted)", pointerEvents: "none",
              }}>Rp</span>
              <input
                type="number"
                value={dailyFoodBudget}
                onChange={(e) => setDailyFoodBudget(Number(e.target.value))}
                style={{
                  width: "100%", padding: "8px 10px 8px 30px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text)", fontSize: 12, outline: "none",
                  WebkitAppearance: "none", MozAppearance: "textfield",
                } as React.CSSProperties}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{
              background: "rgba(0,0,0,0.04)", borderRadius: 10, padding: "12px 14px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>📅 Days Left</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#0F6E56", letterSpacing: "-0.02em" }}>{daysLeft}</span>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>of {daysInMonth} days</span>
            </div>
            <div style={{
              background: "rgba(0,0,0,0.04)", borderRadius: 10, padding: "12px 14px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>🎯 Budget Until</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>{untilDate}</span>
              <span style={{ fontSize: 9, color: "var(--muted)" }}>
                {fmtRp(monthlyBudget)}/mo
              </span>
            </div>
          </div>
        </div>

        {/* Food Progress Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Food spent this month</span>
            <strong className="mono" style={{ fontSize: 13, color: "var(--text)" }}>
              {fmtRp(foodSpent)} / {fmtRp(monthlyBudget)}
            </strong>
          </div>
          <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${foodBudgetPct.toFixed(1)}%`,
              background: foodBudgetPct >= 80 ? "#ef4444" : foodBudgetPct >= 50 ? "#f97316" : "#1D9E75",
              borderRadius: 99, transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              {Math.round(foodBudgetPct)}% used
            </span>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              {fmtRp(monthlyBudget - foodSpent)} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
