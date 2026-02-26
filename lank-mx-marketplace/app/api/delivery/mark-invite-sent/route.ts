import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { containsCredentials } from "@/lib/security";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { orderId, invitedEmail, note } = await req.json();
  const admin = supabaseAdmin();

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (order.seller_id !== auth.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!["in_delivery", "paid"].includes(order.status)) return NextResponse.json({ error: "bad status" }, { status: 400 });

  const noteText = note ? String(note) : "";
  if (containsCredentials(noteText)) {
    return NextResponse.json({ error: "No se permiten credenciales en notas." }, { status: 400 });
  }

  await admin.from("delivery_events").insert({
    order_id: order.id,
    seller_id: order.seller_id,
    buyer_id: order.buyer_id,
    method: "invite_email",
    invited_email: String(invitedEmail ?? "").trim(),
    note: noteText || null
  });

  await admin.from("orders").update({
    status: "in_delivery",
    delivered_marked_at: new Date().toISOString()
  }).eq("id", order.id);

  return NextResponse.json({ ok: true });
}
