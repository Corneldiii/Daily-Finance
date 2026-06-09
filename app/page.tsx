"use client";

import { useEffect, useState } from "react";
import { Transaction } from "@/types";
import Summary from "@/components/Summary";
import BarChart from "@/components/BarChart";
import CategoryList from "@/components/CategoryList";
import TransactionList from "@/components/TransactionList";
import AddModal from "@/components/AddModal";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleAdd = async (t: Omit<Transaction, "id">) => {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    fetchTransactions();
  };

  const changeMonth = (dir: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + dir);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const filtered = transactions.filter(t => t.date.startsWith(month));
  const monthLabel = new Date(`${month}-01`).toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 80px" }}>

        <div style={{
          position: "sticky", top: 0, zIndex: 40,
          background: "rgba(10,10,15,0.85)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 0", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "var(--accent-dim)", border: "1px solid rgba(124,107,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>💰</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>Finance</p>
              <p style={{ fontSize: 10, color: "var(--muted)" }}>Personal tracker</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "6px 10px",
            }}>
              <button onClick={() => changeMonth(-1)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>‹</button>
              <span style={{ fontSize: 12, color: "var(--text)", width: 110, textAlign: "center" }}>{monthLabel}</span>
              <button onClick={() => changeMonth(1)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>›</button>
            </div>

            <button onClick={() => setShowModal(true)} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--green)", border: "none", borderRadius: 10,
              color: "#000", fontSize: 13, fontWeight: 600,
              padding: "8px 16px", cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            }}>
              + Add
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>⏳</p>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading your finances...</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Summary transactions={filtered} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <BarChart transactions={transactions} />
              <CategoryList transactions={filtered} />
            </div>
            <TransactionList transactions={filtered} onDelete={handleDelete} />
          </div>
        )}
      </div>

      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </main>
  );
}