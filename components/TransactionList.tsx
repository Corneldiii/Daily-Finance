"use client";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[]; onDelete: (id: string) => void }

const ICONS: Record<string, string> = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎮",
  Bills: "🧾", Health: "💊", Other: "📦", Salary: "💼", Freelance: "💻", Investment: "📈",
};

export default function TransactionList({ transactions, onDelete }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const grouped = sorted.reduce<Record<string, Transaction[]>>((acc, t) => {
    const d = new Date(t.date);
    const key = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Transactions</p>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sorted.length} records this month</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ fontSize: 24, marginBottom: 8 }}>💸</p>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>No transactions yet</p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, opacity: 0.6 }}>Add your first transaction above</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <p style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.05em", marginBottom: 10, textTransform: "uppercase" }}>{date}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {txs.map(t => (
                  <div key={t.id} className="tx-row" style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 10,
                    transition: "background 0.15s", cursor: "default",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: t.type === "income" ? "var(--green-dim)" : "var(--surface2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {ICONS[t.category] || "📦"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{t.category}</p>
                    </div>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: t.type === "income" ? "var(--green)" : "var(--red)", flexShrink: 0 }}>
                      {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                    </span>
                    <button onClick={() => onDelete(t.id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--muted)", fontSize: 12, padding: "4px",
                      opacity: 0, transition: "opacity 0.15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "var(--red)"; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = "0"; e.currentTarget.style.color = "var(--muted)"; }}
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}