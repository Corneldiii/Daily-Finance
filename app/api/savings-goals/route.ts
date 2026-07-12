import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("SavingGoal")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goals: data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.targetAmount) {
      return NextResponse.json({ error: "Missing required fields: name, targetAmount" }, { status: 400 });
    }

    const insertData = {
      name: body.name,
      targetAmount: Number(body.targetAmount),
      savedAmount: Number(body.savedAmount) || 0,
      icon: body.icon || "🏖️",
      deadline: body.deadline || null,
    };

    const { data, error } = await supabase
      .from("SavingGoal")
      .insert([insertData])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ goal: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
