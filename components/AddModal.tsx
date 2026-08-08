"use client";
import { useState } from "react";
import { Category, Transaction, TransactionType } from "@/types";
import { localDateKey } from "@/utils/date";

interface Props { onClose: () => void; onAdd: (t: Omit<Transaction, "id">) => Promise<void>; editData?: Transaction | null; onEdit?: (id: string, t: Omit<Transaction, "id">) => Promise<void> }

const EXPENSE_CATS: Category[] = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Kos", "Pakai E-Money", "Other"];
const INCOME_CATS: Category[] = ["Salary", "Freelance", "Investment", "Other"];
const SAVING_CATS: Category[] = ["Tabungan", "Investasi", "Dana Darurat", "Other"];
const TRANSFER_CATS: Category[] = ["E-Money", "Other"];
const CASH_WITHDRAWAL_CATS: Category[] = ["Tarik Tunai", "Other"];

const ICONS: Record<string, string> = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎮",
  Bills: "🧾", Health: "💊", Kos: "🏠", Other: "📦", Salary: "💼", Freelance: "💻", Investment: "📈",
  Tabungan: "🏦", "Dana Darurat": "🛡️", "E-Money": "💳", "Pakai E-Money": "💳", "Tarik Tunai": "🏧",
};

const TYPE_META: Record<string, { label: string; icon: string; color: string; colorDim: string }> = {
  expense: { label: "↑ Expense", icon: "↑", color: "var(--red)", colorDim: "var(--red-dim)" },
  income: { label: "↓ Income", icon: "↓", color: "var(--green)", colorDim: "var(--green-dim)" },
  saving: { label: "💰 Saving", icon: "💰", color: "var(--accent)", colorDim: "var(--accent-dim)" },
  transfer: { label: "🔄 Transfer", icon: "🔄", color: "#3b82f6", colorDim: "rgba(59,130,246,0.15)" },
  cash_withdrawal: { label: "🏧 Tarik Tunai", icon: "🏧", color: "#f59e0b", colorDim: "rgba(245,158,11,0.15)" },
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
  const [date, setDate] = useState(editData?.date || localDateKey());
  const [adminFee, setAdminFee] = useState(editData?.adminFee !== undefined ? editData.adminFee : true);
  const [loading, setLoading] = useState(false);

  const cats = type === "expense" ? EXPENSE_CATS : type === "saving" ? SAVING_CATS : type === "transfer" ? TRANSFER_CATS : type === "cash_withdrawal" ? CASH_WITHDRAWAL_CATS : INCOME_CATS;
  const meta = TYPE_META[type];

  const allTypes: TransactionType[] = ["expense", "income", "saving", "transfer", "cash_withdrawal"];

  const handleType = (t: TransactionType) => {
    setType(t);
    if (t === "expense") setCategory("Food");
    else if (t === "saving") setCategory("Tabungan");
    else if (t === "transfer") setCategory("E-Money");
    else if (t === "cash_withdrawal") setCategory("Tarik Tunai");
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
    const payload = {
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date,
      adminFee: type === "transfer" ? adminFee : undefined,
    };
    if (editData && onEdit) {
      await onEdit(editData.id, payload);
    } else {
      await onAdd(payload);
    }
    setLoading(false);
    onClose();
  };

  const inputStyle = {
    width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--text)",
    outline: "none", fontFamily: "Inter, sans-serif",
  };

  const typeLabels: Record<string, string> = {
    expense: "↑ Expense",
    income: "↓ Income",
    saving: "💰 Saving",
    transfer: "🔄 Transfer",
    cash_withdrawal: "🏧 Tarik Tunai",
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
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

        <div style={{ width: 36, height: 4, background: "var(--border2)", borderRadius: 2, margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>{editData ? "Edit Transaction" : "New Transaction"}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 4, background: "var(--surface2)", padding: 4, borderRadius: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {allTypes.map(t => (
            <button key={t} onClick={() => handleType(t)} style={{
              flex: "1 1 auto", minWidth: 70, padding: "8px 6px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 500, fontFamily: "Inter, sans-serif",
              background: type === t ? TYPE_META[t].color : "transparent",
              color: type === t ? "#fff" : "var(--muted)",
              transition: "all 0.2s",
            }}>
              {typeLabels[t]}
            </button>
          ))}
        </div>

        {type === "transfer" && (
          <div style={{
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#93c5fd",
          }}>
            Transfer ke E-Money: Net balance berkurang, saldo E-Money bertambah
          </div>
        )}

        {type === "transfer" && category === "E-Money" && (
          <label style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "10px 14px", cursor: "pointer",
          }}>
            <input
              type="checkbox"
              checked={adminFee}
              onChange={e => setAdminFee(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#3b82f6", cursor: "pointer" }}
            />
            <span style={{ fontSize: 12, color: "var(--text)", flex: 1 }}>
              By admin
              <span style={{ display: "block", fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                Potong Rp 1.500 dari saldo yang masuk E-Money
              </span>
            </span>
            <span className="mono" style={{ fontSize: 11, color: "#60a5fa", flexShrink: 0 }}>
              {amount ? `→ ${formatRupiah(String(Math.max(Number(amount) - 1500, 0)))}` : "→ -1.500"}
            </span>
          </label>
        )}

        {type === "expense" && category === "Pakai E-Money" && (
          <div style={{
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#fbbf24",
          }}>
            Pakai E-Money: Saldo E-Money berkurang, net balance tetap
          </div>
        )}

        {type === "cash_withdrawal" && (
          <div style={{
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#fbbf24",
          }}>
            Tarik Tunai: Hanya log, tidak mengurangi net balance
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={
              type === "transfer" ? "e.g. Transfer GoPay, Transfer OVO..." :
              type === "cash_withdrawal" ? "e.g. Tarik Tunai ATM..." :
              "e.g. Lunch, Salary, Tabungan..."
            } style={inputStyle} />
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
            {type === "transfer" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {["Transfer GoPay", "Transfer OVO", "Transfer DANA", "Transfer ShopeePay", "Transfer Moota"].map(t => (
                  <button key={t} onClick={() => setTitle(t)} style={{
                    padding: "5px 10px", borderRadius: 20, border: "1px solid var(--border)",
                    background: title === t ? "rgba(59,130,246,0.15)" : "transparent",
                    color: title === t ? "var(--text)" : "var(--muted)",
                    fontSize: 11, cursor: "pointer", fontFamily: "Inter, sans-serif",
                    transition: "all 0.15s",
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            {type === "expense" && category === "Pakai E-Money" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {["Bayar Transport", "Bayar Tol", "Beli Makan", "Belanja Mini Market", "Lainnya"].map(t => (
                  <button key={t} onClick={() => setTitle(t)} style={{
                    padding: "5px 10px", borderRadius: 20, border: "1px solid var(--border)",
                    background: title === t ? "rgba(245,158,11,0.15)" : "transparent",
                    color: title === t ? "var(--text)" : "var(--muted)",
                    fontSize: 11, cursor: "pointer", fontFamily: "Inter, sans-serif",
                    transition: "all 0.15s",
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            {type === "cash_withdrawal" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {["Tarik Tunai ATM", "Tarik Tunai Indomaret", "Tarik Tunai Alfamart"].map(t => (
                  <button key={t} onClick={() => setTitle(t)} style={{
                    padding: "5px 10px", borderRadius: 20, border: "1px solid var(--border)",
                    background: title === t ? "rgba(245,158,11,0.15)" : "transparent",
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
          {loading ? "Saving..." : editData ? "Save Changes" :
           type === "transfer" ? "Add Transfer" :
           type === "cash_withdrawal" ? "Add Tarik Tunai" :
           type === "saving" ? "Add Saving" : `Add ${type === "expense" ? "Expense" : "Income"}`}
        </button>
      </div>
    </div>
  );
}
