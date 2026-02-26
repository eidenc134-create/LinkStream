import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const admin = supabaseAdmin();
  const { orderId } = await req.json();

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

  const { data: listing } = await admin
    .from("listings")
    .select("platform,plan_name")
    .eq("id", order.listing_id)
    .single();
  if (!listing) return NextResponse.json({ error: "listing missing" }, { status: 400 });

  const { data: seller } = await admin
    .from("sellers")
    .select("mp_access_token")
    .eq("user_id", order.seller_id)
    .single();
  if (!seller?.mp_access_token) return NextResponse.json({ error: "seller not connected to MP" }, { status: 400 });

  const marketplaceFee = order.platform_fee_cents / 100;

  const preferencePayload = {
    items: [
      {
        title: `${listing.platform} - ${listing.plan_name} (cupo)`,
        quantity: order.quantity,
        unit_price: (order.total_cents / 100) / order.quantity
      }
    ],
    external_reference: order.id,
    marketplace_fee: marketplaceFee,
    back_urls: {
      success: `${process.env.APP_URL}/checkout/success?orderId=${order.id}`,
      pending: `${process.env.APP_URL}/checkout/pending?orderId=${order.id}`,
      failure: `${process.env.APP_URL}/checkout/failure?orderId=${order.id}`
    },
    auto_return: "approved",
    notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`
  };

  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${seller.mp_access_token}`
    },
    body: JSON.stringify(preferencePayload)
  });

  if (!r.ok) return NextResponse.json({ error: "mp preference failed", detail: await r.text() }, { status: 400 });

  const pref = await r.json();
  await admin.from("payments").update({ mp_preference_id: pref.id }).eq("order_id", order.id);

  return NextResponse.json({ init_point: pref.init_point, preference_id: pref.id });
}
