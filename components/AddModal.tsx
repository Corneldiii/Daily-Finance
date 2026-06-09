"use client";
import { useState } from "react";
import { Category, Transaction, TransactionType } from "@/types";

interface Props { onClose: () => void; onAdd: (t: Omit<Transaction, "id">) => Promise<void> }

const EXPENSE_CATS: Category[] = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Other"];
const INCOME_CATS: Category[] = ["Salary", "Freelance", "Investment", "Other"];

const ICONS: Record<string, string> = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎮",
  Bills: "🧾", Health: "💊", Other: "📦", Salary: "💼", Freelance: "💻", Investment: "📈",
};

export default function AddModal({ onClose, onAdd }: Props) {
  const [type, setType] = useState<TransactionType>("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const cats = type === "expense" ? EXPENSE_CATS : INCOME_CATS;

  const handleType = (t: TransactionType) => {
    setType(t);
    setCategory(t === "expense" ? "Food" : "Salary");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !amount || isNaN(Number(amount))) return;
    setLoading(true);
    await onAdd({ title: title.trim(), amount: Number(amount), type, category, date });
    setLoading(false);
    onClose();
  };

  const inputStyle = {
    width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--text)",
    outline: "none", fontFamily: "DM Sans, sans-serif",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      zIndex: 50, padding: "0",
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border2)",
        borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480,
        padding: "24px 24px 40px",
        animation: "slideUp 0.25s ease",
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

        <div style={{ width: 36, height: 4, background: "var(--border2)", borderRadius: 2, margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>New Transaction</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 8, background: "var(--surface2)", padding: 4, borderRadius: 12, marginBottom: 20 }}>
          {(["expense", "income"] as TransactionType[]).map(t => (
            <button key={t} onClick={() => handleType(t)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, fontFamily: "DM Sans, sans-serif",
              background: type === t ? (t === "expense" ? "var(--red)" : "var(--green)") : "transparent",
              color: type === t ? "#fff" : "var(--muted)",
              transition: "all 0.2s",
            }}>
              {t === "expense" ? "↑ Expense" : "↓ Income"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lunch, Salary..." style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount (IDR)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="mono" style={{ ...inputStyle, fontSize: 15 }} />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding: "6px 12px", borderRadius: 8, border: "1px solid",
                  borderColor: category === c ? (type === "expense" ? "var(--red)" : "var(--green)") : "var(--border)",
                  background: category === c ? (type === "expense" ? "var(--red-dim)" : "var(--green-dim)") : "transparent",
                  color: category === c ? "var(--text)" : "var(--muted)",
                  fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                  transition: "all 0.15s",
                }}>
                  {ICONS[c]} {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || !title || !amount} style={{
          width: "100%", marginTop: 20, padding: "13px 0", borderRadius: 12, border: "none",
          background: type === "expense" ? "var(--red)" : "var(--green)",
          color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer",
          fontFamily: "DM Sans, sans-serif", opacity: loading || !title || !amount ? 0.5 : 1,
          transition: "opacity 0.2s",
        }}>
          {loading ? "Saving..." : `Add ${type === "expense" ? "Expense" : "Income"}`}
        </button>
      </div>
    </div>
  );
}