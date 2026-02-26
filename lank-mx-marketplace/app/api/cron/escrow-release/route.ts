import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isInternalJob } from "@/lib/security";

export async function POST(req: Request) {
  if (!isInternalJob(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  const { data: orders } = await admin
    .from("orders")
    .select("id")
    .in("status", ["paid", "in_delivery"])
    .lte("escrow_release_at", now);

  let released = 0;
  for (const o of orders ?? []) {
    const { data: dispute } = await admin.from("disputes").select("id").eq("order_id", o.id).eq("status", "open").maybeSingle();
    if (dispute) continue;

    await admin.from("orders").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", o.id);
    await admin.from("seats").update({ status: "active", delivered_at: new Date().toISOString() }).eq("order_id", o.id);
    released++;
  }

  return NextResponse.json({ ok: true, released });
}
