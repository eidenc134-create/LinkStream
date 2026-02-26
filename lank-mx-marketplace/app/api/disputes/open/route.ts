import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { orderId, reason } = await req.json();
  const admin = supabaseAdmin();

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (order.buyer_id !== auth.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await admin.from("disputes").insert({ order_id: orderId, opened_by: auth.user.id, reason: String(reason ?? "Sin detalles") });
  await admin.from("orders").update({ status: "disputed" }).eq("id", orderId);

  return NextResponse.json({ ok: true });
}
