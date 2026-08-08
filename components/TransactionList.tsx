"use client";
import { useState } from "react";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[]; onDelete: (id: string) => void; selectedDate?: string | null; onClearDate?: () => void; onEdit?: (tx: Transaction) => void }

const ICONS: Record<string, string> = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎮",
  Bills: "🧾", Health: "💊", Kos: "🏠", Other: "📦", Salary: "💼", Freelance: "💻", Investment: "📈",
  Tabungan: "🏦", "Dana Darurat": "🛡️", "E-Money": "💳", "Pakai E-Money": "💳", "Tarik Tunai": "🏧",
};

const EXPENSE_FILTERS = ["All", "Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Kos", "Other"] as const;

export default function TransactionList({ transactions, onDelete, selectedDate, onClearDate, onEdit }: Props) {
  const [filterCat, setFilterCat] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const selectedTotal = transactions.filter(t => selected.has(t.id)).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="tx-list-container" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", maxHeight: 560, display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
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
        {selected.size > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            marginTop: 8, padding: "8px 12px", borderRadius: 10,
            background: "rgba(124,107,255,0.12)", border: "1px solid rgba(124,107,255,0.35)",
          }}>
            <p style={{ fontSize: 12, color: "var(--text)" }}>
              <span className="mono" style={{ fontWeight: 600, color: "var(--accent)" }}>{selected.size}</span> dipilih · Total{" "}
              <span className="mono" style={{ fontWeight: 600, color: "var(--accent)" }}>{fmt(selectedTotal)}</span>
            </p>
            <button onClick={clearSelection} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--muted)", fontSize: 11, fontFamily: "Inter, sans-serif",
            }}>✕ Batal</button>
          </div>
        )}
      </div>

      <div className="tx-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0, scrollBehavior: "smooth" }}>
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
                {txs.map(t => {
                  const isSelected = selected.has(t.id);
                  return (
                  <div key={t.id} className="tx-row" onClick={() => toggleSelect(t.id)} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 10,
                    transition: "background 0.15s", cursor: "pointer",
                    background: isSelected ? "rgba(124,107,255,0.15)" : "transparent",
                    border: isSelected ? "1px solid rgba(124,107,255,0.35)" : "1px solid transparent",
                  }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--surface2)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      background: isSelected ? "var(--accent)" : "var(--surface2)",
                      border: isSelected ? "none" : "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: "#000",
                    }}>
                      {isSelected ? "✓" : ""}
                    </div>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: t.type === "income" ? "var(--green-dim)" : t.type === "saving" ? "var(--accent-dim)" : t.type === "transfer" ? "rgba(59,130,246,0.15)" : t.type === "cash_withdrawal" ? "rgba(245,158,11,0.15)" : "var(--surface2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {ICONS[t.category] || "📦"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</p>
                      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{t.category}</p>
                    </div>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: t.type === "income" ? "var(--green)" : t.type === "saving" ? "var(--accent)" : t.type === "transfer" ? "#60a5fa" : t.type === "cash_withdrawal" ? "#fbbf24" : "var(--red)", flexShrink: 0 }}>
                      {t.type === "income" ? "+" : t.type === "cash_withdrawal" ? "~" : "-"}{fmt(t.amount)}
                    </span>
                    <button onClick={e => { e.stopPropagation(); onEdit?.(t); }} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--muted)", fontSize: 12, padding: "4px",
                      opacity: 0, transition: "opacity 0.15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "var(--accent)"; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = "0"; e.currentTarget.style.color = "var(--muted)"; }}
                    >✎</button>
                    <button onClick={e => { e.stopPropagation(); onDelete(t.id); }} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--muted)", fontSize: 12, padding: "4px",
                      opacity: 0, transition: "opacity 0.15s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "var(--red)"; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = "0"; e.currentTarget.style.color = "var(--muted)"; }}
                    >✕</button>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      <style>{`
        .tx-scroll::-webkit-scrollbar { width: 4px; }
        .tx-scroll::-webkit-scrollbar-track { background: transparent; }
        .tx-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .filter-scroll::-webkit-scrollbar { height: 0; }
      `}</style>
    </div>
  );
}
