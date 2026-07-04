"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Transaction } from "@/types";

interface Props { transactions: Transaction[] }

interface WishItem {
  id: string;
  name: string;
  price: number;
}

const COLORS: Record<string, string> = {
  Food: "#f59e0b", Transport: "#3b82f6", Shopping: "#ec4899",
  Entertainment: "#8b5cf6", Bills: "#f97316", Health: "#14b8a6",
  Kos: "#e879f9", Other: "#6b7280", Salary: "#00d084", Freelance: "#06b6d4", Investment: "#7c6bff",
};

const ICONS: Record<string, string> = {
  Food: "🍜", Transport: "🚗", Shopping: "🛍️", Entertainment: "🎮",
  Bills: "🧾", Health: "💊", Kos: "🏠", Other: "📦", Salary: "💼", Freelance: "💻", Investment: "📈",
};

export default function CategoryList({ transactions }: Props) {
  const supabase = createClient();

  const [wishList, setWishList] = useState<WishItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch wish list from Supabase
  useEffect(() => {
    const fetchWishList = async () => {
      const { data, error } = await supabase
        .from("wish_items")
        .select("id, name, price")
        .order("created_at", { ascending: true });

      if (!error && data) setWishList(data);
      setLoading(false);
    };

    fetchWishList();
  }, []);

  const expenses = transactions.filter(t => t.type === "expense");
  const total = expenses.reduce((s, t) => s + t.amount, 0);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentIncome = transactions
    .filter(t => t.type === "income" && t.date.startsWith(monthKey))
    .reduce((s, t) => s + t.amount, 0);
  const currentExpense = transactions
    .filter(t => t.type === "expense" && t.date.startsWith(monthKey))
    .reduce((s, t) => s + t.amount, 0);
  const netBalance = currentIncome - currentExpense;

  const byCategory = expenses.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);

  const wishTotal = wishList.reduce((s, i) => s + i.price, 0);
  const wishPct = netBalance > 0 ? Math.min((wishTotal / netBalance) * 100, 100) : 0;
  const barColor = wishPct >= 80 ? "#ef4444" : wishPct >= 50 ? "#f97316" : "#1D9E75";

  const addItem = async () => {
    const price = Number(itemPrice);
    if (!itemName.trim() || !price || price <= 0) return;

    const { data, error } = await supabase
      .from("wish_items")
      .insert({ name: itemName.trim(), price })
      .select("id, name, price")
      .single();

    if (!error && data) {
      setWishList(prev => [...prev, data]);
      setItemName("");
      setItemPrice("");
    }
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase
      .from("wish_items")
      .delete()
      .eq("id", id);

    if (!error) setWishList(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>

      {/* Spending Breakdown */}
      <div style={{ flexShrink: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>Spending Breakdown</p>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>By category this month</p>
        </div>

        {sorted.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "24px 0" }}>No expenses yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sorted.map(([cat, amount]) => {
              const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
              const color = COLORS[cat] || "#6b7280";
              return (
                <div key={cat}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{ICONS[cat] || "📦"}</span>
                      <span style={{ fontSize: 13, color: "var(--text)" }}>{cat}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="mono" style={{ fontSize: 12, color: "var(--text)" }}>{fmt(amount)}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.7s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Wish List */}
      <div className="wish-card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
            🛒
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Wish List</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>Things you want to buy</p>
          </div>
        </div>

        {/* Input Row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Item name"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addItem()}
            style={{
              flex: 2, padding: "8px 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text)", fontSize: 12, outline: "none",
            }}
          />
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              fontSize: 11, color: "var(--muted)", pointerEvents: "none",
            }}>Rp</span>
            <input
              type="number"
              placeholder="Price"
              value={itemPrice}
              onChange={e => setItemPrice(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addItem()}
              style={{
                width: "100%", padding: "8px 10px 8px 30px", borderRadius: 8,
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--text)", fontSize: 12, outline: "none",
              } as React.CSSProperties}
            />
          </div>
          <button
            onClick={addItem}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "none",
              background: "#1D9E75", color: "#fff", fontSize: 13,
              fontWeight: 600, cursor: "pointer", flexShrink: 0,
            }}
          >
            +
          </button>
        </div>

        {/* List Items */}
        {loading ? (
          <p style={{ flexShrink: 0, fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>Loading...</p>
        ) : wishList.length === 0 ? (
          <p style={{ flexShrink: 0, fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "16px 0" }}>
            No items yet — add something you want 🎯
          </p>
        ) : (
          <div className="wish-list-items" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {wishList.map((item, idx) => (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 12px", borderRadius: 8,
                background: "rgba(0,0,0,0.03)",
                border: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 16 }}>{idx + 1}.</span>
                  <span style={{ fontSize: 13, color: "var(--text)" }}>{item.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mono" style={{ fontSize: 12, color: "var(--text)" }}>{fmt(item.price)}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--muted)", fontSize: 14, lineHeight: 1, padding: 2,
                    }}
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {wishList.length > 0 && (
          <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Total wish list</span>
              <strong style={{ fontSize: 14, color: "var(--text)" }}>{fmt(wishTotal)}</strong>
            </div>
            <div style={{ height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden", marginBottom: 5 }}>
              <div style={{
                height: "100%", width: `${wishPct.toFixed(1)}%`,
                background: barColor, borderRadius: 99, transition: "width 0.4s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>
                {netBalance > 0
                  ? `${Math.round(wishPct)}% of net balance (${fmt(netBalance)})`
                  : "No net balance this month"}
              </span>
              {wishPct >= 80 && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 500 }}>⚠ High spend</span>}
              {wishPct >= 50 && wishPct < 80 && <span style={{ fontSize: 10, color: "#f97316", fontWeight: 500 }}>⚡ Moderate</span>}
              {wishPct > 0 && wishPct < 50 && <span style={{ fontSize: 10, color: "#1D9E75", fontWeight: 500 }}>✓ Looking good</span>}
            </div>
          </div>
        )}
      </div>

      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        .wish-card { min-height: 0; }
        .wish-list-items::-webkit-scrollbar { width: 4px; }
        .wish-list-items::-webkit-scrollbar-track { background: transparent; }
        .wish-list-items::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>
    </div>
  );
}