import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase();
  const admin = supabaseAdmin();

  const { data: listings } = await admin.from("listings").select("*").eq("status", "active");
  const now = Date.now();

  const filtered = (listings ?? []).filter((l) =>
    !q ||
    String(l.platform).toLowerCase().includes(q) ||
    String(l.plan_name).toLowerCase().includes(q)
  );

  const ranked = filtered.sort((a: any, b: any) => {
    const aBoost = a.boost_until && new Date(a.boost_until).getTime() > now ? 1 : 0;
    const bBoost = b.boost_until && new Date(b.boost_until).getTime() > now ? 1 : 0;
    if (aBoost !== bBoost) return bBoost - aBoost;
    if ((a.quality_score ?? 0) !== (b.quality_score ?? 0))
      return (b.quality_score ?? 0) - (a.quality_score ?? 0);
    return (b.capacity_available ?? 0) - (a.capacity_available ?? 0);
  });

  return NextResponse.json({ listings: ranked });
}
