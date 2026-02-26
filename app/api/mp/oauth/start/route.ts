import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL("https://auth.mercadopago.com.mx/authorization");
  url.searchParams.set("client_id", process.env.MP_CLIENT_ID!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", process.env.MP_REDIRECT_URI!);
  url.searchParams.set("state", auth.user.id); // MVP; sign in production

  return NextResponse.redirect(url.toString());
}
