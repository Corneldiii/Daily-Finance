"use client";

import { useState, useEffect } from "react";
import { Installment, InstallmentType, MonthlyInstallmentSummary } from "@/types";

interface Props {
  month: string;
}

const TENURE_OPTIONS = [3, 6, 12, 24];
const INSTALLMENT_TYPES: InstallmentType[] = ["Electronics", "Furniture", "Vehicle", "Education", "Fashion", "Health", "Subscription", "Other"];

const TYPE_ICONS: Record<string, string> = {
  Electronics: "📱", Furniture: "🛋️", Vehicle: "🚗", Education: "📚",
  Fashion: "👗", Health: "💊", Subscription: "🔄", Other: "📦",
};

const STORAGE_KEY = "finance_installments";

function calcMonthlyPayment(total: number, tenure: number, interestRate: number): number {
  if (interestRate === 0) return Math.ceil(total / tenure);
  const monthlyRate = interestRate / 100 / 12;
  const payment = total * (monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
  return Math.ceil(payment);
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(monthKey: string, n: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function InstallmentTracker({ month }: Props) {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [totalAmountDisplay, setTotalAmountDisplay] = useState("");
  const [tenure, setTenure] = useState<number>(3);
  const [customTenure, setCustomTenure] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<InstallmentType>("Electronics");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setInstallments(JSON.parse(saved));
    } catch {}
  }, []);

  const saveInstallments = (items: Installment[]) => {
    setInstallments(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const formatRupiah = (val: string): string => {
    const nums = val.replace(/\D/g, "");
    if (!nums) return "";
    return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setTotalAmount(raw);
    setTotalAmountDisplay(formatRupiah(raw));
  };

  const resetForm = () => {
    setName(""); setTotalAmount(""); setTotalAmountDisplay("");
    setTenure(3); setCustomTenure(""); setInterestRate("");
    setSource(""); setDescription(""); setType("Electronics");
  };

  const addInstallment = () => {
    const total = Number(totalAmount);
    const actualTenure = customTenure ? Number(customTenure) : tenure;
    if (!name.trim() || !total || actualTenure <= 0) return;

    const interest = Number(interestRate) || 0;
    const monthly = calcMonthlyPayment(total, actualTenure, interest);

    const item: Installment = {
      id: Date.now().toString(),
      name: name.trim(),
      totalAmount: total,
      tenure: actualTenure,
      interestRate: interest,
      monthlyPayment: monthly,
      source: source.trim() || "Unknown",
      description: description.trim(),
      type,
      startDate: month + "-01",
      paidMonths: [],
    };

    saveInstallments([...installments, item]);
    resetForm();
    setShowForm(false);
  };

  const togglePaid = (installmentId: string, monthKey: string) => {
    const updated = installments.map(inst => {
      if (inst.id !== installmentId) return inst;
      const paid = inst.paidMonths.includes(monthKey);
      return {
        ...inst,
        paidMonths: paid
          ? inst.paidMonths.filter(m => m !== monthKey)
          : [...inst.paidMonths, monthKey],
      };
    });
    saveInstallments(updated);
  };

  const deleteInstallment = (id: string) => {
    saveInstallments(installments.filter(i => i.id !== id));
  };

  const getRemainingBalance = (inst: Installment): number => {
    const startMonth = getMonthKey(inst.startDate);
    const monthsElapsed = (() => {
      let count = 0;
      let cur = startMonth;
      while (cur <= month) {
        count++;
        cur = addMonths(cur, 1);
      }
      return Math.max(count, 0);
    })();
    const remaining = inst.totalAmount - (monthsElapsed * inst.monthlyPayment);
    return Math.max(remaining, 0);
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const nextMonth = addMonths(month, 1);

  const getMonthSummary = (monthKey: string): MonthlyInstallmentSummary => {
    const active = installments.filter(inst => {
      const startMonth = getMonthKey(inst.startDate);
      const endMonth = addMonths(startMonth, inst.tenure - 1);
      return startMonth <= monthKey && endMonth >= monthKey;
    });

    const items = active.map(inst => ({
      name: inst.name,
      amount: inst.monthlyPayment,
      description: inst.description || inst.source,
    }));

    const totalAmount = items.reduce((s, i) => s + i.amount, 0);

    const remainingBalance = active.reduce((s, inst) => {
      return s + getRemainingBalance(inst);
    }, 0);

    return { month: monthKey, installments: items, totalAmount, remainingBalance };
  };

  const currentSummary = getMonthSummary(month);
  const nextSummary = getMonthSummary(nextMonth);

  const inputStyle = {
    width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--text)",
    outline: "none", fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "14px 14px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12 }}>💳</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Installments</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)",
            background: showForm ? "var(--red-dim)" : "var(--surface2)",
            color: showForm ? "var(--red)" : "var(--text)", fontSize: 13,
            cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{
          background: "var(--surface2)", borderRadius: 10, padding: 14, marginBottom: 12,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Name *</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. iPhone 16, Laptop..."
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Amount (IDR) *</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted)", pointerEvents: "none" }}>Rp</span>
                <input
                  type="text" inputMode="numeric"
                  value={totalAmountDisplay} onChange={handleAmountChange}
                  placeholder="0" className="mono"
                  style={{ ...inputStyle, paddingLeft: 36, fontSize: 14 }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Interest (%)</label>
              <input
                type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)}
                placeholder="0 (optional)" min="0" step="0.1"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tenure (months) *</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TENURE_OPTIONS.map(t => (
                <button key={t} onClick={() => { setTenure(t); setCustomTenure(""); }}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: "1px solid",
                    borderColor: tenure === t && !customTenure ? "var(--accent)" : "var(--border)",
                    background: tenure === t && !customTenure ? "var(--accent-dim)" : "transparent",
                    color: tenure === t && !customTenure ? "var(--accent)" : "var(--muted)",
                    fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}
                >{t} mo</button>
              ))}
              <input
                type="number" value={customTenure} onChange={e => { setCustomTenure(e.target.value); setTenure(0); }}
                placeholder="Custom" min="1"
                style={{ ...inputStyle, width: 90, padding: "6px 10px" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Source *</label>
              <input
                value={source} onChange={e => setSource(e.target.value)}
                placeholder="e.g. Tokopedia, Bank..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Type</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {INSTALLMENT_TYPES.map(t => (
                  <button key={t} onClick={() => setType(t)}
                    style={{
                      padding: "4px 8px", borderRadius: 6, border: "1px solid",
                      borderColor: type === t ? "var(--accent)" : "var(--border)",
                      background: type === t ? "var(--accent-dim)" : "transparent",
                      color: type === t ? "var(--accent)" : "var(--muted)",
                      fontSize: 11, cursor: "pointer", fontFamily: "Inter, sans-serif",
                    }}
                  >{TYPE_ICONS[t]} {t}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</label>
            <input
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What is this installment for?"
              style={inputStyle}
            />
          </div>

          {totalAmount && Number(customTenure || tenure) > 0 && (
            <div style={{
              background: "rgba(124,107,255,0.08)", border: "1px solid rgba(124,107,255,0.2)",
              borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "var(--text)",
            }}>
              Monthly payment: <strong className="mono">{fmt(calcMonthlyPayment(Number(totalAmount), customTenure ? Number(customTenure) : tenure, Number(interestRate) || 0))}</strong>
              {" × "}{customTenure || tenure} months
              {Number(interestRate) > 0 && <span style={{ color: "var(--muted)" }}> ({interestRate}% interest)</span>}
            </div>
          )}

          <button onClick={addInstallment} disabled={!name.trim() || !totalAmount}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
              background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "Inter, sans-serif",
              opacity: !name.trim() || !totalAmount ? 0.5 : 1,
            }}
          >Add Installment</button>
        </div>
      )}

      {/* Monthly Summary */}
      {(currentSummary.installments.length > 0 || nextSummary.installments.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{
            background: "var(--surface2)", borderRadius: 10, padding: "10px 12px",
          }}>
            <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>This Month</p>
            <p className="mono" style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{fmt(currentSummary.totalAmount)}</p>
            <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
              {currentSummary.installments.length} installment{currentSummary.installments.length !== 1 ? "s" : ""}
            </p>
            {currentSummary.installments.length > 0 && (
              <div style={{ marginTop: 6, borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                {currentSummary.installments.map((inst, i) => (
                  <p key={i} style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4 }}>
                    {inst.name}: <span className="mono">{fmt(inst.amount)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
          <div style={{
            background: "var(--surface2)", borderRadius: 10, padding: "10px 12px",
          }}>
            <p style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Next Month</p>
            <p className="mono" style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{fmt(nextSummary.totalAmount)}</p>
            <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
              {nextSummary.installments.length} installment{nextSummary.installments.length !== 1 ? "s" : ""}
            </p>
            <p style={{ fontSize: 10, color: "var(--accent)", marginTop: 4 }}>
              Remaining: <span className="mono">{fmt(nextSummary.remainingBalance)}</span>
            </p>
            {nextSummary.installments.length > 0 && (
              <div style={{ marginTop: 6, borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                {nextSummary.installments.map((inst, i) => (
                  <p key={i} style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.4 }}>
                    {inst.name}: <span className="mono">{fmt(inst.amount)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Installment List */}
      {installments.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
          No installments yet. Add one above.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {installments.map(inst => {
            const startMonth = getMonthKey(inst.startDate);
            const endMonth = addMonths(startMonth, inst.tenure - 1);
            const isActive = startMonth <= month && endMonth >= month;
            const isPaid = inst.paidMonths.includes(month);
            const remaining = getRemainingBalance(inst);
            const monthsLeft = (() => {
              let count = 0;
              let cur = month;
              while (cur <= endMonth) { count++; cur = addMonths(cur, 1); }
              return Math.max(count, 0);
            })();

            return (
              <div key={inst.id} style={{
                padding: "10px 12px", borderRadius: 8,
                background: isPaid ? "rgba(0,208,132,0.06)" : isActive ? "rgba(251,191,36,0.06)" : "rgba(0,0,0,0.03)",
                border: `1px solid ${isPaid ? "rgba(0,208,132,0.2)" : isActive ? "rgba(251,191,36,0.2)" : "var(--border)"}`,
                opacity: !isActive ? 0.5 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{TYPE_ICONS[inst.type] || "📦"}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inst.name}</p>
                        {isPaid && <span style={{ fontSize: 9, background: "var(--green-dim)", color: "var(--green)", padding: "1px 6px", borderRadius: 8 }}>PAID</span>}
                        {!isActive && <span style={{ fontSize: 9, background: "var(--surface2)", color: "var(--muted)", padding: "1px 6px", borderRadius: 8 }}>DONE</span>}
                      </div>
                      <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                        {inst.source} • {inst.type}{inst.description ? ` • ${inst.description}` : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <p className="mono" style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{fmt(inst.monthlyPayment)}/mo</p>
                      {isActive && (
                        <p style={{ fontSize: 9, color: "var(--muted)" }}>
                          {monthsLeft} mo left • {fmt(remaining)}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <button
                        onClick={() => togglePaid(inst.id, month)}
                        style={{
                          width: 28, height: 28, borderRadius: 6, border: "1px solid",
                          borderColor: isPaid ? "var(--green)" : "var(--border)",
                          background: isPaid ? "var(--green)" : "transparent",
                          color: isPaid ? "#fff" : "var(--muted)",
                          cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title={isPaid ? "Mark as unpaid" : "Mark as paid"}
                      >✓</button>
                    )}
                    <button
                      onClick={() => deleteInstallment(inst.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--muted)", fontSize: 12, padding: 2,
                      }}
                      title="Delete installment"
                    >✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
