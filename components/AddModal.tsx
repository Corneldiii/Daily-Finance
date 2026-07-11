"use client";
import { useState } from "react";
import { Category, Transaction, TransactionType } from "@/types";

interface Props { onClose: () => void; onAdd: (t: Omit<Transaction, "id">) => Promise<void>; editData?: Transaction | null; onEdit?: (id: string, t: Omit<Transaction, "id">) => Promise<void> }

const EXPENSE_CATS: Category[] = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Kos", "Other"];
const INCOME_CATS: Category[] = ["Salary", "Freelance", "Investment", "Other"];
const SAVING_CATS: Category[] = ["Tabungan", "Investasi", "Dana Darurat", "Other"];

const ICONS: Record<string, string> = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎮",
  Bills: "🧾", Health: "💊", Kos: "🏠", Other: "📦", Salary: "💼", Freelance: "💻", Investment: "📈",
  Tabungan: "🏦", "Dana Darurat": "🛡️",
};

const TYPE_META: Record<string, { label: string; icon: string; color: string; colorDim: string }> = {
  expense: { label: "↑ Expense", icon: "↑", color: "var(--red)", colorDim: "var(--red-dim)" },
  income: { label: "↓ Income", icon: "↓", color: "var(--green)", colorDim: "var(--green-dim)" },
  saving: { label: "💰 Saving", icon: "💰", color: "var(--accent)", colorDim: "var(--accent-dim)" },
};

const formatRupiah = (val: string): string => {
  const nums = val.replace(/\D/g, "");
  if (!nums) return "";
  return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function AddModal({ onClose, onAdd, editData, onEdit }: Props) {
  const [type, setType] = useState<TransactionType>(editData?.type || "expense");
  const [title, setTitle] = useState(editData?.title || "");
  const [amount, setAmount] = useState(editData ? String(editData.amount) : "");
  const [amountDisplay, setAmountDisplay] = useState(editData ? formatRupiah(String(editData.amount)) : "");
  const [category, setCategory] = useState<Category>(editData?.category || "Food");
  const [date, setDate] = useState(editData?.date || new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const cats = type === "expense" ? EXPENSE_CATS : type === "saving" ? SAVING_CATS : INCOME_CATS;
  const meta = TYPE_META[type];

  const handleType = (t: TransactionType) => {
    setType(t);
    if (t === "expense") setCategory("Food");
    else if (t === "saving") setCategory("Tabungan");
    else setCategory("Salary");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setAmount(raw);
    setAmountDisplay(formatRupiah(raw));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !amount || isNaN(Number(amount))) return;
    setLoading(true);
    if (editData && onEdit) {
      await onEdit(editData.id, { title: title.trim(), amount: Number(amount), type, category, date });
    } else {
      await onAdd({ title: title.trim(), amount: Number(amount), type, category, date });
    }
    setLoading(false);
    onClose();
  };

  const inputStyle = {
    width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--text)",
    outline: "none", fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      zIndex: 50,
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border2)",
        borderRadius: "20px 20px 20px 20px", width: "100%", maxWidth: 480,
        padding: "24px 24px 40px",
        animation: "slideUp 0.25s ease",
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

        <div style={{ width: 36, height: 4, background: "var(--border2)", borderRadius: 2, margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>{editData ? "Edit Transaction" : "New Transaction"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 6, background: "var(--surface2)", padding: 4, borderRadius: 12, marginBottom: 20 }}>
          {(["expense", "income", "saving"] as TransactionType[]).map(t => (
            <button key={t} onClick={() => handleType(t)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 500, fontFamily: "Inter, sans-serif",
              background: type === t ? TYPE_META[t].color : "transparent",
              color: type === t ? "#fff" : "var(--muted)",
              transition: "all 0.2s",
            }}>
              {TYPE_META[t].label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lunch, Salary, Tabungan..." style={inputStyle} />
            {type === "expense" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {["Makan Siang", "Makan Malam", "Laundry", "Listrik", "Belanja Bulanan"].map(t => (
                  <button key={t} onClick={() => setTitle(t)} style={{
                    padding: "5px 10px", borderRadius: 20, border: "1px solid var(--border)",
                    background: title === t ? "var(--red-dim)" : "transparent",
                    color: title === t ? "var(--text)" : "var(--muted)",
                    fontSize: 11, cursor: "pointer", fontFamily: "Inter, sans-serif",
                    transition: "all 0.15s",
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            {type === "saving" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {["Tabungan Bulanan", "Dana Darurat", "Investasi"].map(t => (
                  <button key={t} onClick={() => setTitle(t)} style={{
                    padding: "5px 10px", borderRadius: 20, border: "1px solid var(--border)",
                    background: title === t ? "var(--accent-dim)" : "transparent",
                    color: title === t ? "var(--text)" : "var(--muted)",
                    fontSize: 11, cursor: "pointer", fontFamily: "Inter, sans-serif",
                    transition: "all 0.15s",
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount (IDR)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--muted)", pointerEvents: "none" }}>Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountDisplay}
                onChange={handleAmountChange}
                placeholder="0"
                className="mono"
                style={{ ...inputStyle, fontSize: 15, paddingLeft: 44 }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {["10000", "15000", "20000", "25000", "50000"].map(v => (
                <button key={v} onClick={() => { setAmount(v); setAmountDisplay(formatRupiah(v)); }} style={{
                  padding: "5px 10px", borderRadius: 20, border: "1px solid var(--border)",
                  background: amount === v ? meta.colorDim : "transparent",
                  color: amount === v ? "var(--text)" : "var(--muted)",
                  fontSize: 11, cursor: "pointer", fontFamily: "Inter, sans-serif",
                  transition: "all 0.15s",
                }}>
                  {Number(v).toLocaleString("id-ID")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding: "6px 12px", borderRadius: 8, border: "1px solid",
                  borderColor: category === c ? meta.color : "var(--border)",
                  background: category === c ? meta.colorDim : "transparent",
                  color: category === c ? "var(--text)" : "var(--muted)",
                  fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif",
                  transition: "all 0.15s",
                }}>
                  {ICONS[c] || "📦"} {c}
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
          background: meta.color,
          color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer",
          fontFamily: "Inter, sans-serif", opacity: loading || !title || !amount ? 0.5 : 1,
          transition: "opacity 0.2s",
        }}>
          {loading ? "Saving..." : editData ? "Save Changes" : type === "saving" ? "Add Saving" : `Add ${type === "expense" ? "Expense" : "Income"}`}
        </button>
      </div>
    </div>
  );
}
