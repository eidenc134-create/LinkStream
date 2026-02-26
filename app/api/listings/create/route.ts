import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const category = String(body.category ?? "").trim();
  const platform = String(body.platform ?? "").trim();
  const plan_name = String(body.plan_name ?? "").trim();
  const capacity_total = Number(body.capacity_total ?? 0);
  const price_cents = Number(body.price_cents ?? 0);
  const sla_minutes = Number(body.sla_minutes ?? 120);

  if (!category || !platform || !plan_name || capacity_total <= 0 || price_cents <= 0) {
    return NextResponse.json({ error: "missing/invalid fields" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("seller_verification")
    .eq("id", auth.user.id)
    .single();

  if (profile?.seller_verification !== "verified") {
    return NextResponse.json({ error: "seller not verified" }, { status: 403 });
  }

  await admin.from("sellers").upsert({
    user_id: auth.user.id,
    display_name: "Mi tienda",
    status: "active"
  });

  const { data, error } = await admin
    .from("listings")
    .insert({
      seller_id: auth.user.id,
      category,
      platform,
      plan_name,
      proof_plan_url: null,
      delivery_method: "invite_email",
      sla_minutes,
      capacity_total,
      capacity_available: capacity_total,
      price_cents,
      currency: "MXN",
      status: "active",
      quality_score: 50
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ listing: data });
}
