import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const { data, error } = await supabase
    .from("Balance")
    .select("*")
    .eq("name", name)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ balance: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const body = await req.json();
  const { amount } = body;

  if (amount === undefined) {
    return NextResponse.json({ error: "Missing required field: amount" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("Balance")
    .select("id, amount")
    .eq("name", name)
    .single();

  if (!existing) {
    const initialAmount = body.delta !== undefined ? Number(body.delta) : Number(amount);
    const { data, error } = await supabase
      .from("Balance")
      .insert([{ name, amount: initialAmount }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ balance: data });
  }

  const newAmount = body.delta !== undefined ? existing.amount + Number(body.delta) : Number(amount);

  const { data, error } = await supabase
    .from("Balance")
    .update({ amount: newAmount, updatedAt: new Date().toISOString() })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ balance: data });
}
