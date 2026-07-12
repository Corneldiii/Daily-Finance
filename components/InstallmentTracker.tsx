"use client";

import { useState, useEffect } from "react";
import { Installment, InstallmentPayment, InstallmentType } from "@/types";

interface Props {
  month: string;
}

const TENURE_OPTIONS = [3, 6, 12, 24];
const INSTALLMENT_TYPES: InstallmentType[] = ["Electronics", "Furniture", "Vehicle", "Education", "Fashion", "Health", "Subscription", "Other"];

const TYPE_ICONS: Record<string, string> = {
  Electronics: "📱", Furniture: "🛋️", Vehicle: "🚗", Education: "📚",
  Fashion: "👗", Health: "💊", Subscription: "🔄", Other: "📦",
};

function calcMonthlyPayment(total: number, tenure: number, interestRate: number): number {
  if (tenure <= 0) return 0;
  if (interestRate === 0) return Math.ceil(total / tenure);
  return Math.ceil(total * (1 + interestRate / 100) / tenure);
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
  const [payments, setPayments] = useState<InstallmentPayment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAmountDisplay, setPayAmountDisplay] = useState("");

  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [totalAmountDisplay, setTotalAmountDisplay] = useState("");
  const [tenure, setTenure] = useState<number>(3);
  const [customTenure, setCustomTenure] = useState("");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [interestRate, setInterestRate] = useState("");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<InstallmentType>("Electronics");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/installments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInstallments(data.installments || []);
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  const handlePayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setPayAmount(raw);
    setPayAmountDisplay(formatRupiah(raw));
  };

  const resetForm = () => {
    setName(""); setTotalAmount(""); setTotalAmountDisplay("");
    setTenure(3); setCustomTenure(""); setInterestRate("");
    setSource(""); setDescription(""); setType("Electronics");
    setIsUnlimited(false);
  };

  const addInstallment = async () => {
    const total = Number(totalAmount);
    const actualTenure = isUnlimited ? -1 : (customTenure ? Number(customTenure) : tenure);
    if (!name.trim() || !total || !source.trim()) return;
    setError("");
    try {
      const res = await fetch("/api/installments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          totalAmount: total,
          tenure: actualTenure,
          interestRate: Number(interestRate) || 0,
          source: source.trim(),
          description: description.trim(),
          type,
          startDate: month + "-01",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      resetForm();
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const togglePayment = async (installmentId: string, amount: number) => {
    setError("");
    try {
      const res = await fetch(`/api/installments/${installmentId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, monthKey: month }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteInstallment = async (id: string) => {
    setError("");
    try {
      const res = await fetch(`/api/installments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPaymentsForInstallment = (instId: string) =>
    payments.filter(p => p.installmentId === instId);

  const getTotalPaid = (instId: string) =>
    getPaymentsForInstallment(instId).reduce((s, p) => s + p.amount, 0);

  const isPaidThisMonth = (instId: string) =>
    payments.some(p => p.installmentId === instId && p.monthKey === month);

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const nextMonth = addMonths(month, 1);
  const isLimited = (inst: Installment) => inst.tenure > 0;

  const getFixedRemaining = (inst: Installment): { monthsLeft: number; remaining: number } => {
    const monthly = calcMonthlyPayment(inst.totalAmount, inst.tenure, inst.interestRate);
    const totalPaid = getTotalPaid(inst.id);
    const remaining = Math.max(inst.totalAmount * (1 + inst.interestRate / 100) - totalPaid, 0);
    const monthsLeft = monthly > 0 ? Math.ceil(remaining / monthly) : 0;
    return { monthsLeft, remaining };
  };

  const getUnlimitedEstimate = (inst: Installment): { avg: number; monthsLeft: number; totalPaid: number } => {
    const instPayments = getPaymentsForInstallment(inst.id);
    const totalPaid = instPayments.reduce((s, p) => s + p.amount, 0);
    const monthCount = new Set(instPayments.map(p => p.monthKey)).size;
    const avg = monthCount > 0 ? Math.round(totalPaid / monthCount) : 0;
    const remaining = Math.max(inst.totalAmount - totalPaid, 0);
    const monthsLeft = avg > 0 ? Math.ceil(remaining / avg) : 0;
    return { avg, monthsLeft, totalPaid };
  };

  const currentActive = installments.filter(inst => {
    if (isLimited(inst)) {
      const startMonth = getMonthKey(inst.startDate);
      const endMonth = addMonths(startMonth, inst.tenure - 1);
      return startMonth <= month && endMonth >= month;
    }
    return true;
  });

  const inputStyle = {
    width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--text)",
    outline: "none", fontFamily: "Inter, sans-serif",
  };

  if (loading) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 14px" }}>
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>Loading installments...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "14px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12 }}>💳</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Installments</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
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

      {error && <p style={{ fontSize: 11, color: "var(--red)", marginBottom: 8 }}>{error}</p>}

      {showForm && (
        <div style={{
          background: "var(--surface2)", borderRadius: 10, padding: 14, marginBottom: 12,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. iPhone 16, Laptop..." style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Amount (IDR) *</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted)", pointerEvents: "none" }}>Rp</span>
                <input type="text" inputMode="numeric" value={totalAmountDisplay} onChange={handleAmountChange} placeholder="0" className="mono"
                  style={{ ...inputStyle, paddingLeft: 36, fontSize: 14 }} />
              </div>
            </div>
            {!isUnlimited && (
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Interest (%)</label>
                <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="0" min="0" step="0.1" style={inputStyle} />
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tenure *</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TENURE_OPTIONS.map(t => (
                <button key={t} onClick={() => { setTenure(t); setCustomTenure(""); setIsUnlimited(false); }}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: "1px solid",
                    borderColor: tenure === t && !customTenure && !isUnlimited ? "var(--accent)" : "var(--border)",
                    background: tenure === t && !customTenure && !isUnlimited ? "var(--accent-dim)" : "transparent",
                    color: tenure === t && !customTenure && !isUnlimited ? "var(--accent)" : "var(--muted)",
                    fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif",
                  }}
                >{t} mo</button>
              ))}
              <button onClick={() => { setIsUnlimited(true); setTenure(0); setCustomTenure(""); }}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "1px solid",
                  borderColor: isUnlimited ? "var(--accent)" : "var(--border)",
                  background: isUnlimited ? "var(--accent-dim)" : "transparent",
                  color: isUnlimited ? "var(--accent)" : "var(--muted)",
                  fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}
              >∞ Unlimited</button>
              {!isUnlimited && (
                <input type="number" value={customTenure} onChange={e => { setCustomTenure(e.target.value); setTenure(0); }}
                  placeholder="Custom" min="1"
                  style={{ ...inputStyle, width: 90, padding: "6px 10px" }} />
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Source *</label>
              <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Tokopedia, Bank..." style={inputStyle} />
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
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this installment for?" style={inputStyle} />
          </div>

          {totalAmount && !isUnlimited && Number(customTenure || tenure) > 0 && (
            <div style={{
              background: "rgba(124,107,255,0.08)", border: "1px solid rgba(124,107,255,0.2)",
              borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "var(--text)",
            }}>
              Monthly payment: <strong className="mono">{fmt(calcMonthlyPayment(Number(totalAmount), customTenure ? Number(customTenure) : tenure, Number(interestRate) || 0))}</strong>
              {" × "}{customTenure || tenure} months
              {Number(interestRate) > 0 && <span style={{ color: "var(--muted)" }}> ({interestRate}% interest)</span>}
            </div>
          )}

          {isUnlimited && totalAmount && (
            <div style={{
              background: "rgba(124,107,255,0.08)", border: "1px solid rgba(124,107,255,0.2)",
              borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "var(--text)",
            }}>
              Unlimited tenure — pay any amount anytime. Avg payment determines estimated completion.
            </div>
          )}

          <button onClick={addInstallment} disabled={!name.trim() || !totalAmount || !source.trim()}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
              background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "Inter, sans-serif",
              opacity: !name.trim() || !totalAmount || !source.trim() ? 0.5 : 1,
            }}
          >Add Installment</button>
        </div>
      )}

      {installments.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
          No installments yet. Add one above.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {installments.map(inst => {
            const paid = isPaidThisMonth(inst.id);
            const totalPaid = getTotalPaid(inst.id);
            const unlimited = !isLimited(inst);

            if (unlimited) {
              const { avg, monthsLeft, totalPaid: tp } = getUnlimitedEstimate(inst);
              const pct = inst.totalAmount > 0 ? Math.min((tp / inst.totalAmount) * 100, 100) : 0;
              const remaining = Math.max(inst.totalAmount - tp, 0);

              return (
                <div key={inst.id} style={{
                  padding: "10px 12px", borderRadius: 8,
                  background: paid ? "rgba(0,208,132,0.06)" : "rgba(251,191,36,0.06)",
                  border: `1px solid ${paid ? "rgba(0,208,132,0.2)" : "rgba(251,191,36,0.2)"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{TYPE_ICONS[inst.type] || "📦"}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inst.name}</p>
                          {paid && <span style={{ fontSize: 9, background: "var(--green-dim)", color: "var(--green)", padding: "1px 6px", borderRadius: 8 }}>PAID</span>}
                          <span style={{ fontSize: 9, background: "var(--accent-dim)", color: "var(--accent)", padding: "1px 6px", borderRadius: 8 }}>∞</span>
                        </div>
                        <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                          {inst.source} • {inst.type}{inst.description ? ` • ${inst.description}` : ""}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <p className="mono" style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                          {fmt(tp)} / {fmt(inst.totalAmount)}
                        </p>
                        <p style={{ fontSize: 9, color: "var(--muted)" }}>
                          {avg > 0 ? `~${fmt(avg)}/mo • ~${monthsLeft} mo left` : "No payments yet"}
                        </p>
                      </div>
                      {paid ? (
                        <button onClick={() => togglePayment(inst.id, 0)}
                          style={{
                            width: 28, height: 28, borderRadius: 6, border: "1px solid var(--green)",
                            background: "var(--green)", color: "#fff",
                            cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >✓</button>
                      ) : (
                        payingId === inst.id ? (
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <div style={{ position: "relative" }}>
                              <span style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: "var(--muted)" }}>Rp</span>
                              <input type="text" inputMode="numeric" value={payAmountDisplay} onChange={handlePayAmountChange}
                                onKeyDown={e => {
                                  if (e.key === "Enter" && payAmount) {
                                    togglePayment(inst.id, Number(payAmount));
                                    setPayingId(null); setPayAmount(""); setPayAmountDisplay("");
                                  }
                                  if (e.key === "Escape") { setPayingId(null); setPayAmount(""); setPayAmountDisplay(""); }
                                }}
                                placeholder="Amount" className="mono"
                                style={{ width: 100, padding: "4px 6px 4px 20px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 11, outline: "none" }} />
                            </div>
                            <button onClick={() => {
                              if (payAmount) { togglePayment(inst.id, Number(payAmount)); setPayingId(null); setPayAmount(""); setPayAmountDisplay(""); }
                            }} disabled={!payAmount}
                              style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "var(--green)", color: "#fff", fontSize: 10, cursor: "pointer", opacity: !payAmount ? 0.5 : 1 }}>Pay</button>
                          </div>
                        ) : (
                          <button onClick={() => { setPayingId(inst.id); setPayAmount(""); setPayAmountDisplay(""); }}
                            style={{
                              width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
                              background: "transparent", color: "var(--muted)",
                              cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >$</button>
                        )
                      )}
                      <button onClick={() => deleteInstallment(inst.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, padding: 2 }}
                      >✕</button>
                    </div>
                  </div>
                  <div style={{ height: 4, background: "var(--surface2)", borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 99, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 9, color: "var(--muted)" }}>{Math.round(pct)}% paid</span>
                    <span style={{ fontSize: 9, color: "var(--muted)" }}>Remaining: {fmt(remaining)}</span>
                  </div>
                </div>
              );
            }

            const monthly = calcMonthlyPayment(inst.totalAmount, inst.tenure, inst.interestRate);
            const { monthsLeft, remaining } = getFixedRemaining(inst);
            const totalWithInterest = inst.totalAmount * (1 + inst.interestRate / 100);
            const pct = totalWithInterest > 0 ? Math.min((totalPaid / totalWithInterest) * 100, 100) : 0;

            return (
              <div key={inst.id} style={{
                padding: "10px 12px", borderRadius: 8,
                background: paid ? "rgba(0,208,132,0.06)" : "rgba(251,191,36,0.06)",
                border: `1px solid ${paid ? "rgba(0,208,132,0.2)" : "rgba(251,191,36,0.2)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{TYPE_ICONS[inst.type] || "📦"}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inst.name}</p>
                        {paid && <span style={{ fontSize: 9, background: "var(--green-dim)", color: "var(--green)", padding: "1px 6px", borderRadius: 8 }}>PAID</span>}
                        {monthsLeft <= 0 && <span style={{ fontSize: 9, background: "var(--surface2)", color: "var(--muted)", padding: "1px 6px", borderRadius: 8 }}>DONE</span>}
                      </div>
                      <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                        {inst.source} • {inst.type}{inst.description ? ` • ${inst.description}` : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <p className="mono" style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{fmt(monthly)}/mo</p>
                      {monthsLeft > 0 && (
                        <p style={{ fontSize: 9, color: "var(--muted)" }}>
                          {monthsLeft} mo left • {fmt(remaining)}
                        </p>
                      )}
                    </div>
                    {monthsLeft > 0 && (
                      <button onClick={() => togglePayment(inst.id, monthly)}
                        style={{
                          width: 28, height: 28, borderRadius: 6, border: "1px solid",
                          borderColor: paid ? "var(--green)" : "var(--border)",
                          background: paid ? "var(--green)" : "transparent",
                          color: paid ? "#fff" : "var(--muted)",
                          cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                        title={paid ? "Mark as unpaid" : `Pay ${fmt(monthly)}`}
                      >✓</button>
                    )}
                    <button onClick={() => deleteInstallment(inst.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, padding: 2 }}
                    >✕</button>
                  </div>
                </div>
                <div style={{ height: 4, background: "var(--surface2)", borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "var(--green)", borderRadius: 99, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 9, color: "var(--muted)" }}>{Math.round(pct)}% paid</span>
                  <span style={{ fontSize: 9, color: "var(--muted)" }}>Remaining: {fmt(remaining)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
