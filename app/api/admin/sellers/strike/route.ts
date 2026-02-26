import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = supabaseAdmin();
  const { data: me } = await admin.from("profiles").select("role").eq("id", auth.user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { sellerId } = await req.json();
  const { data: seller } = await admin.from("sellers").select("strikes").eq("user_id", sellerId).single();
  const strikes = Number(seller?.strikes ?? 0) + 1;

  await admin.from("sellers").update({ strikes, status: strikes >= 3 ? "suspended" : "active" }).eq("user_id", sellerId);
  if (strikes >= 3) await admin.from("listings").update({ status: "paused" }).eq("seller_id", sellerId);

  return NextResponse.json({ ok: true, strikes });
}
