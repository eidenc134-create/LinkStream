import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fee10 } from "@/lib/security";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { listingId, quantity, payMethodHint } = await req.json();
  const qty = Math.max(1, Math.min(10, Number(quantity ?? 1)));

  const admin = supabaseAdmin();
  const { data: listing } = await admin.from("listings").select("*").eq("id", listingId).single();
  if (!listing) return NextResponse.json({ error: "listing not found" }, { status: 404 });
  if (listing.status !== "active") return NextResponse.json({ error: "listing inactive" }, { status: 400 });
  if (listing.capacity_available < qty) return NextResponse.json({ error: "not enough seats" }, { status: 400 });

  const subtotal = listing.price_cents * qty;
  const platformFee = fee10(subtotal);
  const sellerPayout = subtotal - platformFee;
  const totalBuyerPays = subtotal;

  const hint = String(payMethodHint ?? "").toLowerCase();
  const reservationMinutes = hint === "oxxo" || hint === "spei" ? 12 * 60 : 30;
  const reservationExpires = new Date(Date.now() + reservationMinutes * 60 * 1000).toISOString();

  const newAvail = listing.capacity_available - qty;
  const { error: e2 } = await admin
    .from("listings")
    .update({ capacity_available: newAvail, status: newAvail === 0 ? "sold_out" : "active" })
    .eq("id", listingId)
    .eq("capacity_available", listing.capacity_available);

  if (e2) return NextResponse.json({ error: "race condition, retry" }, { status: 409 });

  const escrowHours = Number(process.env.ESCROW_HOURS ?? "24");
  const escrowReleaseAt = new Date(Date.now() + escrowHours * 3600 * 1000).toISOString();

  const { data: order, error: e3 } = await admin
    .from("orders")
    .insert({
      listing_id: listingId,
      seller_id: listing.seller_id,
      buyer_id: auth.user.id,
      quantity: qty,
      subtotal_cents: subtotal,
      platform_fee_cents: platformFee,
      seller_payout_cents: sellerPayout,
      total_cents: totalBuyerPays,
      currency: "MXN",
      status: "pending_payment",
      escrow_release_at: escrowReleaseAt,
      payment_reservation_expires_at: reservationExpires
    })
    .select()
    .single();

  if (e3) return NextResponse.json({ error: e3.message }, { status: 400 });

  const seats = Array.from({ length: qty }).map(() => ({
    order_id: order.id,
    listing_id: listingId,
    buyer_id: auth.user.id,
    status: "pending"
  }));
  await admin.from("seats").insert(seats);

  await admin.from("payments").insert({
    order_id: order.id,
    provider: "mercadopago",
    amount_cents: totalBuyerPays,
    currency: "MXN"
  });

  return NextResponse.json({ orderId: order.id });
}
