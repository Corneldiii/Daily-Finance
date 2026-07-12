import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: installments, error: instErr } = await supabase
    .from("Installment")
    .select("*")
    .order("createdAt", { ascending: false });

  if (instErr) return NextResponse.json({ error: instErr.message }, { status: 500 });

  const { data: payments, error: payErr } = await supabase
    .from("InstallmentPayment")
    .select("*");

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  return NextResponse.json({ installments: installments || [], payments: payments || [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.totalAmount || !body.source || !body.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const insertData = {
      name: body.name,
      totalAmount: Number(body.totalAmount),
      tenure: Number(body.tenure) || -1,
      interestRate: Number(body.interestRate) || 0,
      source: body.source,
      description: body.description || "",
      type: body.type,
      startDate: body.startDate,
    };

    const { data, error } = await supabase
      .from("Installment")
      .insert([insertData])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ installment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
