import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { orderId } = await req.json();
  const admin = supabaseAdmin();

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (order.buyer_id !== auth.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: dispute } = await admin.from("disputes").select("id").eq("order_id", orderId).eq("status", "open").maybeSingle();
  if (dispute) return NextResponse.json({ error: "dispute open" }, { status: 409 });

  await admin.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", orderId);
  await admin.from("seats").update({ status: "active", delivered_at: new Date().toISOString() }).eq("order_id", orderId);

  if (order.seller_id && order.paid_at) {
    const mins = Math.max(0, Math.round((Date.now() - new Date(order.paid_at).getTime()) / 60000));
    const onTime = order.delivery_deadline_at ? Date.now() <= new Date(order.delivery_deadline_at).getTime() : true;

    const { data: seller } = await admin
      .from("sellers")
      .select("avg_delivery_minutes,rating_count,sla_on_time_rate")
      .eq("user_id", order.seller_id)
      .single();

    const count = Number(seller?.rating_count ?? 0);
    const prevAvg = Number(seller?.avg_delivery_minutes ?? 0);
    const prevRate = Number(seller?.sla_on_time_rate ?? 0);

    const newAvg = Math.round((prevAvg * count + mins) / (count + 1));
    const newRate = ((prevRate * count) + (onTime ? 1 : 0)) / (count + 1);

    await admin.from("sellers").update({ avg_delivery_minutes: newAvg, sla_on_time_rate: newRate }).eq("user_id", order.seller_id);
  }

  return NextResponse.json({ ok: true });
}
