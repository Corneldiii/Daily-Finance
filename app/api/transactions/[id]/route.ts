import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabase
    .from("Transaction")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabase
    .from("Transaction")
    .update({
      title: body.title,
      amount: body.amount,
      type: body.type,
      category: body.category,
      date: body.date,
      ...(body.adminFee !== undefined ? { adminFee: body.adminFee } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ transaction: data });
}