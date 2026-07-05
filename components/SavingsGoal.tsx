"use client";
import { useState, useEffect } from "react";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[]; month: string }

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  icon: string;
  deadline?: string;
}

const STORAGE_KEY = "finance_savings_goals";

const GOAL_ICONS = ["🏖️", "🏠", "🚗", "💻", "📱", "✈️", "🎓", "💍", "🏥", "🎮", "📚", "🏋️"];

export default function SavingsGoal({ transactions, month }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [targetDisplay, setTargetDisplay] = useState("");
  const [icon, setIcon] = useState("🏖️");
  const [deadline, setDeadline] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [addAmountDisplay, setAddAmountDisplay] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setGoals(JSON.parse(saved));
    } catch {}
  }, []);

  const saveGoals = (g: Goal[]) => {
    setGoals(g);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(g));
  };

  const formatRupiah = (val: string): string => {
    const nums = val.replace(/\D/g, "");
    if (!nums) return "";
    return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setTarget(raw);
    setTargetDisplay(formatRupiah(raw));
  };

  const handleAddAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setAddAmount(raw);
    setAddAmountDisplay(formatRupiah(raw));
  };

  const addGoal = () => {
    if (!name.trim() || !target) return;
    const newGoal: Goal = {
      id: Date.now().toString(),
      name: name.trim(),
      targetAmount: Number(target),
      savedAmount: 0,
      icon,
      deadline: deadline || undefined,
    };
    saveGoals([...goals, newGoal]);
    setName("");
    setTarget("");
    setTargetDisplay("");
    setDeadline("");
    setShowForm(false);
  };

  const removeGoal = (id: string) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  const addToGoal = (id: string) => {
    const amount = Number(addAmount);
    if (!amount || amount <= 0) return;
    saveGoals(goals.map(g => g.id === id ? { ...g, savedAmount: g.savedAmount + amount } : g));
    setAddingTo(null);
    setAddAmount("");
    setAddAmountDisplay("");
  };

  const autoSaveFromBalance = () => {
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    if (balance <= 0 || goals.length === 0) return;

    const unmetGoals = goals.filter(g => g.savedAmount < g.targetAmount);
    if (unmetGoals.length === 0) return;

    const perGoal = Math.floor(balance / unmetGoals.length);
    if (perGoal <= 0) return;

    saveGoals(goals.map(g => {
      if (g.savedAmount >= g.targetAmount) return g;
      const remaining = g.targetAmount - g.savedAmount;
      const toAdd = Math.min(perGoal, remaining);
      return { ...g, savedAmount: g.savedAmount + toAdd };
    }));
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const inputStyle = {
    width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "var(--text)",
    outline: "none", fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,208,132,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
            🎯
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Savings Goals</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>Track your saving targets</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {goals.length > 0 && (
            <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
              {overallPct}%
            </span>
          )}
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: "5px 12px", borderRadius: 8, border: "1px solid var(--border)",
            background: showForm ? "var(--surface2)" : "transparent",
            color: "var(--text)", fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif",
          }}>
            {showForm ? "✕" : "+ New"}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 14, marginBottom: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {GOAL_ICONS.map(gi => (
              <button key={gi} onClick={() => setIcon(gi)} style={{
                width: 30, height: 30, borderRadius: 6, border: icon === gi ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                background: icon === gi ? "var(--accent-dim)" : "transparent",
                cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{gi}</button>
            ))}
          </div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Goal name (e.g. Vacation)" style={inputStyle} />
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--muted)", pointerEvents: "none" }}>Rp</span>
            <input type="text" inputMode="numeric" value={targetDisplay} onChange={handleTargetChange} placeholder="Target amount" className="mono" style={{ ...inputStyle, paddingLeft: 30 }} />
          </div>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inputStyle} />
          <button onClick={addGoal} disabled={!name.trim() || !target} style={{
            padding: "8px 0", borderRadius: 8, border: "none",
            background: "var(--green)", color: "#fff", fontSize: 12, fontWeight: 500,
            cursor: "pointer", fontFamily: "Inter, sans-serif", opacity: !name.trim() || !target ? 0.5 : 1,
          }}>Create Goal</button>
        </div>
      )}

      {goals.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "20px 0" }}>
          No savings goals yet — start one! 🎯
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {goals.map(goal => {
            const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const isDone = goal.savedAmount >= goal.targetAmount;
            const isAdding = addingTo === goal.id;

            return (
              <div key={goal.id} style={{
                padding: "12px 14px", borderRadius: 10,
                background: isDone ? "rgba(0,208,132,0.08)" : "rgba(0,0,0,0.03)",
                border: isDone ? "1px solid rgba(0,208,132,0.3)" : "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{goal.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{goal.name}</p>
                      {goal.deadline && (
                        <p style={{ fontSize: 10, color: "var(--muted)" }}>
                          Target: {new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="mono" style={{ fontSize: 12, color: isDone ? "var(--green)" : "var(--text)" }}>
                      {fmt(goal.savedAmount)} / {fmt(goal.targetAmount)}
                    </span>
                    {!isDone && (
                      <button onClick={() => { setAddingTo(isAdding ? null : goal.id); setAddAmount(""); setAddAmountDisplay(""); }} style={{
                        padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border)",
                        background: isAdding ? "var(--surface2)" : "transparent",
                        color: "var(--green)", fontSize: 11, cursor: "pointer", fontFamily: "Inter, sans-serif",
                      }}>+ Save</button>
                    )}
                    <button onClick={() => removeGoal(goal.id)} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--muted)", fontSize: 12, padding: 2,
                    }}>✕</button>
                  </div>
                </div>

                <div style={{ height: 5, background: "var(--surface2)", borderRadius: 99, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: isDone ? "var(--green)" : "var(--accent)",
                    borderRadius: 99, transition: "width 0.5s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{Math.round(pct)}% saved</span>
                  {isDone && <span style={{ fontSize: 10, color: "var(--green)", fontWeight: 500 }}>✓ Goal reached!</span>}
                </div>

                {isAdding && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--muted)" }}>Rp</span>
                      <input type="text" inputMode="numeric" value={addAmountDisplay} onChange={handleAddAmountChange} placeholder="Amount" className="mono"
                        onKeyDown={e => e.key === "Enter" && addToGoal(goal.id)}
                        style={{ width: "100%", padding: "5px 8px 5px 24px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 11, outline: "none" }} />
                    </div>
                    <button onClick={() => addToGoal(goal.id)} disabled={!addAmount} style={{
                      padding: "5px 12px", borderRadius: 6, border: "none",
                      background: "var(--green)", color: "#fff", fontSize: 11, fontWeight: 500,
                      cursor: "pointer", fontFamily: "Inter, sans-serif", opacity: !addAmount ? 0.5 : 1,
                    }}>Add</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
