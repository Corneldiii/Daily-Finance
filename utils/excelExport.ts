import * as XLSX from "xlsx";
import { Transaction, Installment } from "@/types";

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

function calcRemaining(inst: Installment, currentMonth: string): number {
  const startMonth = getMonthKey(inst.startDate);
  const endMonth = addMonths(startMonth, inst.tenure - 1);
  let monthsElapsed = 0;
  let cur = startMonth;
  while (cur < currentMonth && cur <= endMonth) {
    monthsElapsed++;
    cur = addMonths(cur, 1);
  }
  const remaining = inst.totalAmount - monthsElapsed * inst.monthlyPayment;
  return Math.max(remaining, 0);
}

export function exportToExcel(
  transactions: Transaction[],
  installments: Installment[],
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

  // Add summary rows at bottom
  const income = monthTxs
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = monthTxs
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  txData.push({} as any);
  txData.push({
    Date: "",
    Title: "TOTAL INCOME",
    Category: "",
    Type: "income",
    Amount: income,
    "Amount (Formatted)": fmt(income),
  } as any);
  txData.push({
    Date: "",
    Title: "TOTAL EXPENSE",
    Category: "",
    Type: "expense",
    Amount: expense,
    "Amount (Formatted)": fmt(expense),
  } as any);
  txData.push({
    Date: "",
    Title: "NET BALANCE",
    Category: "",
    Type: "",
    Amount: income - expense,
    "Amount (Formatted)": fmt(income - expense),
  } as any);

  const txSheet = XLSX.utils.json_to_sheet(txData);
  txSheet["!cols"] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, txSheet, "Transactions");

  // --- Sheet 2: Installments ---
  const instData = installments.map((inst) => {
    const startMonth = getMonthKey(inst.startDate);
    const endMonth = addMonths(startMonth, inst.tenure - 1);
    const isActive = startMonth <= month && endMonth >= month;
    const isPaid = inst.paidMonths.includes(month);
    const remaining = calcRemaining(inst, month);

    return {
      Name: inst.name,
      Source: inst.source,
      Type: inst.type,
      Description: inst.description,
      "Total Amount": inst.totalAmount,
      "Monthly Payment": inst.monthlyPayment,
      Tenure: `${inst.tenure} months`,
      "Interest Rate": inst.interestRate > 0 ? `${inst.interestRate}%` : "-",
      "Start Date": inst.startDate,
      Status: isPaid ? "PAID" : isActive ? "ACTIVE" : "DONE",
      "Remaining Balance": remaining,
    };
  });

  // Add total row
  const totalMonthly = installments.reduce(
    (s, i) => {
      const startMonth = getMonthKey(i.startDate);
      const endMonth = addMonths(startMonth, i.tenure - 1);
      if (startMonth <= month && endMonth >= month) return s + i.monthlyPayment;
      return s;
    },
    0
  );

  if (instData.length > 0) {
    instData.push({} as any);
    instData.push({
      Name: "TOTAL MONTHLY INSTALLMENTS",
      Source: "",
      Type: "",
      Description: "",
      "Total Amount": "",
      "Monthly Payment": totalMonthly,
      Tenure: "",
      "Interest Rate": "",
      "Start Date": "",
      Status: "",
      "Remaining Balance": "",
    } as any);
  }

  const instSheet = XLSX.utils.json_to_sheet(instData);
  instSheet["!cols"] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 14 },
    { wch: 30 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, instSheet, "Installments");

  // --- Sheet 3: Monthly Summary ---
  const activeInst = installments.filter((inst) => {
    const startMonth = getMonthKey(inst.startDate);
    const endMonth = addMonths(startMonth, inst.tenure - 1);
    return startMonth <= month && endMonth >= month;
  });

  const totalRemaining = activeInst.reduce(
    (s, inst) => s + calcRemaining(inst, month),
    0
  );

  const monthLabel = new Date(`${month}-01`).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const summaryData = [
    { Metric: "Month", Value: monthLabel },
    { Metric: "Total Income", Value: fmt(income) },
    { Metric: "Total Expenses", Value: fmt(expense) },
    { Metric: "Net Balance", Value: fmt(income - expense) },
    { Metric: "", Value: "" },
    { Metric: "Active Installments", Value: activeInst.length },
    { Metric: "Monthly Installment Total", Value: fmt(totalMonthly) },
    { Metric: "Remaining Installment Balance", Value: fmt(totalRemaining) },
    { Metric: "", Value: "" },
    {
      Metric: "Total Outflow (Expenses + Installments)",
      Value: fmt(expense + totalMonthly),
    },
    {
      Metric: "Net After Installments",
      Value: fmt(income - expense - totalMonthly),
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // --- Download ---
  const fileName = `Finance_Report_${month}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
