"use client";
import { useState } from "react";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[]; onDelete: (id: string) => void; selectedDate?: string | null; onClearDate?: () => void; onEdit?: (tx: Transaction) => void }

const ICONS: Record<string, string> = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎮",
  Bills: "🧾", Health: "💊", Kos: "🏠", Other: "📦", Salary: "💼", Freelance: "💻", Investment: "📈",
  Tabungan: "🏦", "Dana Darurat": "🛡️",
};

const EXPENSE_FILTERS = ["All", "Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Kos", "Other"] as const;

export default function TransactionList({ transactions, onDelete, selectedDate, onClearDate, onEdit }: Props) {
  const [filterCat, setFilterCat] = useState<string>("All");
  const [search, setSearch] = useState("");

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const filtered = transactions
    .filter(t => filterCat === "All" || t.category === filterCat)
    .filter(t => !selectedDate || t.date === selectedDate)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const grouped = sorted.reduce<Record<string, Transaction[]>>((acc, t) => {
    const d = new Date(t.date);
    const key = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="tx-list-container" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", maxHeight: 480, overflowY: "auto", scrollBehavior: "smooth" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Transactions</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {selectedDate
                ? `${new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${sorted.length} records`
                : `${sorted.length} records this month`
              }
            </p>
          </div>
          {selectedDate && (
            <button onClick={() => onClearDate?.()} style={{
              padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--surface2)", color: "var(--muted)", fontSize: 11,
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              ✕ Clear date
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }} className="filter-scroll">
          {EXPENSE_FILTERS.map(f => (
            <button key={f} onClick={() => setFilterCat(f)} style={{
              padding: "5px 12px", borderRadius: 20, border: "1px solid",
              borderColor: filterCat === f ? "var(--accent)" : "var(--border)",
              background: filterCat === f ? "var(--accent-dim)" : "transparent",
              color: filterCat === f ? "var(--accent)" : "var(--muted)",
              fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              fontFamily: "Inter, sans-serif", transition: "all 0.15s",
            }}>
              {f !== "All" && `${ICONS[f] || ""} `}{f}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", marginTop: 8 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--muted)" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            style={{
              width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "7px 10px 7px 30px", fontSize: 12, color: "var(--text)",
              outline: "none", fontFamily: "Inter, sans-serif",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12,
            }}>✕</button>
          )}
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
                      background: t.type === "income" ? "var(--green-dim)" : t.type === "saving" ? "var(--accent-dim)" : "var(--surface2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {ICONS[t.category] || "📦"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{t.category}</p>
                    </div>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: t.type === "income" ? "var(--green)" : t.type === "saving" ? "var(--accent)" : "var(--red)", flexShrink: 0 }}>
                      {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                    </span>
                    <button onClick={() => onEdit?.(t)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--muted)", fontSize: 12, padding: "4px",
                      opacity: 0, transition: "opacity 0.15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "var(--accent)"; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = "0"; e.currentTarget.style.color = "var(--muted)"; }}
                    >✎</button>
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

      <style>{`
        .tx-list-container::-webkit-scrollbar { width: 4px; }
        .tx-list-container::-webkit-scrollbar-track { background: transparent; }
        .tx-list-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .filter-scroll::-webkit-scrollbar { height: 0; }
      `}</style>
    </div>
  );
}
