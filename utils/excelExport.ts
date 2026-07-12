import * as XLSX from "xlsx";
import { Transaction, Installment, InstallmentPayment } from "@/types";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(monthKey: string, n: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function calcMonthlyPayment(total: number, tenure: number, interestRate: number): number {
  if (tenure <= 0) return 0;
  if (interestRate === 0) return Math.ceil(total / tenure);
  return Math.ceil(total * (1 + interestRate / 100) / tenure);
}

function getTotalPaid(instId: string, payments: InstallmentPayment[]): number {
  return payments.filter(p => p.installmentId === instId).reduce((s, p) => s + p.amount, 0);
}

function getFixedRemaining(inst: Installment, payments: InstallmentPayment[]): number {
  const totalWithInterest = inst.totalAmount * (1 + inst.interestRate / 100);
  const paid = getTotalPaid(inst.id, payments);
  return Math.max(totalWithInterest - paid, 0);
}

export function exportToExcel(
  transactions: Transaction[],
  installments: Installment[],
  payments: InstallmentPayment[],
  month: string
) {
  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Transactions ---
  const monthTxs = transactions
    .filter((t) => t.date.startsWith(month))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const txData = monthTxs.map((t) => ({
    Date: t.date,
    Title: t.title,
    Category: t.category,
    Type: t.type,
    Amount: t.amount,
    "Amount (Formatted)": fmt(t.amount),
  }));

  const income = monthTxs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  txData.push({} as any);
  txData.push({
    Date: "", Title: "TOTAL INCOME", Category: "", Type: "income",
    Amount: income, "Amount (Formatted)": fmt(income),
  } as any);
  txData.push({
    Date: "", Title: "TOTAL EXPENSE", Category: "", Type: "expense",
    Amount: expense, "Amount (Formatted)": fmt(expense),
  } as any);
  txData.push({
    Date: "", Title: "NET BALANCE", Category: "", Type: "",
    Amount: income - expense, "Amount (Formatted)": fmt(income - expense),
  } as any);

  const txSheet = XLSX.utils.json_to_sheet(txData);
  txSheet["!cols"] = [{ wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, txSheet, "Transactions");

  // --- Sheet 2: Installments ---
  const instData = installments.map((inst) => {
    const totalPaid = getTotalPaid(inst.id, payments);
    const isPaid = payments.some(p => p.installmentId === inst.id && p.monthKey === month);
    const unlimited = inst.tenure <= 0;

    if (unlimited) {
      const monthCount = new Set(payments.filter(p => p.installmentId === inst.id).map(p => p.monthKey)).size;
      const avg = monthCount > 0 ? Math.round(totalPaid / monthCount) : 0;
      const remaining = Math.max(inst.totalAmount - totalPaid, 0);
      return {
        Name: inst.name,
        Source: inst.source,
        Type: inst.type,
        Description: inst.description,
        "Total Amount": inst.totalAmount,
        "Monthly Payment": "Flexible",
        Tenure: "Unlimited",
        "Interest Rate": "-",
        "Start Date": inst.startDate,
        Status: isPaid ? "PAID" : "ACTIVE",
        "Total Paid": totalPaid,
        "Remaining Balance": remaining,
        "Avg/Month": avg,
      };
    }

    const monthly = calcMonthlyPayment(inst.totalAmount, inst.tenure, inst.interestRate);
    const remaining = getFixedRemaining(inst, payments);
    const monthsLeft = monthly > 0 ? Math.ceil(remaining / monthly) : 0;

    return {
      Name: inst.name,
      Source: inst.source,
      Type: inst.type,
      Description: inst.description,
      "Total Amount": inst.totalAmount,
      "Monthly Payment": monthly,
      Tenure: `${inst.tenure} months`,
      "Interest Rate": inst.interestRate > 0 ? `${inst.interestRate}%` : "-",
      "Start Date": inst.startDate,
      Status: isPaid ? "PAID" : monthsLeft > 0 ? "ACTIVE" : "DONE",
      "Total Paid": totalPaid,
      "Remaining Balance": remaining,
      "Avg/Month": monthly,
    };
  });

  const totalMonthlyActive = installments
    .filter(i => i.tenure > 0)
    .reduce((s, i) => {
      const remaining = getFixedRemaining(i, payments);
      return remaining > 0 ? s + calcMonthlyPayment(i.totalAmount, i.tenure, i.interestRate) : s;
    }, 0);

  if (instData.length > 0) {
    instData.push({} as any);
    instData.push({
      Name: "TOTAL MONTHLY INSTALLMENTS", Source: "", Type: "", Description: "",
      "Total Amount": "", "Monthly Payment": totalMonthlyActive, Tenure: "",
      "Interest Rate": "", "Start Date": "", Status: "", "Total Paid": "",
      "Remaining Balance": "", "Avg/Month": "",
    } as any);
  }

  const instSheet = XLSX.utils.json_to_sheet(instData);
  instSheet["!cols"] = [
    { wch: 20 }, { wch: 15 }, { wch: 14 }, { wch: 30 },
    { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, instSheet, "Installments");

  // --- Sheet 3: Monthly Summary ---
  const monthLabel = new Date(`${month}-01`).toLocaleString("en-US", {
    month: "long", year: "numeric",
  });

  const totalRemaining = installments.reduce((s, inst) => {
    if (inst.tenure <= 0) return s + Math.max(inst.totalAmount - getTotalPaid(inst.id, payments), 0);
    return s + getFixedRemaining(inst, payments);
  }, 0);

  const summaryData = [
    { Metric: "Month", Value: monthLabel },
    { Metric: "Total Income", Value: fmt(income) },
    { Metric: "Total Expenses", Value: fmt(expense) },
    { Metric: "Net Balance", Value: fmt(income - expense) },
    { Metric: "", Value: "" },
    { Metric: "Active Installments", Value: installments.length },
    { Metric: "Monthly Installment Total", Value: fmt(totalMonthlyActive) },
    { Metric: "Remaining Installment Balance", Value: fmt(totalRemaining) },
    { Metric: "", Value: "" },
    { Metric: "Total Outflow (Expenses + Installments)", Value: fmt(expense + totalMonthlyActive) },
    { Metric: "Net After Installments", Value: fmt(income - expense - totalMonthlyActive) },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // --- Download ---
  const fileName = `Finance_Report_${month}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
