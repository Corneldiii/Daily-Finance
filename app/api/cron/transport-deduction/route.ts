import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const TRANSPORT_AMOUNT = 3500;
const WIB_OFFSET = 7 * 60 * 60 * 1000;

function getWIBDate(): Date {
  const utc = Date.now();
  return new Date(utc + WIB_OFFSET);
}

export async function POST(req: NextRequest) {
  try {
    const wibNow = getWIBDate();
    const dayOfWeek = wibNow.getUTCDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    if (!isWeekday) {
      return NextResponse.json({
        success: false,
        message: "Weekend, skipping deduction",
        dayOfWeek,
      });
    }

    const hours = wibNow.getUTCHours();
    if (hours !== 8) {
      return NextResponse.json({
        success: false,
        message: "Not 8 AM, skipping deduction",
      });
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
      return NextResponse.json({
        success: false,
        message: "Already deducted today",
        transactionId: existingTx.id,
      });
    }

    const { data: balance } = await supabase
      .from("Balance")
      .select("id, amount")
      .eq("name", "E-Money")
      .single();

    if (!balance || balance.amount < TRANSPORT_AMOUNT) {
      return NextResponse.json({
        success: false,
        message: "Insufficient e-money balance",
        currentBalance: balance?.amount || 0,
      });
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

    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

    const { error: balError } = await supabase
      .from("Balance")
      .update({ amount: balance.amount - TRANSPORT_AMOUNT, updatedAt: new Date().toISOString() })
      .eq("id", balance.id);

    if (balError) return NextResponse.json({ error: balError.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      message: `Transport deducted Rp ${TRANSPORT_AMOUNT.toLocaleString("id-ID")} from E-Money`,
      newBalance: balance.amount - TRANSPORT_AMOUNT,
      date: dateStr,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  const wibNow = getWIBDate();
  const dateStr = wibNow.toISOString().split("T")[0];
  const dayOfWeek = wibNow.getUTCDay();

  const { data: todayTx } = await supabase
    .from("Transaction")
    .select("id, amount, date")
    .eq("title", "Transport Auto-Deduction")
    .eq("date", dateStr)
    .eq("category", "Transport")
    .single();

  const { data: balance } = await supabase
    .from("Balance")
    .select("amount")
    .eq("name", "E-Money")
    .single();

  return NextResponse.json({
    today: dateStr,
    dayOfWeek,
    dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek],
    isWeekday: dayOfWeek >= 1 && dayOfWeek <= 5,
    alreadyDeducted: !!todayTx,
    eMoneyBalance: balance?.amount || 0,
    deductionAmount: TRANSPORT_AMOUNT,
  });
}
