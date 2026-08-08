"use client";
import { useState } from "react";

interface Props { initialBalance?: number; onClose: () => void }

const formatRupiah = (val: string): string => {
  const nums = val.replace(/\D/g, "");
  if (!nums) return "";
  return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

interface Entry { label: string; amount: number; sign: 1 | -1 }

export default function NetBalanceCalculator({ initialBalance = 0, onClose }: Props) {
  const [start, setStart] = useState(formatRupiah(String(initialBalance)));
  const [opAmountDisplay, setOpAmountDisplay] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);

  const startValue = Number(start.replace(/\D/g, "")) || 0;
  const opValue = Number(opAmountDisplay.replace(/\D/g, "")) || 0;

  const apply = (sign: 1 | -1) => {
    if (!opValue) return;
    setEntries([...entries, { label: `${sign === 1 ? "+" : "−"} ${formatRupiah(String(opValue))}`, amount: opValue, sign }]);
    setOpAmountDisplay("");
  };

  const result = entries.reduce((s, e) => s + (e.sign === 1 ? e.amount : -e.amount), startValue);

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const inputStyle = {
    width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "var(--text)",
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
        borderRadius: 16, width: "100%", maxWidth: 420,
        padding: "20px 24px 24px",
        animation: "slideUp 0.25s ease",
      }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(124,107,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
              🧮
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Net Balance Calculator</p>
              <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                Hitung cuma-cuma — tidak mengubah data
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <label style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nilai awal net balance</label>
          <input value={start} onChange={e => setStart(formatRupiah(e.target.value))} placeholder="0" className="mono" style={{ ...inputStyle, fontSize: 16 }} />
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <input
            type="text"
            inputMode="numeric"
            value={opAmountDisplay}
            onChange={e => setOpAmountDisplay(formatRupiah(e.target.value))}
            placeholder="Jumlah"
            className="mono"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={() => apply(1)} disabled={!opValue} style={{
            padding: "10px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "var(--green)", color: "#000", fontSize: 16, fontWeight: 700,
            fontFamily: "Inter, sans-serif", opacity: !opValue ? 0.5 : 1,
          }}>+</button>
          <button onClick={() => apply(-1)} disabled={!opValue} style={{
            padding: "10px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            background: "var(--red)", color: "#fff", fontSize: 16, fontWeight: 700,
            fontFamily: "Inter, sans-serif", opacity: !opValue ? 0.5 : 1,
          }}>−</button>
        </div>

        <div style={{
          background: "linear-gradient(135deg, rgba(124,107,255,0.12) 0%, rgba(124,107,255,0.05) 100%)",
          border: "1px solid rgba(124,107,255,0.3)", borderRadius: 10, padding: "12px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Hasil</p>
            <button onClick={() => setEntries([])} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--muted)", fontSize: 10, fontFamily: "Inter, sans-serif",
            }}>↺ Reset</button>
          </div>
          <p className="mono" style={{ fontSize: 22, fontWeight: 600, color: result >= 0 ? "var(--green)" : "var(--red)" }}>
            {fmt(result)}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8, maxHeight: 80, overflowY: "auto" }}>
            {entries.map((e, i) => (
              <span key={i} style={{
                fontSize: 10, color: "var(--muted)",
                background: "var(--surface2)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "2px 8px",
              }}>
                {e.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
