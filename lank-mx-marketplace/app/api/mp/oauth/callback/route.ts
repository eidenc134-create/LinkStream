import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { mpOAuthTokenExchange } from "@/lib/mp";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) return NextResponse.json({ error: "missing code/state" }, { status: 400 });

  const token = await mpOAuthTokenExchange(code);
  const expiresAt = new Date(Date.now() + Number(token.expires_in ?? 0) * 1000).toISOString();

  const admin = supabaseAdmin();
  await admin.from("sellers").upsert({
    user_id: state,
    mp_user_id: String(token.user_id ?? ""),
    mp_access_token: token.access_token,
    mp_refresh_token: token.refresh_token,
    mp_token_expires_at: expiresAt,
    status: "active",
    display_name: "Mi tienda"
  });

  return NextResponse.redirect(`${process.env.APP_URL}/seller/dashboard?mp=connected`);
}
