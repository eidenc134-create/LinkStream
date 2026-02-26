import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { orderId, rating, deliverySpeedRating, comment } = await req.json();
  const admin = supabaseAdmin();

  const { data: order } = await admin.from("orders").select("id,buyer_id,seller_id,status").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });
  if (order.buyer_id !== auth.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (order.status !== "delivered") return NextResponse.json({ error: "only after delivered" }, { status: 400 });

  const r = Math.max(1, Math.min(5, Number(rating)));
  const rs = Math.max(1, Math.min(5, Number(deliverySpeedRating)));

  const { error: e1 } = await admin.from("reviews").insert({
    order_id: orderId,
    seller_id: order.seller_id,
    buyer_id: auth.user.id,
    rating: r,
    delivery_speed_rating: rs,
    comment: comment ? String(comment) : null
  });

  if (e1) return NextResponse.json({ error: e1.message }, { status: 400 });

  const { data: seller } = await admin.from("sellers").select("rating_avg,rating_count").eq("user_id", order.seller_id).single();
  const count = Number(seller?.rating_count ?? 0);
  const avg = Number(seller?.rating_avg ?? 0);
  const newAvg = (avg * count + r) / (count + 1);

  await admin.from("sellers").update({ rating_avg: newAvg, rating_count: count + 1 }).eq("user_id", order.seller_id);
  return NextResponse.json({ ok: true });
}
