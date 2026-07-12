import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("RecurringItem")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.amount || !body.type || !body.category) {
      return NextResponse.json({ error: "Missing required fields: title, amount, type, category" }, { status: 400 });
    }

    const insertData = {
      title: body.title,
      amount: Number(body.amount),
      type: body.type,
      category: body.category,
      dayOfMonth: Number(body.dayOfMonth) || 1,
      active: body.active !== undefined ? body.active : true,
    };

    const { data, error } = await supabase
      .from("RecurringItem")
      .insert([insertData])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
