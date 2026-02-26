export default function Pending({ searchParams }: { searchParams: { orderId?: string } }) {
  return (
    <main>
      <h2>Pago pendiente</h2>
      <p>Orden: {searchParams.orderId}</p>
      <p>Si pagaste por OXXO/SPEI, espera la confirmación. Tu cupo está reservado por un tiempo limitado.</p>
      <a href="/dashboard">Ir al dashboard</a>
    </main>
  );
}
