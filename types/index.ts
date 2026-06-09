export type TransactionType = "income" | "expense";

export type Category =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Entertainment"
  | "Bills"
  | "Health"
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