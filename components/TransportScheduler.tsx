"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Transaction } from "@/types";

const CHECK_INTERVAL = 60 * 1000;

interface SkipDate { id: string; date: string }

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const fmtDate = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function TransportScheduler() {
  const [status, setStatus] = useState<"idle" | "checking" | "deducted" | "error" | "skipped">("idle");
  const [lastCheck, setLastCheck] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("");
  const [nextDeduction, setNextDeduction] = useState<string>("");
  const [skipDates, setSkipDates] = useState<SkipDate[]>([]);
  const [newSkipDate, setNewSkipDate] = useState("");
  const settledRef = useRef(false);

  const fetchSkipDates = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      const skips = ((data.transactions || []) as Transaction[])
        .filter(t => t.title === "Transport Skip Day")
        .map(t => ({ id: t.id, date: t.date }))
        .sort((a: SkipDate, b: SkipDate) => a.date.localeCompare(b.date));
      setSkipDates(skips);
    } catch {}
  }, []);

  useEffect(() => { fetchSkipDates(); }, [fetchSkipDates]);

  const calculateNextDeduction = useCallback(() => {
    const now = new Date();
    const skipSet = new Set(skipDates.map(s => s.date));

    for (let i = 0; i < 90; i++) {
      const c = new Date(now);
      c.setDate(c.getDate() + i);
      const day = c.getDay();
      const key = toDateKey(c);
      if (day < 1 || day > 5 || skipSet.has(key)) continue;
      if (i === 0 && now.getHours() >= 8) continue;
      c.setHours(8, 0, 0, 0);
      return c.toLocaleString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "";
  }, [skipDates]);

  const checkAndDeduct = useCallback(async () => {
    if (settledRef.current) return;

    const now = new Date();
    const day = now.getDay();
    const isWeekday = day >= 1 && day <= 5;
    const todayKey = toDateKey(now);
    const isSkippedToday = skipDates.some(s => s.date === todayKey);

    if (!isWeekday || isSkippedToday || now.getHours() !== 8) {
      setStatus("skipped");
      setLastCheck(now.toLocaleTimeString("en-US"));
      if (isSkippedToday) setLastResult("Skip day set — deduction paused");
      setNextDeduction(calculateNextDeduction());
      return;
    }

    setStatus("checking");
    setLastCheck(now.toLocaleTimeString("en-US"));

    try {
      const res = await fetch("/api/cron/transport-deduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success) {
        setStatus("deducted");
        setLastResult(`Deduced Rp 3.500 - Balance: Rp ${(data.newBalance || 0).toLocaleString("id-ID")}`);
        window.dispatchEvent(new Event("balance-updated"));
        settledRef.current = true;
      } else if (data.message === "Already deducted today") {
        setStatus("deducted");
        setLastResult("Already deducted today");
        settledRef.current = true;
      } else {
        setStatus("skipped");
        setLastResult(data.message || "Skipped");
      }
    } catch {
      setStatus("error");
      setLastResult("Network error");
    }

    setNextDeduction(calculateNextDeduction());
  }, [calculateNextDeduction, skipDates]);

  useEffect(() => {
    checkAndDeduct();
    const interval = setInterval(() => {
      if (!settledRef.current) {
        checkAndDeduct();
      }
    }, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkAndDeduct]);

  const addSkipDate = async () => {
    if (!newSkipDate) return;
    if (skipDates.some(s => s.date === newSkipDate)) {
      setNewSkipDate("");
      return;
    }
    try {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Transport Skip Day",
          amount: 0,
          type: "expense",
          category: "Transport",
          date: newSkipDate,
        }),
      });
      setNewSkipDate("");
      fetchSkipDates();
    } catch {}
  };

  const removeSkipDate = async (id: string) => {
    try {
      await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      fetchSkipDates();
    } catch {}
  };

  const statusColors = {
    idle: "var(--muted)",
    checking: "#fbbf24",
    deducted: "var(--green)",
    error: "var(--red)",
    skipped: "var(--muted)",
  };

  const statusLabels = {
    idle: "Initializing...",
    checking: "Checking...",
    deducted: "Active",
    error: "Error",
    skipped: "Waiting",
  };

  const inputStyle = {
    width: "100%", background: "var(--surface2)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "var(--text)",
    outline: "none", fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16,
      padding: "16px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "rgba(16,185,129,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
          }}>
            🚌
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Transport Auto-Deduction</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>Every weekday (Mon-Fri) at 8:00 AM · Rp 3.500</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: statusColors[status],
            animation: status === "checking" ? "pulse 1s infinite" : "none",
          }} />
          <span style={{ fontSize: 11, color: statusColors[status] }}>{statusLabels[status]}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--muted)" }}>
        {lastCheck && (
          <span>Last check: {lastCheck}</span>
        )}
        {nextDeduction && (
          <span>Next: {nextDeduction}</span>
        )}
      </div>
      {lastResult && (
        <p style={{ fontSize: 11, color: status === "deducted" ? "var(--green)" : "var(--muted)", marginTop: 6 }}>
          {lastResult}
        </p>
      )}

      <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>Skip days 🏖️</p>
            <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>
              Auto-deduction dilewati pada tanggal libur di hari kerja
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="date" value={newSkipDate} onChange={e => setNewSkipDate(e.target.value)} style={inputStyle} />
            <button onClick={addSkipDate} disabled={!newSkipDate} style={{
              padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "var(--green)", color: "#000", fontSize: 12, fontWeight: 600,
              fontFamily: "Inter, sans-serif", opacity: !newSkipDate ? 0.5 : 1,
            }}>+ Skip</button>
          </div>
        </div>

        {skipDates.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--muted)", opacity: 0.7 }}>Belum ada skip day.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {skipDates.map(s => (
              <span key={s.id} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 10px", borderRadius: 20,
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)",
                fontSize: 11, color: "#fbbf24",
              }}>
                🏖️ {fmtDate(s.date)}
                <button onClick={() => removeSkipDate(s.id)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#fbbf24", fontSize: 11, padding: 0, lineHeight: 1,
                }}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
