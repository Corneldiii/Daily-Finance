import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.amount || body.amount <= 0 || !body.monthKey) {
      return NextResponse.json({ error: "Missing amount or monthKey" }, { status: 400 });
    }

    const existing = await supabase
      .from("InstallmentPayment")
      .select("id")
      .eq("installmentId", id)
      .eq("monthKey", body.monthKey)
      .single();

    if (existing.data) {
      await supabase.from("InstallmentPayment").delete().eq("id", existing.data.id);
      return NextResponse.json({ paid: false });
    }

    const { data, error } = await supabase
      .from("InstallmentPayment")
      .insert([{
        installmentId: id,
        amount: Number(body.amount),
        monthKey: body.monthKey,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ paid: true, payment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
