import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { seatId, renewEveryDays } = await req.json();
  const admin = supabaseAdmin();

  const { data: seat } = await admin.from("seats").select("id,order_id,listing_id,buyer_id").eq("id", seatId).single();
  if (!seat || seat.buyer_id !== auth.user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: order } = await admin.from("orders").select("seller_id").eq("id", seat.order_id).single();
  if (!order) return NextResponse.json({ error: "order missing" }, { status: 400 });

  const days = Math.max(7, Math.min(60, Number(renewEveryDays ?? 30)));
  const next = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();

  await admin.from("subscriptions_internal").insert({
    buyer_id: auth.user.id,
    listing_id: seat.listing_id,
    seller_id: order.seller_id,
    seat_id: seat.id,
    renew_every_days: days,
    next_renew_at: next,
    status: "active"
  });

  return NextResponse.json({ ok: true });
}
