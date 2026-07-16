"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const CHECK_INTERVAL = 60 * 1000;

export default function TransportScheduler() {
  const [status, setStatus] = useState<"idle" | "checking" | "deducted" | "error" | "skipped">("idle");
  const [lastCheck, setLastCheck] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("");
  const [nextDeduction, setNextDeduction] = useState<string>("");
  const settledRef = useRef(false);

  const calculateNextDeduction = useCallback(() => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();

    let daysUntilNext = 0;
    if (day >= 1 && day <= 5) {
      if (hours < 8) {
        daysUntilNext = 0;
      } else {
        if (day === 5) daysUntilNext = 3;
        else daysUntilNext = 1;
      }
    } else if (day === 0) daysUntilNext = 1;
    else if (day === 6) daysUntilNext = 2;

    const next = new Date(now);
    next.setDate(next.getDate() + daysUntilNext);
    next.setHours(8, 0, 0, 0);

    return next.toLocaleString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const checkAndDeduct = useCallback(async () => {
    if (settledRef.current) return;

    const now = new Date();
    const day = now.getDay();
    const isWeekday = day >= 1 && day <= 5;

    if (!isWeekday || now.getHours() !== 8) {
      setStatus("skipped");
      setLastCheck(now.toLocaleTimeString("en-US"));
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
  }, [calculateNextDeduction]);

  useEffect(() => {
    checkAndDeduct();
    const interval = setInterval(() => {
      if (!settledRef.current) {
        checkAndDeduct();
      }
    }, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkAndDeduct]);

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
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>Every weekday (Mon-Fri) at 8:00 AM</p>
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
