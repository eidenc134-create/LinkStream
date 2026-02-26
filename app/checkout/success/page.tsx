export default function Success({ searchParams }: { searchParams: { orderId?: string } }) {
  return (
    <main>
      <h2>Pago aprobado</h2>
      <p>Orden: {searchParams.orderId}</p>
      <p>Ahora el vendedor te enviará una invitación por email. Tu pago está protegido por 24h.</p>
      <a href="/dashboard">Ir al dashboard</a>
    </main>
  );
}
