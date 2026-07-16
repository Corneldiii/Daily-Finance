import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("Balance")
    .select("*")
    .order("createdAt", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ balances: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, amount } = body;

    if (!name || amount === undefined) {
      return NextResponse.json({ error: "Missing required fields: name, amount" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("Balance")
      .select("id")
      .eq("name", name)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("Balance")
        .update({ amount: Number(amount), updatedAt: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ balance: data });
    }

    const { data, error } = await supabase
      .from("Balance")
      .insert([{ name, amount: Number(amount) }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ balance: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
