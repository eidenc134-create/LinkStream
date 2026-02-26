export default function Failure({ searchParams }: { searchParams: { orderId?: string } }) {
  return (
    <main>
      <h2>Pago fallido</h2>
      <p>Orden: {searchParams.orderId}</p>
      <a href="/listings">Volver a intentar</a>
    </main>
  );
}
