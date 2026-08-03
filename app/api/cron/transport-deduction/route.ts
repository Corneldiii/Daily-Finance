import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TRANSPORT_AMOUNT = 3500;
const WIB_OFFSET = 7 * 60 * 60 * 1000;

function getWIBDate(): Date {
  const utc = Date.now();
  return new Date(utc + WIB_OFFSET);
}

async function performDeduction() {
  const wibNow = getWIBDate();
  const dayOfWeek = wibNow.getUTCDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  if (!isWeekday) {
    return { status: 200, body: {
      success: false,
      message: "Weekend, skipping deduction",
      dayOfWeek,
    } };
  }

  const hours = wibNow.getUTCHours();
  if (hours !== 8) {
    return { status: 200, body: {
      success: false,
      message: "Not 8 AM, skipping deduction",
    } };
  }

  const dateStr = wibNow.toISOString().split("T")[0];

  const { data: existingTx } = await supabase
    .from("Transaction")
    .select("id")
    .eq("title", "Transport Auto-Deduction")
    .eq("date", dateStr)
    .eq("category", "Transport")
    .single();

  if (existingTx) {
    return { status: 200, body: {
      success: false,
      message: "Already deducted today",
      transactionId: existingTx.id,
    } };
  }

  const { data: balance } = await supabase
    .from("Balance")
    .select("id, amount")
    .eq("name", "E-Money")
    .single();

  if (!balance || balance.amount < TRANSPORT_AMOUNT) {
    return { status: 200, body: {
      success: false,
      message: "Insufficient e-money balance",
      currentBalance: balance?.amount || 0,
    } };
  }

  const { error: txError } = await supabase
    .from("Transaction")
    .insert([{
      title: "Transport Auto-Deduction",
      amount: TRANSPORT_AMOUNT,
      type: "expense",
      category: "Transport",
      date: dateStr,
    }]);

  if (txError) return { status: 500, body: { error: txError.message } };

  const { error: balError } = await supabase
    .from("Balance")
    .update({ amount: balance.amount - TRANSPORT_AMOUNT, updatedAt: new Date().toISOString() })
    .eq("id", balance.id);

  if (balError) return { status: 500, body: { error: balError.message } };

  return { status: 200, body: {
    success: true,
    message: `Transport deducted Rp ${TRANSPORT_AMOUNT.toLocaleString("id-ID")} from E-Money`,
    newBalance: balance.amount - TRANSPORT_AMOUNT,
    date: dateStr,
  } };
}

export async function POST() {
  try {
    const { status, body } = await performDeduction();
    return NextResponse.json(body, { status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { status, body } = await performDeduction();
    return NextResponse.json({ ...body, request: "GET" }, { status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
