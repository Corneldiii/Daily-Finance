export type TransactionType = "income" | "expense";

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
  | "Investment";

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
  tenure: number;
  interestRate: number;
  monthlyPayment: number;
  source: string;
  description: string;
  type: InstallmentType;
  startDate: string;
  paidMonths: string[];
}

export interface MonthlyInstallmentSummary {
  month: string;
  installments: { name: string; amount: number; description: string }[];
  totalAmount: number;
  remainingBalance: number;
}
