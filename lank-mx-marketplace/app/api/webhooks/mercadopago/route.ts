import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const admin = supabaseAdmin();
  const payload = await req.json().catch(() => ({}));
  const paymentId = payload?.data?.id || payload?.id;
  if (!paymentId) return NextResponse.json({ ok: true });

  const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_PLATFORM_ACCESS_TOKEN!}` }
  });
  if (!r.ok) return NextResponse.json({ ok: true });

  const payment = await r.json();
  const status = String(payment.status ?? "");
  const externalRef = String(payment.external_reference ?? "");
  if (!externalRef) return NextResponse.json({ ok: true });

  await admin.from("payments").update({
    mp_payment_id: String(payment.id),
    mp_status: status
  }).eq("order_id", externalRef);

  if (status === "approved") {
    const { data: order } = await admin.from("orders").select("id,listing_id").eq("id", externalRef).single();
    if (order?.listing_id) {
      const { data: listing } = await admin.from("listings").select("sla_minutes").eq("id", order.listing_id).single();
      const paidAt = new Date().toISOString();
      const deadline = new Date(Date.now() + Number(listing?.sla_minutes ?? 120) * 60 * 1000).toISOString();

      await admin.from("orders").update({
        status: "in_delivery",
        paid_at: paidAt,
        delivery_deadline_at: deadline
      }).eq("id", externalRef);
    }
  }

  return NextResponse.json({ ok: true });
}
