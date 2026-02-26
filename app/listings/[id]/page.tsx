"use client";
import { useEffect, useState } from "react";

export default function ListingDetail({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/listings/search");
      const { listings } = await r.json();
      setListing((listings ?? []).find((x: any) => x.id === params.id) || null);
    })();
  }, [params.id]);

  async function buy() {
    setMsg("");
    const r1 = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: params.id, quantity: qty, payMethodHint: "card" })
    });
    if (!r1.ok) return setMsg(await r1.text());
    const { orderId } = await r1.json();

    const r2 = await fetch("/api/payments/mp/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId })
    });
    if (!r2.ok) return setMsg(await r2.text());
    const { init_point } = await r2.json();
    window.location.href = init_point;
  }

  if (!listing) return <main>Cargando...</main>;

  return (
    <main>
      <p><a href="/listings">← Volver</a></p>
      <h2>{listing.platform} - {listing.plan_name}</h2>
      <p>Cupos: {listing.capacity_available}/{listing.capacity_total}</p>
      <p>Entrega: invite_email (sin contraseñas) · SLA: {listing.sla_minutes} min</p>
      <p>Precio: ${(listing.price_cents / 100).toFixed(2)} MXN por cupo</p>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>Cantidad:</label>
        <input type="number" min={1} max={10} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
        <button onClick={buy}>Comprar y pagar</button>
      </div>
      {msg && <p style={{ color: "crimson" }}>{msg}</p>}
    </main>
  );
}
