export async function mpOAuthTokenExchange(code: string) {
  const body = new URLSearchParams();
  body.set("client_secret", process.env.MP_CLIENT_SECRET!);
  body.set("client_id", process.env.MP_CLIENT_ID!);
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", process.env.MP_REDIRECT_URI!);

  const r = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
