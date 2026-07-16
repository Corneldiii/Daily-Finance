export type TransactionType = "income" | "expense" | "saving" | "transfer" | "cash_withdrawal";

export type Category =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Entertainment"
  | "Bills"
  | "Health"
  | "Kos"
  | "Other"
  | "Salary"
  | "Freelance"
  | "Investment"
  | "Tabungan"
  | "Investasi"
  | "Dana Darurat"
  | "E-Money"
  | "Tarik Tunai";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
}

export type InstallmentType = "Electronics" | "Furniture" | "Vehicle" | "Education" | "Fashion" | "Health" | "Subscription" | "Other";

export interface Installment {
  id: string;
  name: string;
  totalAmount: number;
  tenure: number; // -1 = unlimited
  interestRate: number;
  source: string;
  description: string;
  type: InstallmentType;
  startDate: string;
}

export interface InstallmentPayment {
  id: string;
  installmentId: string;
  amount: number;
  monthKey: string;
}

export interface MonthlyInstallmentSummary {
  month: string;
  installments: { name: string; amount: number; description: string }[];
  totalAmount: number;
  remainingBalance: number;
}

export interface Balance {
  id: string;
  name: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}
