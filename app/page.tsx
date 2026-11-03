"use client";

import { useEffect, useState, useRef } from "react";
import { Transaction, Installment, InstallmentPayment } from "@/types";
import { exportToExcel } from "@/utils/excelExport";
import Summary from "@/components/Summary";
import BarChart from "@/components/BarChart";
import CategoryList from "@/components/CategoryList";
import CalendarView from "@/components/CalendarView";
import InstallmentTracker from "@/components/InstallmentTracker";
import RecurringTransactions from "@/components/RecurringTransactions";
import SavingsGoal from "@/components/SavingsGoal";
import MonthlyComparison from "@/components/MonthlyComparison";
import TransactionList from "@/components/TransactionList";
import AddModal from "@/components/AddModal";
import TransportScheduler from "@/components/TransportScheduler";

const SKIP_DAY_TITLE = "Transport Skip Day";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [installmentPayments, setInstallmentPayments] = useState<InstallmentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const txListRef = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [txRes, instRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/installments"),
      ]);
      const txData = await txRes.json();
      const instData = await instRes.json();
      setTransactions((txData.transactions || []).filter((t: Transaction) => t.title !== SKIP_DAY_TITLE));
      setInstallments(instData.installments || []);
      setInstallmentPayments(instData.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  useEffect(() => {
    if (selectedDate && txListRef.current) {
      txListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedDate]);

  const isEMoneyTransfer = (type: string, category: string) =>
    type === "transfer" && category === "E-Money";

  const isEMoneyExpense = (type: string, category: string) =>
    type === "expense" && category === "Pakai E-Money";

  const E_MONEY_ADMIN_FEE = 1500;

  const eMoneyInjected = (t: { type: string; category: string; amount: number; adminFee?: boolean }) =>
    isEMoneyTransfer(t.type, t.category) ? (t.adminFee ? t.amount - E_MONEY_ADMIN_FEE : t.amount) : 0;

  const eMoneyDelta = (t: { type: string; category: string; amount: number; title: string; adminFee?: boolean }) => {
    const injected = eMoneyInjected(t);
    if (injected > 0) return injected;
    if (isEMoneyExpense(t.type, t.category)) return -t.amount;
    if (t.type === "expense" && t.title === "Transport Auto-Deduction") return -t.amount;
    return 0;
  };

  const isRefundableExpense = (t: { type: string; category: string; title: string }) =>
    isEMoneyExpense(t.type, t.category) || (t.type === "expense" && t.title === "Transport Auto-Deduction");

  const updateEMoneyBalance = async (delta: number) => {
    await fetch("/api/balances/E-Money", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
    window.dispatchEvent(new Event("balance-updated"));
  };

  const handleAdd = async (t: Omit<Transaction, "id">) => {
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });

    const delta = eMoneyDelta(t);
    if (delta !== 0) {
      await updateEMoneyBalance(delta);
    }

    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });

    if (tx) {
      const delta = eMoneyDelta(tx);
      if (delta !== 0) {
        await updateEMoneyBalance(-delta);
      }
    }

    fetchTransactions();
  };

  const handleRevert = async (tx: Transaction) => {
    const confirmMsg = `Revert pengeluaran "${tx.title}" (${tx.amount.toLocaleString("id-ID")}) dan kembalikan saldo?`;
    if (!window.confirm(confirmMsg)) return;

    await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" });

    if (isRefundableExpense(tx)) {
      await updateEMoneyBalance(tx.amount);
    }

    fetchTransactions();
  };

  const handleEdit = async (id: string, t: Omit<Transaction, "id">) => {
    const oldTx = transactions.find(tx => tx.id === id);
    await fetch(`/api/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });

    if (oldTx) {
      const oldDelta = eMoneyDelta(oldTx);
      const newDelta = eMoneyDelta(t);
      if (oldDelta !== newDelta) {
        await updateEMoneyBalance(newDelta - oldDelta);
      }
    }

    fetchTransactions();
  };

  const changeMonth = (dir: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + dir);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const getMonthKey = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const currentFiltered = transactions.filter(t => t.date.startsWith(month));

  const getNetBalance = (monthKey: string) => {
    const txs = transactions.filter(t => t.date.startsWith(monthKey));
    const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "expense" && t.title !== "Transport Auto-Deduction" && t.category !== "Pakai E-Money").reduce((s, t) => s + t.amount, 0);
    const saving = txs.filter(t => t.type === "saving").reduce((s, t) => s + t.amount, 0);
    const transfer = txs.filter(t => t.type === "transfer").reduce((s, t) => s + t.amount, 0);
    return income - expense - saving - transfer;
  };

  const carryOverBalances = (() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [selY, selM] = month.split("-").map(Number);
    const selKey = `${selY}-${String(selM).padStart(2, "0")}`;
    if (selKey <= currentKey) return 0;
    const hasManualCarry = currentFiltered.some(t =>
      t.type === "income" &&
      (t.title === "Carry Over" || /sisa|net balance|carry/i.test(t.title))
    );
    if (hasManualCarry) return 0;
    const isManualCarry = (t: Transaction) =>
      t.type === "income" &&
      (t.title === "Carry Over" || /sisa|net balance|carry/i.test(t.title));
    const [curY, curM] = currentKey.split("-").map(Number);
    let carry = 0;
    const d = new Date(curY, curM - 1, 1);
    for (let i = 0; i < 36; i++) {
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (mk >= selKey) break;
      let monthNet = getNetBalance(mk);
      if (mk !== currentKey) {
        monthNet -= transactions.filter(t => t.date.startsWith(mk) && isManualCarry(t)).reduce((s, t) => s + t.amount, 0);
      }
      carry += monthNet;
      d.setMonth(d.getMonth() + 1);
    }
    return carry > 0 ? carry : 0;
  })();

  const adjustedFiltered = [...currentFiltered];
  if (carryOverBalances > 0) {
    const hasIncome = currentFiltered.some(t => t.type === "income" && t.title === "Carry Over");
    if (!hasIncome) {
      adjustedFiltered.unshift({
        id: `carry-over-${month}`,
        title: "Carry Over",
        amount: carryOverBalances,
        type: "income" as const,
        category: "Other" as const,
        date: `${month}-01`,
      });
    }
  }

  const monthLabel = new Date(`${month}-01`).toLocaleString("en-US", { month: "long", year: "numeric" });

  const handleExport = () => {
    exportToExcel(transactions, installments, installmentPayments, month);
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 80px" }}>

        <div style={{
          position: "sticky", top: 0, zIndex: 40,
          background: "rgba(10,10,15,0.85)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 0", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
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

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "6px 10px",
            }}>
              <button onClick={() => changeMonth(-1)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>‹</button>
              <span style={{ fontSize: 12, color: "var(--text)", width: 110, textAlign: "center" }}>{monthLabel}</span>
              <button onClick={() => changeMonth(1)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, padding: "0 2px" }}>›</button>
            </div>

            <button onClick={handleExport} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
              color: "var(--text)", fontSize: 13, fontWeight: 500,
              padding: "8px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              📊 Export
            </button>

            <button onClick={() => setShowModal(true)} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--green)", border: "none", borderRadius: 10,
              color: "#000", fontSize: 13, fontWeight: 600,
              padding: "8px 16px", cursor: "pointer", fontFamily: "Inter, sans-serif",
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
            <Summary transactions={adjustedFiltered} allTransactions={transactions} carryOver={carryOverBalances} currentMonth={month} />
            <TransportScheduler />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              <BarChart transactions={transactions} month={month} />
              <CategoryList transactions={adjustedFiltered} />
            </div>
            <RecurringTransactions month={month} />
            <SavingsGoal transactions={adjustedFiltered} month={month} />
            <InstallmentTracker month={month} />
            <CalendarView transactions={transactions} month={month} selectedDate={selectedDate} onDayClick={setSelectedDate} />
            <MonthlyComparison transactions={transactions} month={month} />
            <div ref={txListRef}>
              <TransactionList transactions={adjustedFiltered} onDelete={handleDelete} onRevert={handleRevert} selectedDate={selectedDate} onClearDate={() => setSelectedDate(null)} onEdit={(tx) => { setEditingTx(tx); setShowModal(true); }} />
            </div>
          </div>
        )}
      </div>

      {showModal && <AddModal onClose={() => { setShowModal(false); setEditingTx(null); }} onAdd={handleAdd} editData={editingTx} onEdit={handleEdit} />}
    </main>
  );
}
