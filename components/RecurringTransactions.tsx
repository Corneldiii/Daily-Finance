"use client";
import { useState, useEffect } from "react";
import { Category, Transaction, TransactionType } from "@/types";

interface Props {
  month: string;
}

interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  dayOfMonth: number;
  active: boolean;
}

const EXPENSE_CATS: Category[] = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Kos", "Other"];
const INCOME_CATS: Category[] = ["Salary", "Freelance", "Investment", "Other"];

const ICONS: Record<string, string> = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎮",
  Bills: "🧾", Health: "💊", Kos: "🏠", Other: "📦", Salary: "💼", Freelance: "💻", Investment: "📈",
};

const STORAGE_KEY = "finance_recurring";

export default function RecurringTransactions({ month }: Props) {
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<Category>("Food");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  const saveItems = (newItems: RecurringItem[]) => {
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const formatRupiah = (val: string): string => {
    const nums = val.replace(/\D/g, "");
    if (!nums) return "";
    return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setAmount(raw);
    setAmountDisplay(formatRupiah(raw));
  };

  const addItem = () => {
    if (!title.trim() || !amount) return;
    const newItem: RecurringItem = {
      id: Date.now().toString(),
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      dayOfMonth: Math.min(Math.max(Number(dayOfMonth) || 1, 1), 28),
      active: true,
    };
    saveItems([...items, newItem]);
    setTitle("");
    setAmount("");
    setAmountDisplay("");
    setShowForm(false);
  };

  const toggleItem = (id: string) => {
    saveItems(items.map(i => i.id === id ? { ...i, active: !i.active } : i));
  };

  const removeItem = (id: string) => {
    saveItems(items.filter(i => i.id !== id));
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const activeItems = items.filter(i => i.active);
  const inactiveItems = items.filter(i => !i.active);
  const totalMonthly = activeItems.reduce((s, i) => s + i.amount, 0);

  const inputStyle = {
    width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "var(--text)",
    outline: "none", fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(124,107,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
            🔄
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Recurring</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>Auto-generated each month</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {activeItems.length > 0 && (
            <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
              {fmt(totalMonthly)}/mo
            </span>
          )}
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)",
            background: showForm ? "var(--surface2)" : "transparent",
            color: "var(--text)", fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}>
            {showForm ? "✕" : "+ Add"}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 14, marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setType("expense"); setCategory("Food"); }} style={{
              flex: 1, padding: "6px 0", borderRadius: 6, border: "none", fontSize: 12, cursor: "pointer",
              background: type === "expense" ? "var(--red)" : "transparent",
              color: type === "expense" ? "#fff" : "var(--muted)", fontFamily: "Inter, sans-serif",
            }}>↑ Expense</button>
            <button onClick={() => { setType("income"); setCategory("Salary"); }} style={{
              flex: 1, padding: "6px 0", borderRadius: 6, border: "none", fontSize: 12, cursor: "pointer",
              background: type === "income" ? "var(--green)" : "transparent",
              color: type === "income" ? "#fff" : "var(--muted)", fontFamily: "Inter, sans-serif",
            }}>↓ Income</button>
          </div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (e.g. Rent, Netflix)" style={inputStyle} />
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--muted)", pointerEvents: "none" }}>Rp</span>
            <input type="text" inputMode="numeric" value={amountDisplay} onChange={handleAmountChange} placeholder="Amount" className="mono" style={{ ...inputStyle, paddingLeft: 30 }} />
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Day:</span>
            <input type="number" min={1} max={28} value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} style={{ ...inputStyle, width: 50, textAlign: "center" }} />
            <div style={{ display: "flex", gap: 4, flex: 1, overflowX: "auto" }} className="filter-scroll">
              {(type === "expense" ? EXPENSE_CATS : INCOME_CATS).map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding: "3px 8px", borderRadius: 6, border: "1px solid",
                  borderColor: category === c ? "var(--accent)" : "var(--border)",
                  background: category === c ? "var(--accent-dim)" : "transparent",
                  color: category === c ? "var(--accent)" : "var(--muted)",
                  fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "Inter, sans-serif",
                }}>{ICONS[c]} {c}</button>
              ))}
            </div>
          </div>
          <button onClick={addItem} disabled={!title.trim() || !amount} style={{
            padding: "8px 0", borderRadius: 8, border: "none",
            background: type === "expense" ? "var(--red)" : "var(--green)",
            color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer",
            fontFamily: "Inter, sans-serif", opacity: !title.trim() || !amount ? 0.5 : 1,
          }}>Add Recurring</button>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>
          No recurring transactions yet
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {activeItems.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8,
              background: "rgba(0,0,0,0.03)", border: "1px solid var(--border)",
              opacity: 1, transition: "opacity 0.2s",
            }}>
              <span style={{ fontSize: 14 }}>{ICONS[item.category] || "📦"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                <p style={{ fontSize: 10, color: "var(--muted)" }}>Day {item.dayOfMonth} · {item.category}</p>
              </div>
              <span className="mono" style={{ fontSize: 12, color: item.type === "income" ? "var(--green)" : "var(--red)", flexShrink: 0 }}>
                {item.type === "income" ? "+" : "-"}{fmt(item.amount)}
              </span>
              <button onClick={() => toggleItem(item.id)} title="Disable" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--green)", fontSize: 12, padding: 2 }}>●</button>
              <button onClick={() => removeItem(item.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, padding: 2 }}>✕</button>
            </div>
          ))}
          {inactiveItems.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8,
              background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)",
              opacity: 0.5,
            }}>
              <span style={{ fontSize: 14 }}>{ICONS[item.category] || "📦"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "line-through" }}>{item.title}</p>
                <p style={{ fontSize: 10, color: "var(--muted)" }}>Day {item.dayOfMonth} · {item.category}</p>
              </div>
              <span className="mono" style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>{fmt(item.amount)}</span>
              <button onClick={() => toggleItem(item.id)} title="Enable" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, padding: 2 }}>○</button>
              <button onClick={() => removeItem(item.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, padding: 2 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .filter-scroll::-webkit-scrollbar { height: 0; }
      `}</style>
    </div>
  );
}
