"use client";
import { useState } from "react";

export default function SellerDashboard() {
  const [msg, setMsg] = useState("");

  async function createListing(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const form = new FormData(e.target as HTMLFormElement);

    const payload = {
      category: form.get("category"),
      platform: form.get("platform"),
      plan_name: form.get("plan_name"),
      capacity_total: Number(form.get("capacity_total")),
      price_cents: Math.round(Number(form.get("price_mxn")) * 100),
      sla_minutes: Number(form.get("sla_minutes") || 120)
    };

    const r = await fetch("/api/listings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!r.ok) setMsg(await r.text());
    else setMsg("Listing creado ✅");
  }

  return (
    <main>
      <h2>Panel vendedor</h2>
      <p>
        <a href="/dashboard">← Dashboard</a> · <a href="/api/mp/oauth/start">Conectar MP</a>
      </p>

      <h3>Crear listing</h3>
      <form onSubmit={createListing} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <input name="category" placeholder="category (streaming/software/etc)" defaultValue="streaming" />
        <input name="platform" placeholder="platform (ej. Netflix)" />
        <input name="plan_name" placeholder="plan_name (ej. Premium)" />
        <input name="capacity_total" type="number" placeholder="cupos totales" defaultValue="5" />
        <input name="price_mxn" type="number" placeholder="precio por cupo (MXN)" defaultValue="99" />
        <input name="sla_minutes" type="number" placeholder="SLA (min)" defaultValue="120" />
        <button type="submit">Publicar</button>
      </form>

      {msg && <p style={{ color: msg.includes("✅") ? "green" : "crimson" }}>{msg}</p>}

      <p style={{ marginTop: 20 }}>
        Para publicar, tu usuario debe estar <strong>seller_verification=verified</strong> en la tabla profiles.
      </p>
    </main>
  );
}
