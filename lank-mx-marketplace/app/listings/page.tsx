async function getListings() {
  const r = await fetch(`${process.env.APP_URL}/api/listings/search`, { cache: "no-store" });
  return r.json();
}

export default async function ListingsPage() {
  const { listings } = await getListings();
  return (
    <main>
      <h2>Planes disponibles</h2>
      <p><a href="/">Inicio</a></p>
      <ul>
        {(listings ?? []).map((l: any) => (
          <li key={l.id} style={{ marginBottom: 10 }}>
            <a href={`/listings/${l.id}`}>{l.platform} - {l.plan_name}</a>
            <div style={{ fontSize: 14 }}>
              Cupos: {l.capacity_available}/{l.capacity_total} · Precio: ${(l.price_cents / 100).toFixed(2)} MXN · SLA: {l.sla_minutes} min
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
